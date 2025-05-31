-- #################################################
-- 1. Alert-Tabelle
-- #################################################

CREATE TABLE IF NOT EXISTS public.test_alerts (
    id           SERIAL PRIMARY KEY,
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    suite_name   TEXT NOT NULL,
    metric       TEXT NOT NULL CHECK (metric IN ('avg_duration', 'error_rate', 'peak_duration', 'moving_avg')),
    threshold    NUMERIC NOT NULL,
    actual_value NUMERIC NOT NULL,
    status       TEXT NOT NULL CHECK (status IN ('NEW', 'ACKNOWLEDGED', 'RESOLVED')),
    resolved_at  TIMESTAMP WITH TIME ZONE,
    resolved_by  UUID REFERENCES auth.users(id),
    details      JSONB,
    CONSTRAINT valid_resolution CHECK (
        (status = 'RESOLVED' AND resolved_at IS NOT NULL AND resolved_by IS NOT NULL) OR
        (status != 'RESOLVED' AND resolved_at IS NULL AND resolved_by IS NULL)
    )
);

-- RLS für test_alerts
ALTER TABLE public.test_alerts ENABLE ROW LEVEL SECURITY;

-- Alle Auth-User können Alerts sehen
CREATE POLICY "Alerts sichtbar für alle Auth-User" ON public.test_alerts
    FOR SELECT TO authenticated USING (true);

-- Nur Admin-User können Alerts auflösen
CREATE POLICY "Alerts auflösbar für Admins" ON public.test_alerts
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- #################################################
-- 2. Alert-Schwellwerte-Konfiguration
-- #################################################

CREATE TABLE IF NOT EXISTS public.test_alert_thresholds (
    id          SERIAL PRIMARY KEY,
    suite_name  TEXT NOT NULL,
    metric      TEXT NOT NULL CHECK (metric IN ('avg_duration', 'error_rate', 'peak_duration', 'moving_avg')),
    threshold   NUMERIC NOT NULL,
    enabled     BOOLEAN DEFAULT true,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by  UUID DEFAULT auth.uid() REFERENCES auth.users(id),
    UNIQUE (suite_name, metric)
);

-- Default-Schwellwerte einfügen
INSERT INTO public.test_alert_thresholds (suite_name, metric, threshold) VALUES
    ('test_datenmengen', 'avg_duration', 2000),    -- 2 Sekunden durchschnittliche Dauer
    ('test_datenmengen', 'error_rate', 5),         -- 5% Fehlerrate
    ('test_kollisionen', 'avg_duration', 1000),    -- 1 Sekunde durchschnittliche Dauer
    ('test_kollisionen', 'error_rate', 5),         -- 5% Fehlerrate
    ('test_datenformate', 'error_rate', 2),        -- 2% Fehlerrate für Datenformat-Tests
    ('test_rls_edge_cases', 'error_rate', 1);      -- 1% Fehlerrate für RLS-Tests (strenger)

-- #################################################
-- 3. Alert-Trigger-Funktion
-- #################################################

CREATE OR REPLACE FUNCTION public.check_test_alerts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_threshold RECORD;
    v_avg_duration NUMERIC;
    v_error_rate NUMERIC;
    v_moving_avg NUMERIC;
    v_peak_duration NUMERIC;
BEGIN
    -- Für jede aktive Threshold-Konfiguration prüfen
    FOR v_threshold IN 
        SELECT * FROM public.test_alert_thresholds 
        WHERE suite_name = NEW.suite_name 
        AND enabled = true
    LOOP
        CASE v_threshold.metric
            -- Durchschnittliche Dauer prüfen
            WHEN 'avg_duration' THEN
                SELECT AVG(duration_ms)
                INTO v_avg_duration
                FROM public.test_results_agg
                WHERE suite_name = NEW.suite_name
                AND run_timestamp >= NOW() - INTERVAL '1 day';

                IF v_avg_duration > v_threshold.threshold THEN
                    INSERT INTO public.test_alerts (
                        suite_name, metric, threshold, actual_value, status, details
                    ) VALUES (
                        NEW.suite_name,
                        'avg_duration',
                        v_threshold.threshold,
                        v_avg_duration,
                        'NEW',
                        jsonb_build_object(
                            'run_timestamp', NEW.run_timestamp,
                            'measurement_window', '24 hours',
                            'test_run_id', NEW.id
                        )
                    );
                END IF;

            -- Fehlerrate prüfen
            WHEN 'error_rate' THEN
                WITH current_run AS (
                    SELECT 
                        COUNT(*) as total,
                        COUNT(*) FILTER (WHERE status = 'FAIL') as failures
                    FROM public.test_results_agg
                    WHERE suite_name = NEW.suite_name
                    AND run_timestamp = NEW.run_timestamp
                )
                SELECT 
                    ROUND(100.0 * failures / NULLIF(total, 0), 2)
                INTO v_error_rate
                FROM current_run;

                IF v_error_rate > v_threshold.threshold THEN
                    INSERT INTO public.test_alerts (
                        suite_name, metric, threshold, actual_value, status, details
                    ) VALUES (
                        NEW.suite_name,
                        'error_rate',
                        v_threshold.threshold,
                        v_error_rate,
                        'NEW',
                        jsonb_build_object(
                            'run_timestamp', NEW.run_timestamp,
                            'test_run_id', NEW.id
                        )
                    );
                END IF;

            -- Moving Average prüfen
            WHEN 'moving_avg' THEN
                SELECT AVG(duration_ms)
                INTO v_moving_avg
                FROM (
                    SELECT duration_ms
                    FROM public.test_results_agg
                    WHERE suite_name = NEW.suite_name
                    AND status = 'SUCCESS'
                    ORDER BY run_timestamp DESC
                    LIMIT 5
                ) recent;

                IF v_moving_avg > v_threshold.threshold THEN
                    INSERT INTO public.test_alerts (
                        suite_name, metric, threshold, actual_value, status, details
                    ) VALUES (
                        NEW.suite_name,
                        'moving_avg',
                        v_threshold.threshold,
                        v_moving_avg,
                        'NEW',
                        jsonb_build_object(
                            'run_timestamp', NEW.run_timestamp,
                            'measurement_window', 'last 5 runs',
                            'test_run_id', NEW.id
                        )
                    );
                END IF;

            -- Peak-Dauer prüfen
            WHEN 'peak_duration' THEN
                SELECT MAX(duration_ms)
                INTO v_peak_duration
                FROM public.test_results_agg
                WHERE suite_name = NEW.suite_name
                AND run_timestamp = NEW.run_timestamp;

                IF v_peak_duration > v_threshold.threshold THEN
                    INSERT INTO public.test_alerts (
                        suite_name, metric, threshold, actual_value, status, details
                    ) VALUES (
                        NEW.suite_name,
                        'peak_duration',
                        v_threshold.threshold,
                        v_peak_duration,
                        'NEW',
                        jsonb_build_object(
                            'run_timestamp', NEW.run_timestamp,
                            'test_run_id', NEW.id
                        )
                    );
                END IF;
        END CASE;
    END LOOP;

    RETURN NEW;
END;
$$;

-- Trigger für Alert-Checks
CREATE TRIGGER trg_check_test_alerts
    AFTER INSERT ON public.test_results_agg
    FOR EACH ROW
    EXECUTE FUNCTION public.check_test_alerts();

-- #################################################
-- 4. Alert-Visualisierungs-Views
-- #################################################

-- Aktuelle Alerts
CREATE OR REPLACE VIEW public.vw_current_alerts AS
WITH alert_counts AS (
    SELECT 
        suite_name,
        metric,
        COUNT(*) as alert_count
    FROM public.test_alerts
    WHERE status = 'NEW'
    GROUP BY suite_name, metric
)
SELECT
    a.id,
    a.created_at,
    a.suite_name,
    a.metric,
    a.threshold,
    a.actual_value,
    ROUND((a.actual_value - a.threshold) / a.threshold * 100, 2) as threshold_exceeded_pct,
    a.status,
    a.details,
    ac.alert_count as similar_alerts_count,
    u.email as created_for_user
FROM public.test_alerts a
LEFT JOIN alert_counts ac ON 
    a.suite_name = ac.suite_name AND 
    a.metric = ac.metric
LEFT JOIN auth.users u ON 
    (a.details->>'run_by')::uuid = u.id
WHERE a.status = 'NEW'
ORDER BY 
    a.created_at DESC,
    a.suite_name,
    a.metric;

-- Alert-Historie
CREATE OR REPLACE VIEW public.vw_alert_history AS
SELECT
    a.id,
    a.created_at,
    a.suite_name,
    a.metric,
    a.threshold,
    a.actual_value,
    ROUND((a.actual_value - a.threshold) / a.threshold * 100, 2) as threshold_exceeded_pct,
    a.status,
    a.resolved_at,
    ru.email as resolved_by_user,
    EXTRACT(EPOCH FROM (a.resolved_at - a.created_at)) as resolution_time_seconds,
    a.details
FROM public.test_alerts a
LEFT JOIN auth.users ru ON a.resolved_by = ru.id
ORDER BY 
    CASE a.status 
        WHEN 'NEW' THEN 0
        WHEN 'ACKNOWLEDGED' THEN 1
        ELSE 2
    END,
    a.created_at DESC;

-- #################################################
-- 5. Alert-Management-Funktionen
-- #################################################

-- Funktion zum Auflösen eines Alerts
CREATE OR REPLACE FUNCTION public.resolve_alert(
    p_alert_id INTEGER,
    p_resolution_note TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Prüfen, ob der User Admin-Rechte hat
    IF NOT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Insufficient privileges to resolve alerts';
    END IF;

    -- Alert auflösen
    UPDATE public.test_alerts
    SET 
        status = 'RESOLVED',
        resolved_at = NOW(),
        resolved_by = auth.uid(),
        details = jsonb_set(
            COALESCE(details, '{}'::jsonb),
            '{resolution_note}',
            to_jsonb(p_resolution_note)
        )
    WHERE id = p_alert_id
    AND status != 'RESOLVED';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Alert not found or already resolved';
    END IF;
END;
$$;

-- Funktion zum Aktualisieren von Alert-Schwellwerten
CREATE OR REPLACE FUNCTION public.update_alert_threshold(
    p_suite_name TEXT,
    p_metric TEXT,
    p_new_threshold NUMERIC,
    p_enabled BOOLEAN DEFAULT true
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Prüfen, ob der User Admin-Rechte hat
    IF NOT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Insufficient privileges to update thresholds';
    END IF;

    -- Threshold aktualisieren oder neu anlegen
    INSERT INTO public.test_alert_thresholds (
        suite_name, metric, threshold, enabled, created_by
    ) VALUES (
        p_suite_name, p_metric, p_new_threshold, p_enabled, auth.uid()
    )
    ON CONFLICT (suite_name, metric) DO UPDATE
    SET 
        threshold = p_new_threshold,
        enabled = p_enabled,
        created_at = NOW(),
        created_by = auth.uid();
END;
$$;

-- Kommentare für neue Objekte
COMMENT ON TABLE public.test_alerts IS 'Speichert Test-Alerts bei Überschreitung von Schwellwerten';
COMMENT ON TABLE public.test_alert_thresholds IS 'Konfigurierbare Schwellwerte für Test-Alerts';
COMMENT ON VIEW public.vw_current_alerts IS 'Zeigt aktuelle, unaufgelöste Alerts mit Kontext';
COMMENT ON VIEW public.vw_alert_history IS 'Historische Übersicht aller Alerts mit Auflösungsdetails';
COMMENT ON FUNCTION public.check_test_alerts IS 'Trigger-Funktion zur Überprüfung von Alert-Bedingungen';
COMMENT ON FUNCTION public.resolve_alert IS 'Funktion zum Auflösen eines Alerts durch einen Admin';
COMMENT ON FUNCTION public.update_alert_threshold IS 'Funktion zum Aktualisieren von Alert-Schwellwerten'; 
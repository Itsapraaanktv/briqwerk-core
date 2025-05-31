-- #################################################
-- 1. Monitoring-Views für Performance und Fehleranalyse
-- #################################################

-- View für Verarbeitungsstatistiken
CREATE OR REPLACE VIEW public.verarbeitungs_statistik AS
SELECT
    user_id,
    DATE_TRUNC('hour', zeitpunkt) AS stunde,
    COUNT(*) AS anzahl_verarbeitungen,
    COUNT(*) FILTER (WHERE fehlertyp = 'SUCCESS') AS erfolgreiche,
    COUNT(*) FILTER (WHERE fehlertyp = 'CRITICAL_ERROR') AS kritische_fehler,
    COUNT(*) FILTER (WHERE fehlertyp = 'CHECK_VIOLATION') AS validierungs_fehler,
    AVG((zusatz_info->>'dauer_sekunden')::numeric) AS durchschnittliche_dauer_sekunden,
    MAX((zusatz_info->>'dauer_sekunden')::numeric) AS maximale_dauer_sekunden
FROM public.verarbeitungs_log
GROUP BY user_id, DATE_TRUNC('hour', zeitpunkt);

-- View für detaillierte Fehleranalyse
CREATE OR REPLACE VIEW public.fehler_details AS
SELECT
    zeitpunkt,
    user_id,
    fehlertyp,
    fehlermeldung,
    sql_state,
    verarbeitete_zeilen,
    zusatz_info->>'letzte_id' AS letzte_id,
    zusatz_info->>'letzter_name' AS letzter_name,
    zusatz_info->>'letzter_betrag' AS letzter_betrag,
    zusatz_info->>'cursor_status' AS cursor_status,
    zusatz_info->>'dauer_sekunden' AS dauer_sekunden
FROM public.verarbeitungs_log
WHERE fehlertyp IN ('CRITICAL_ERROR', 'CHECK_VIOLATION')
ORDER BY zeitpunkt DESC;

-- #################################################
-- 2. Test-Prozeduren
-- #################################################

-- Funktion zum Testen der Verarbeitung mit verschiedenen Szenarien
CREATE OR REPLACE FUNCTION public.test_process_betraege()
RETURNS TABLE (
    test_name TEXT,
    erfolg BOOLEAN,
    fehlermeldung TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_test_user_id UUID;
    v_result INTEGER;
BEGIN
    -- Testuser erstellen
    INSERT INTO auth.users (email) VALUES ('test@example.com') RETURNING id INTO v_test_user_id;
    
    -- Test 1: Normale Verarbeitung
    test_name := 'Test 1: Normale Verarbeitung';
    BEGIN
        INSERT INTO public.meine_tabelle (name, betrag, user_id) VALUES
            ('Test A', 100.00, v_test_user_id),
            ('Test B', 200.00, v_test_user_id);
            
        SET LOCAL auth.uid = v_test_user_id;
        v_result := public.process_betraege();
        
        IF v_result = 2 THEN
            RETURN NEXT (test_name, TRUE, 'Erfolgreich: ' || v_result || ' Zeilen verarbeitet')::record;
        ELSE
            RETURN NEXT (test_name, FALSE, 'Fehlgeschlagen: Erwartete 2 Zeilen, erhielt ' || v_result)::record;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RETURN NEXT (test_name, FALSE, 'Exception: ' || SQLERRM)::record;
    END;
    
    -- Test 2: Fehlerfall - Negativer Betrag
    test_name := 'Test 2: Negativer Betrag';
    BEGIN
        INSERT INTO public.meine_tabelle (name, betrag, user_id) VALUES
            ('Test C', -50.00, v_test_user_id);
            
        SET LOCAL auth.uid = v_test_user_id;
        v_result := public.process_betraege();
        
        RETURN NEXT (test_name, FALSE, 'Fehlgeschlagen: Negativer Betrag wurde nicht abgefangen')::record;
    EXCEPTION WHEN OTHERS THEN
        IF SQLERRM LIKE '%Ungültiger Betrag%' THEN
            RETURN NEXT (test_name, TRUE, 'Erfolgreich: Negativer Betrag wurde korrekt abgefangen')::record;
        ELSE
            RETURN NEXT (test_name, FALSE, 'Unerwarteter Fehler: ' || SQLERRM)::record;
        END IF;
    END;
    
    -- Test 3: RLS-Policy Test
    test_name := 'Test 3: RLS-Policy';
    DECLARE
        v_other_user_id UUID;
    BEGIN
        -- Anderen User erstellen und Daten einfügen
        INSERT INTO auth.users (email) VALUES ('other@example.com') RETURNING id INTO v_other_user_id;
        INSERT INTO public.meine_tabelle (name, betrag, user_id) VALUES
            ('Other Test', 300.00, v_other_user_id);
            
        -- Als ursprünglicher Test-User versuchen zuzugreifen
        SET LOCAL auth.uid = v_test_user_id;
        v_result := public.process_betraege();
        
        -- Sollte nur eigene Zeilen verarbeiten
        IF EXISTS (
            SELECT 1 FROM public.verarbeitete_betraege vb
            JOIN public.meine_tabelle mt ON vb.ursprungs_id = mt.id
            WHERE mt.user_id = v_other_user_id
        ) THEN
            RETURN NEXT (test_name, FALSE, 'RLS-Verletzung: Zugriff auf fremde Daten möglich')::record;
        ELSE
            RETURN NEXT (test_name, TRUE, 'RLS-Policy funktioniert korrekt')::record;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RETURN NEXT (test_name, FALSE, 'Unerwarteter Fehler: ' || SQLERRM)::record;
    END;
    
    -- Aufräumen
    DELETE FROM auth.users WHERE id IN (v_test_user_id, v_other_user_id);
END;
$$;

-- #################################################
-- 3. Rollback-Prozeduren
-- #################################################

-- Funktion zum Zurückrollen einer fehlgeschlagenen Verarbeitung
CREATE OR REPLACE FUNCTION public.rollback_verarbeitung(
    p_zeitstempel TIMESTAMP WITH TIME ZONE,
    p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
    aktion TEXT,
    anzahl_zeilen INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_deleted_rows INTEGER;
BEGIN
    -- Nur Einträge des angegebenen Users (falls gesetzt) nach Zeitstempel löschen
    DELETE FROM public.verarbeitete_betraege
    WHERE verarbeitet_am >= p_zeitstempel
    AND (p_user_id IS NULL OR user_id = p_user_id);
    
    GET DIAGNOSTICS v_deleted_rows = ROW_COUNT;
    RETURN QUERY SELECT 
        'Verarbeitete Beträge gelöscht'::TEXT AS aktion,
        v_deleted_rows AS anzahl_zeilen;
        
    -- Log-Einträge als "zurückgerollt" markieren
    WITH updated_logs AS (
        UPDATE public.verarbeitungs_log
        SET zusatz_info = jsonb_set(
            zusatz_info,
            '{rollback_info}',
            jsonb_build_object(
                'rolled_back_at', CURRENT_TIMESTAMP,
                'rolled_back_by', auth.uid(),
                'reason', 'Manual rollback'
            )::jsonb
        )
        WHERE zeitpunkt >= p_zeitstempel
        AND (p_user_id IS NULL OR user_id = p_user_id)
        RETURNING 1
    )
    SELECT 
        'Log-Einträge markiert'::TEXT,
        COUNT(*)::INTEGER
    FROM updated_logs;
END;
$$;

-- #################################################
-- 4. Monitoring-Trigger für Performance-Alerts
-- #################################################

-- Tabelle für Performance-Alerts
CREATE TABLE IF NOT EXISTS public.performance_alerts (
    id SERIAL PRIMARY KEY,
    zeitpunkt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    alert_typ TEXT NOT NULL,
    schwellwert NUMERIC,
    gemessener_wert NUMERIC,
    beschreibung TEXT,
    user_id UUID REFERENCES auth.users(id)
);

-- Trigger-Funktion für Performance-Überwachung
CREATE OR REPLACE FUNCTION check_performance_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_avg_duration NUMERIC;
    v_error_rate NUMERIC;
BEGIN
    -- Durchschnittliche Verarbeitungsdauer der letzten Stunde
    SELECT AVG((zusatz_info->>'dauer_sekunden')::numeric)
    INTO v_avg_duration
    FROM public.verarbeitungs_log
    WHERE zeitpunkt >= NOW() - INTERVAL '1 hour'
    AND fehlertyp = 'SUCCESS';
    
    -- Fehlerrate der letzten Stunde
    WITH stats AS (
        SELECT 
            COUNT(*) FILTER (WHERE fehlertyp IN ('CRITICAL_ERROR', 'CHECK_VIOLATION')) AS errors,
            COUNT(*) AS total
        FROM public.verarbeitungs_log
        WHERE zeitpunkt >= NOW() - INTERVAL '1 hour'
    )
    SELECT 
        CASE 
            WHEN total > 0 THEN (errors::NUMERIC / total::NUMERIC) * 100
            ELSE 0
        END
    INTO v_error_rate
    FROM stats;
    
    -- Alert für lange Verarbeitungszeiten
    IF v_avg_duration > 5 THEN  -- Schwellwert: 5 Sekunden
        INSERT INTO public.performance_alerts (
            alert_typ,
            schwellwert,
            gemessener_wert,
            beschreibung,
            user_id
        ) VALUES (
            'LONG_DURATION',
            5,
            v_avg_duration,
            'Durchschnittliche Verarbeitungszeit über 5 Sekunden',
            NEW.user_id
        );
    END IF;
    
    -- Alert für hohe Fehlerrate
    IF v_error_rate > 10 THEN  -- Schwellwert: 10%
        INSERT INTO public.performance_alerts (
            alert_typ,
            schwellwert,
            gemessener_wert,
            beschreibung,
            user_id
        ) VALUES (
            'HIGH_ERROR_RATE',
            10,
            v_error_rate,
            'Fehlerrate über 10% in der letzten Stunde',
            NEW.user_id
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- Trigger für Performance-Überwachung
CREATE TRIGGER monitor_performance
    AFTER INSERT ON public.verarbeitungs_log
    FOR EACH ROW
    EXECUTE FUNCTION check_performance_trigger();

-- RLS für Performance-Alerts aktivieren
ALTER TABLE public.performance_alerts ENABLE ROW LEVEL SECURITY;

-- RLS-Policy für Performance-Alerts
CREATE POLICY "Eigene Alerts sehen" ON public.performance_alerts
    FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Rechte für Performance-Alerts
GRANT SELECT ON public.performance_alerts TO authenticated;

-- Kommentare für die neuen Objekte
COMMENT ON VIEW public.verarbeitungs_statistik IS 'Aggregierte Statistiken über Verarbeitungsläufe';
COMMENT ON VIEW public.fehler_details IS 'Detaillierte Ansicht aller aufgetretenen Fehler';
COMMENT ON FUNCTION public.test_process_betraege() IS 'Testfunktion für verschiedene Verarbeitungsszenarien';
COMMENT ON FUNCTION public.rollback_verarbeitung(TIMESTAMP WITH TIME ZONE, UUID) IS 'Funktion zum Zurückrollen von Verarbeitungen ab einem Zeitpunkt';
COMMENT ON TABLE public.performance_alerts IS 'Speichert Performance-bezogene Warnungen';
COMMENT ON FUNCTION check_performance_trigger() IS 'Überwacht Performance-Metriken und erstellt Alerts'; 
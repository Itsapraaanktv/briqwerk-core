-- #################################################
-- 1. Test-Ergebnis-Tabelle
-- #################################################

CREATE TABLE IF NOT EXISTS public.test_results_agg (
    id              SERIAL PRIMARY KEY,
    suite_name      TEXT NOT NULL,
    test_name       TEXT NOT NULL,
    status          TEXT NOT NULL CHECK (status IN ('SUCCESS', 'FAIL')),
    error_message   TEXT,
    duration_ms     INTEGER,
    run_timestamp   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    run_by          UUID DEFAULT auth.uid() REFERENCES auth.users(id),
    details         JSONB
);

-- RLS für test_results_agg
ALTER TABLE public.test_results_agg ENABLE ROW LEVEL SECURITY;

-- Nur Authenticated Users können Testergebnisse sehen
CREATE POLICY "Testergebnisse sichtbar für alle Auth-User" ON public.test_results_agg
    FOR SELECT TO authenticated USING (true);

-- Nur der Test-Runner darf Ergebnisse schreiben
CREATE POLICY "Testergebnisse schreibbar für Test-Runner" ON public.test_results_agg
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL);

-- #################################################
-- 2. Views für Test-Visualisierung
-- #################################################

-- Aktuellste Testergebnisse
CREATE OR REPLACE VIEW public.vw_latest_test_results AS
WITH latest_run AS (
    SELECT MAX(run_timestamp) as max_ts
    FROM public.test_results_agg
)
SELECT
    suite_name,
    test_name,
    status,
    error_message,
    duration_ms,
    run_timestamp,
    run_by,
    details
FROM public.test_results_agg tr
CROSS JOIN latest_run lr
WHERE tr.run_timestamp = lr.max_ts
ORDER BY 
    CASE 
        WHEN status = 'FAIL' THEN 0 
        ELSE 1 
    END,  -- Fehler zuerst
    suite_name, 
    test_name;

-- Testergebnis-Trends
CREATE OR REPLACE VIEW public.vw_test_trends AS
SELECT
    date_trunc('day', run_timestamp) AS tag,
    suite_name,
    COUNT(*) AS gesamt_tests,
    COUNT(*) FILTER (WHERE status = 'SUCCESS') AS erfolgreiche,
    COUNT(*) FILTER (WHERE status = 'FAIL') AS fehlgeschlagene,
    ROUND(
        100.0 * COUNT(*) FILTER (WHERE status = 'SUCCESS') / 
        NULLIF(COUNT(*), 0),
        2
    ) AS erfolgsquote_pct,
    AVG(duration_ms) FILTER (WHERE status = 'SUCCESS') AS avg_duration_ms,
    MAX(duration_ms) FILTER (WHERE status = 'SUCCESS') AS max_duration_ms
FROM public.test_results_agg
GROUP BY tag, suite_name
ORDER BY tag DESC, suite_name;

-- Performance-Trends
CREATE OR REPLACE VIEW public.vw_test_performance AS
SELECT
    suite_name,
    test_name,
    run_timestamp,
    duration_ms,
    AVG(duration_ms) OVER (
        PARTITION BY suite_name, test_name 
        ORDER BY run_timestamp
        ROWS BETWEEN 5 PRECEDING AND CURRENT ROW
    ) AS moving_avg_duration_ms,
    duration_ms - LAG(duration_ms) OVER (
        PARTITION BY suite_name, test_name 
        ORDER BY run_timestamp
    ) AS duration_change_ms
FROM public.test_results_agg
WHERE status = 'SUCCESS'  -- Nur erfolgreiche Tests für Performance-Analyse
ORDER BY run_timestamp DESC;

-- #################################################
-- 3. Hilfsfunktionen für Test-Runner
-- #################################################

-- Funktion zum Speichern von Testergebnissen
CREATE OR REPLACE FUNCTION public.save_test_result(
    p_suite_name TEXT,
    p_test_name TEXT,
    p_status TEXT,
    p_error_message TEXT DEFAULT NULL,
    p_duration_ms INTEGER DEFAULT NULL,
    p_details JSONB DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.test_results_agg (
        suite_name,
        test_name,
        status,
        error_message,
        duration_ms,
        details
    ) VALUES (
        p_suite_name,
        p_test_name,
        p_status,
        p_error_message,
        p_duration_ms,
        p_details
    );
END;
$$;

-- #################################################
-- 4. Modifizierter Test-Runner
-- #################################################

-- Bestehende run_all_tests()-Funktion überschreiben
CREATE OR REPLACE FUNCTION public.run_all_tests()
RETURNS TABLE (
    test_suite TEXT,
    test_name TEXT,
    erfolg BOOLEAN,
    fehlermeldung TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_start_time TIMESTAMP;
    v_end_time TIMESTAMP;
    v_duration INTEGER;
    v_result RECORD;
BEGIN
    -- Datenmengen-Tests
    FOR v_result IN SELECT * FROM public.test_datenmengen() LOOP
        -- Ergebnis in Ergebnis-Tabelle speichern
        PERFORM public.save_test_result(
            'Datenmengen',
            v_result.test_name,
            CASE WHEN v_result.erfolg THEN 'SUCCESS' ELSE 'FAIL' END,
            v_result.fehlermeldung
        );
        
        -- Ergebnis auch zurückgeben
        RETURN QUERY SELECT 
            'Datenmengen'::TEXT,
            v_result.test_name,
            v_result.erfolg,
            v_result.fehlermeldung;
    END LOOP;
    
    -- Kollisions-Tests
    FOR v_result IN SELECT * FROM public.test_kollisionen() LOOP
        PERFORM public.save_test_result(
            'Kollisionen',
            v_result.test_name,
            CASE WHEN v_result.erfolg THEN 'SUCCESS' ELSE 'FAIL' END,
            v_result.fehlermeldung
        );
        
        RETURN QUERY SELECT 
            'Kollisionen'::TEXT,
            v_result.test_name,
            v_result.erfolg,
            v_result.fehlermeldung;
    END LOOP;
    
    -- Datenformat-Tests
    FOR v_result IN SELECT * FROM public.test_datenformate() LOOP
        PERFORM public.save_test_result(
            'Datenformate',
            v_result.test_name,
            CASE WHEN v_result.erfolg THEN 'SUCCESS' ELSE 'FAIL' END,
            v_result.fehlermeldung
        );
        
        RETURN QUERY SELECT 
            'Datenformate'::TEXT,
            v_result.test_name,
            v_result.erfolg,
            v_result.fehlermeldung;
    END LOOP;
    
    -- RLS-Tests
    FOR v_result IN SELECT * FROM public.test_rls_edge_cases() LOOP
        PERFORM public.save_test_result(
            'RLS Edge Cases',
            v_result.test_name,
            CASE WHEN v_result.erfolg THEN 'SUCCESS' ELSE 'FAIL' END,
            v_result.fehlermeldung
        );
        
        RETURN QUERY SELECT 
            'RLS Edge Cases'::TEXT,
            v_result.test_name,
            v_result.erfolg,
            v_result.fehlermeldung;
    END LOOP;
END;
$$;

-- Kommentare für neue Objekte
COMMENT ON TABLE public.test_results_agg IS 'Speichert aggregierte Testergebnisse mit Zeitstempel und Details';
COMMENT ON VIEW public.vw_latest_test_results IS 'Zeigt die Ergebnisse des letzten Test-Durchlaufs';
COMMENT ON VIEW public.vw_test_trends IS 'Zeigt Erfolgs- und Fehlerquoten über Zeit';
COMMENT ON VIEW public.vw_test_performance IS 'Analysiert Performance-Trends der Tests';
COMMENT ON FUNCTION public.save_test_result IS 'Hilfsfunktion zum Speichern von Testergebnissen'; 
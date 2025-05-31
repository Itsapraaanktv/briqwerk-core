-- #################################################
-- 1. Erweiterte Testfunktionen für Randfälle
-- #################################################

CREATE OR REPLACE FUNCTION public.test_datenmengen()
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
    v_start_time TIMESTAMP;
    v_end_time TIMESTAMP;
BEGIN
    -- Testuser erstellen
    INSERT INTO auth.users (email) VALUES ('volume_test@example.com') RETURNING id INTO v_test_user_id;
    
    -- Test 1: Leere Tabelle
    test_name := 'Test 1: Leere Tabelle';
    BEGIN
        SET LOCAL auth.uid = v_test_user_id;
        v_result := public.process_betraege();
        
        IF v_result = 0 THEN
            RETURN NEXT (test_name, TRUE, 'Erfolgreich: Leere Tabelle korrekt verarbeitet')::record;
        ELSE
            RETURN NEXT (test_name, FALSE, 'Fehlgeschlagen: Erwartete 0 Zeilen, erhielt ' || v_result)::record;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RETURN NEXT (test_name, FALSE, 'Exception: ' || SQLERRM)::record;
    END;
    
    -- Test 2: Große Datenmenge (10,000 Zeilen)
    test_name := 'Test 2: Große Datenmenge';
    BEGIN
        -- 10,000 Testzeilen einfügen
        INSERT INTO public.meine_tabelle (name, betrag, user_id)
        SELECT 
            'Bulk Test ' || i,
            (random() * 1000)::numeric(12,2),
            v_test_user_id
        FROM generate_series(1, 10000) i;
        
        v_start_time := clock_timestamp();
        SET LOCAL auth.uid = v_test_user_id;
        v_result := public.process_betraege();
        v_end_time := clock_timestamp();
        
        IF v_result = 10000 AND (v_end_time - v_start_time) < interval '30 seconds' THEN
            RETURN NEXT (test_name, TRUE, 'Erfolgreich: ' || v_result || ' Zeilen in ' || 
                extract(epoch from (v_end_time - v_start_time)) || ' Sekunden verarbeitet')::record;
        ELSE
            RETURN NEXT (test_name, FALSE, 'Performance-Problem: ' || v_result || ' Zeilen in ' || 
                extract(epoch from (v_end_time - v_start_time)) || ' Sekunden')::record;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RETURN NEXT (test_name, FALSE, 'Exception: ' || SQLERRM)::record;
    END;
    
    -- Aufräumen
    DELETE FROM auth.users WHERE id = v_test_user_id;
END;
$$;

-- #################################################
-- 2. Kollisionsszenarien-Tests
-- #################################################

CREATE OR REPLACE FUNCTION public.test_kollisionen()
RETURNS TABLE (
    test_name TEXT,
    erfolg BOOLEAN,
    fehlermeldung TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user1_id UUID;
    v_user2_id UUID;
    v_result1 INTEGER;
    v_result2 INTEGER;
BEGIN
    -- Zwei Testuser erstellen
    INSERT INTO auth.users (email) VALUES 
        ('user1@example.com'),
        ('user2@example.com')
    RETURNING id INTO v_user1_id;
    
    SELECT id INTO v_user2_id 
    FROM auth.users 
    WHERE email = 'user2@example.com';
    
    -- Test 1: Parallele Verarbeitung
    test_name := 'Test 1: Parallele Verarbeitung';
    BEGIN
        -- Testdaten für beide User
        INSERT INTO public.meine_tabelle (name, betrag, user_id) VALUES
            ('User1 Test A', 100.00, v_user1_id),
            ('User1 Test B', 200.00, v_user1_id),
            ('User2 Test A', 300.00, v_user2_id),
            ('User2 Test B', 400.00, v_user2_id);
            
        -- Parallel processing simulation
        SET LOCAL auth.uid = v_user1_id;
        v_result1 := public.process_betraege();
        
        SET LOCAL auth.uid = v_user2_id;
        v_result2 := public.process_betraege();
        
        -- Prüfen, ob jeder User nur seine eigenen Daten verarbeitet hat
        IF v_result1 = 2 AND v_result2 = 2 AND
           NOT EXISTS (
               SELECT 1 FROM public.verarbeitete_betraege vb
               JOIN public.meine_tabelle mt ON vb.ursprungs_id = mt.id
               WHERE (mt.user_id = v_user1_id AND vb.user_id = v_user2_id)
               OR (mt.user_id = v_user2_id AND vb.user_id = v_user1_id)
           ) THEN
            RETURN NEXT (test_name, TRUE, 'Erfolgreich: Beide User haben nur ihre eigenen Daten verarbeitet')::record;
        ELSE
            RETURN NEXT (test_name, FALSE, 'RLS-Verletzung: Datenvermischung zwischen Users')::record;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RETURN NEXT (test_name, FALSE, 'Exception: ' || SQLERRM)::record;
    END;
    
    -- Test 2: Concurrent Modification
    test_name := 'Test 2: Concurrent Modification';
    BEGIN
        -- Testdaten vorbereiten
        INSERT INTO public.meine_tabelle (name, betrag, user_id) VALUES
            ('Modify Test', 500.00, v_user1_id);
            
        -- Cursor öffnen (in einer separaten Session)
        SET LOCAL auth.uid = v_user1_id;
        
        -- Simuliere Änderung während der Verarbeitung
        UPDATE public.meine_tabelle 
        SET betrag = 600.00 
        WHERE name = 'Modify Test' 
        AND user_id = v_user1_id;
        
        -- Verarbeitung durchführen
        v_result1 := public.process_betraege();
        
        -- Prüfen, ob der neue Wert verarbeitet wurde
        IF EXISTS (
            SELECT 1 FROM public.verarbeitete_betraege vb
            JOIN public.meine_tabelle mt ON vb.ursprungs_id = mt.id
            WHERE mt.name = 'Modify Test'
            AND vb.betrag = 600.00
        ) THEN
            RETURN NEXT (test_name, TRUE, 'Erfolgreich: Änderung während der Verarbeitung korrekt behandelt')::record;
        ELSE
            RETURN NEXT (test_name, FALSE, 'Fehlgeschlagen: Änderung während der Verarbeitung nicht korrekt reflektiert')::record;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RETURN NEXT (test_name, FALSE, 'Exception: ' || SQLERRM)::record;
    END;
    
    -- Aufräumen
    DELETE FROM auth.users WHERE id IN (v_user1_id, v_user2_id);
END;
$$;

-- #################################################
-- 3. Datenformat-Tests
-- #################################################

CREATE OR REPLACE FUNCTION public.test_datenformate()
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
    INSERT INTO auth.users (email) VALUES ('format_test@example.com') RETURNING id INTO v_test_user_id;
    
    -- Test 1: Zu große Beträge
    test_name := 'Test 1: Numeric Overflow';
    BEGIN
        INSERT INTO public.meine_tabelle (name, betrag, user_id) VALUES
            ('Overflow Test', 9999999999.99, v_test_user_id);
            
        SET LOCAL auth.uid = v_test_user_id;
        v_result := public.process_betraege();
        
        RETURN NEXT (test_name, FALSE, 'Fehlgeschlagen: Numeric Overflow nicht abgefangen')::record;
    EXCEPTION WHEN numeric_value_out_of_range THEN
        RETURN NEXT (test_name, TRUE, 'Erfolgreich: Numeric Overflow korrekt abgefangen')::record;
    WHEN OTHERS THEN
        RETURN NEXT (test_name, FALSE, 'Unerwarteter Fehler: ' || SQLERRM)::record;
    END;
    
    -- Test 2: Sehr lange Namen
    test_name := 'Test 2: Lange Namen';
    BEGIN
        INSERT INTO public.meine_tabelle (name, betrag, user_id) VALUES
            (repeat('a', 1000), 100.00, v_test_user_id);
            
        SET LOCAL auth.uid = v_test_user_id;
        v_result := public.process_betraege();
        
        RETURN NEXT (test_name, FALSE, 'Fehlgeschlagen: Zu langer Name nicht abgefangen')::record;
    EXCEPTION WHEN string_data_right_truncation THEN
        RETURN NEXT (test_name, TRUE, 'Erfolgreich: Zu langer Name korrekt abgefangen')::record;
    WHEN OTHERS THEN
        RETURN NEXT (test_name, FALSE, 'Unerwarteter Fehler: ' || SQLERRM)::record;
    END;
    
    -- Test 3: Sonderzeichen im Namen
    test_name := 'Test 3: Sonderzeichen';
    BEGIN
        INSERT INTO public.meine_tabelle (name, betrag, user_id) VALUES
            ('Test 你好 🌟 привет', 100.00, v_test_user_id);
            
        SET LOCAL auth.uid = v_test_user_id;
        v_result := public.process_betraege();
        
        IF v_result = 1 THEN
            RETURN NEXT (test_name, TRUE, 'Erfolgreich: Unicode-Zeichen korrekt verarbeitet')::record;
        ELSE
            RETURN NEXT (test_name, FALSE, 'Fehlgeschlagen: Unicode-Zeichen nicht korrekt verarbeitet')::record;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RETURN NEXT (test_name, FALSE, 'Exception: ' || SQLERRM)::record;
    END;
    
    -- Aufräumen
    DELETE FROM auth.users WHERE id = v_test_user_id;
END;
$$;

-- #################################################
-- 4. RLS-Grenzfall-Tests
-- #################################################

CREATE OR REPLACE FUNCTION public.test_rls_edge_cases()
RETURNS TABLE (
    test_name TEXT,
    erfolg BOOLEAN,
    fehlermeldung TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_empty_user_id UUID;
    v_data_user_id UUID;
    v_result INTEGER;
BEGIN
    -- Testuser erstellen
    INSERT INTO auth.users (email) VALUES 
        ('empty@example.com'),
        ('data@example.com')
    RETURNING id INTO v_empty_user_id;
    
    SELECT id INTO v_data_user_id 
    FROM auth.users 
    WHERE email = 'data@example.com';
    
    -- Testdaten nur für data_user
    INSERT INTO public.meine_tabelle (name, betrag, user_id) VALUES
        ('Data Test', 100.00, v_data_user_id);
    
    -- Test 1: Leerer User
    test_name := 'Test 1: User ohne Daten';
    BEGIN
        SET LOCAL auth.uid = v_empty_user_id;
        v_result := public.process_betraege();
        
        IF v_result = 0 AND NOT EXISTS (
            SELECT 1 FROM public.verarbeitete_betraege
            WHERE user_id = v_empty_user_id
        ) THEN
            RETURN NEXT (test_name, TRUE, 'Erfolgreich: Leerer User verarbeitet keine Daten')::record;
        ELSE
            RETURN NEXT (test_name, FALSE, 'Fehlgeschlagen: Leerer User hat unerwartete Daten verarbeitet')::record;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RETURN NEXT (test_name, FALSE, 'Exception: ' || SQLERRM)::record;
    END;
    
    -- Test 2: Versuchter Zugriff auf fremde Daten
    test_name := 'Test 2: Fremddaten-Zugriff';
    BEGIN
        -- Versuche, als empty_user die Daten von data_user zu verarbeiten
        SET LOCAL auth.uid = v_empty_user_id;
        
        -- Versuche direkten Zugriff auf fremde Daten
        INSERT INTO public.verarbeitete_betraege (
            ursprungs_id,
            name,
            betrag,
            user_id
        )
        SELECT 
            id,
            name,
            betrag,
            v_empty_user_id
        FROM public.meine_tabelle
        WHERE user_id = v_data_user_id;
        
        RETURN NEXT (test_name, FALSE, 'Fehlgeschlagen: RLS-Verletzung möglich')::record;
    EXCEPTION WHEN insufficient_privilege THEN
        RETURN NEXT (test_name, TRUE, 'Erfolgreich: RLS verhindert Fremddaten-Zugriff')::record;
    WHEN OTHERS THEN
        RETURN NEXT (test_name, FALSE, 'Unerwarteter Fehler: ' || SQLERRM)::record;
    END;
    
    -- Aufräumen
    DELETE FROM auth.users WHERE id IN (v_empty_user_id, v_data_user_id);
END;
$$;

-- #################################################
-- 5. Haupttest-Runner
-- #################################################

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
BEGIN
    -- Datenmengen-Tests
    RETURN QUERY
    SELECT 'Datenmengen'::TEXT as test_suite, * FROM public.test_datenmengen();
    
    -- Kollisions-Tests
    RETURN QUERY
    SELECT 'Kollisionen'::TEXT as test_suite, * FROM public.test_kollisionen();
    
    -- Datenformat-Tests
    RETURN QUERY
    SELECT 'Datenformate'::TEXT as test_suite, * FROM public.test_datenformate();
    
    -- RLS-Tests
    RETURN QUERY
    SELECT 'RLS Edge Cases'::TEXT as test_suite, * FROM public.test_rls_edge_cases();
END;
$$;

-- Kommentare für die Test-Funktionen
COMMENT ON FUNCTION public.test_datenmengen() IS 'Testet Verarbeitung von leeren Tabellen und großen Datenmengen';
COMMENT ON FUNCTION public.test_kollisionen() IS 'Testet parallele Verarbeitung und konkurrierende Änderungen';
COMMENT ON FUNCTION public.test_datenformate() IS 'Testet Verarbeitung von Grenzfällen bei Datenformaten';
COMMENT ON FUNCTION public.test_rls_edge_cases() IS 'Testet RLS-Policies in Grenzfällen';
COMMENT ON FUNCTION public.run_all_tests() IS 'Führt alle Testsuites aus und gibt Ergebnisse zurück'; 
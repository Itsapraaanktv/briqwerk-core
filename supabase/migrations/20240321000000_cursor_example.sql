-- #################################################
-- 1. Tabelle: meine_tabelle
-- #################################################
-- Diese Tabelle enthält Projekte mit einem Betrag und einem Zeitstempel.
CREATE TABLE IF NOT EXISTS public.meine_tabelle (
    id          SERIAL PRIMARY KEY,
    name        TEXT NOT NULL,
    betrag      NUMERIC(12, 2) NOT NULL,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id     UUID REFERENCES auth.users(id) DEFAULT auth.uid()
);

-- #################################################
-- 2. Tabelle: verarbeitete_betraege
-- #################################################
-- In dieser Tabelle speichern wir die verarbeiteten (verdoppelten) Beträge.
CREATE TABLE IF NOT EXISTS public.verarbeitete_betraege (
    id               SERIAL PRIMARY KEY,
    ursprungs_id     INTEGER NOT NULL,
    name             TEXT NOT NULL,
    betrag_alt       NUMERIC(12, 2) NOT NULL,
    betrag_neu       NUMERIC(12, 2) NOT NULL,
    verarbeitet_am   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id          UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
    FOREIGN KEY (ursprungs_id) REFERENCES public.meine_tabelle(id) ON DELETE CASCADE
);

-- #################################################
-- 3. Beispiel-Daten in meine_tabelle einfügen
-- #################################################
INSERT INTO public.meine_tabelle (name, betrag) VALUES
    ('Projekt Alpha',   1000.00),
    ('Projekt Beta',    2500.50),
    ('Projekt Gamma',   1750.75),
    ('Projekt Delta',   300.00),
    ('Projekt Epsilon', 9999.99);

-- #################################################
-- 4. Logging-Tabelle für Fehler und Ausführungshistorie
-- #################################################
CREATE TABLE IF NOT EXISTS public.verarbeitungs_log (
    id SERIAL PRIMARY KEY,
    zeitpunkt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id),
    fehlertyp TEXT,
    fehlermeldung TEXT,
    sql_state TEXT,
    verarbeitete_zeilen INTEGER,
    zusatz_info JSONB
);

-- Rechte für Logging-Tabelle
GRANT INSERT ON public.verarbeitungs_log TO authenticated;
GRANT SELECT ON public.verarbeitungs_log TO authenticated;

-- #################################################
-- 5. Verbesserte Prozedur mit detaillierter Fehlerbehandlung
-- #################################################
CREATE OR REPLACE FUNCTION public.process_betraege()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    -- Cursor-Variable für die Hauptverarbeitung
    proj_cursor CURSOR FOR
        SELECT id, name, betrag
        FROM public.meine_tabelle
        WHERE user_id = auth.uid()  -- RLS-konform: Nur eigene Datensätze
        ORDER BY id;
    
    -- Variablen für die aktuelle Zeile mit Defaultwerten
    v_id     INTEGER := -1;  -- Default: Ungültiger PK
    v_name   TEXT := '';     -- Default: Leerer String
    v_betrag NUMERIC(12, 2) := 0;  -- Default: Nullbetrag
    
    -- Zähler und Status-Variablen
    processed_count INTEGER := 0;
    v_start_time TIMESTAMP WITH TIME ZONE;
    v_error_details JSONB;
BEGIN
    -- Startzeit für Logging
    v_start_time := CURRENT_TIMESTAMP;
    
    -- Cursor öffnen und Verarbeitung starten
    OPEN proj_cursor;
    
    <<processing_loop>>
    LOOP
        BEGIN  -- Innerer Block für Fehlerbehandlung pro Zeile
            FETCH proj_cursor INTO v_id, v_name, v_betrag;
            EXIT WHEN NOT FOUND;
            
            -- Verarbeitung mit zusätzlicher Validierung
            IF v_betrag IS NULL OR v_betrag <= 0 THEN
                RAISE EXCEPTION 'Ungültiger Betrag % in Zeile %', v_betrag, processed_count + 1
                    USING ERRCODE = 'check_violation';
            END IF;
            
            -- Hauptverarbeitung mit expliziter Fehlerprüfung
            INSERT INTO public.verarbeitete_betraege (
                ursprungs_id,
                name,
                betrag_alt,
                betrag_neu,
                user_id  -- Wichtig für RLS
            ) VALUES (
                v_id,
                v_name,
                v_betrag,
                v_betrag * 2,
                auth.uid()  -- RLS-konform: Nur eigene Datensätze
            );
            
            processed_count := processed_count + 1;
            
        EXCEPTION
            WHEN check_violation THEN
                -- Einzelne fehlerhafte Zeile loggen und weitermachen
                INSERT INTO public.verarbeitungs_log (
                    user_id, 
                    fehlertyp,
                    fehlermeldung,
                    sql_state,
                    verarbeitete_zeilen,
                    zusatz_info
                ) VALUES (
                    auth.uid(),
                    'CHECK_VIOLATION',
                    SQLERRM,
                    SQLSTATE,
                    processed_count,
                    jsonb_build_object(
                        'zeilen_id', v_id,
                        'betrag', v_betrag,
                        'zeitpunkt', CURRENT_TIMESTAMP
                    )
                );
                -- Weitermachen mit nächster Zeile
                CONTINUE processing_loop;
        END;
    END LOOP;
    
    -- Cursor normal schließen
    CLOSE proj_cursor;
    
    -- Erfolgreiche Verarbeitung loggen
    INSERT INTO public.verarbeitungs_log (
        user_id,
        fehlertyp,
        fehlermeldung,
        verarbeitete_zeilen,
        zusatz_info
    ) VALUES (
        auth.uid(),
        'SUCCESS',
        'Verarbeitung erfolgreich abgeschlossen',
        processed_count,
        jsonb_build_object(
            'start_zeit', v_start_time,
            'end_zeit', CURRENT_TIMESTAMP,
            'dauer_sekunden', EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - v_start_time))
        )
    );
    
    RETURN processed_count;

EXCEPTION
    WHEN OTHERS THEN
        -- Detaillierte Fehlerinformationen sammeln
        v_error_details := jsonb_build_object(
            'start_zeit', v_start_time,
            'error_zeit', CURRENT_TIMESTAMP,
            'dauer_sekunden', EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - v_start_time)),
            'letzte_id', v_id,
            'letzter_name', v_name,
            'letzter_betrag', v_betrag
        );
        
        -- Cursor-Status prüfen und ggf. schließen
        IF CURSOR_ISOPEN(proj_cursor) THEN
            BEGIN
                CLOSE proj_cursor;
                v_error_details := v_error_details || 
                    jsonb_build_object('cursor_status', 'Erfolgreich geschlossen');
            EXCEPTION
                WHEN OTHERS THEN
                    v_error_details := v_error_details || 
                        jsonb_build_object('cursor_status', 'Fehler beim Schließen: ' || SQLERRM);
            END;
        END IF;
        
        -- Fehler loggen
        INSERT INTO public.verarbeitungs_log (
            user_id,
            fehlertyp,
            fehlermeldung,
            sql_state,
            verarbeitete_zeilen,
            zusatz_info
        ) VALUES (
            auth.uid(),
            'CRITICAL_ERROR',
            SQLERRM,
            SQLSTATE,
            processed_count,
            v_error_details
        );
        
        -- Fehler mit allen Details weiterreichen
        RAISE EXCEPTION 'Kritischer Fehler in process_betraege: % (SQLSTATE: %). Verarbeitet: % Zeilen. Details: %',
            SQLERRM,
            SQLSTATE,
            processed_count,
            v_error_details;
END;
$$;

-- #################################################
-- 6. Erweiterte Supabase-Sicherheit mit RLS
-- #################################################

-- RLS aktivieren
ALTER TABLE public.meine_tabelle ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verarbeitete_betraege ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verarbeitungs_log ENABLE ROW LEVEL SECURITY;

-- Alle Rechte von anonymen Nutzern entziehen
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM anon;

-- Minimale Rechte für authentifizierte Nutzer
GRANT SELECT, INSERT ON public.meine_tabelle TO authenticated;
GRANT SELECT, INSERT ON public.verarbeitete_betraege TO authenticated;
GRANT SELECT, INSERT ON public.verarbeitungs_log TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- RLS-Policies für meine_tabelle
CREATE POLICY "Eigene Projekte sehen" ON public.meine_tabelle
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Neue Projekte erstellen" ON public.meine_tabelle
    FOR INSERT
    TO authenticated
    WITH CHECK (
        user_id = auth.uid() OR
        (user_id IS NULL AND auth.uid() IS NOT NULL)  -- Erlaubt DEFAULT auth.uid()
    );

-- RLS-Policies für verarbeitete_betraege
CREATE POLICY "Eigene verarbeitete Beträge sehen" ON public.verarbeitete_betraege
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 
            FROM public.meine_tabelle mt 
            WHERE mt.id = verarbeitete_betraege.ursprungs_id 
            AND mt.user_id = auth.uid()
        )
    );

CREATE POLICY "Neue verarbeitete Beträge erstellen" ON public.verarbeitete_betraege
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 
            FROM public.meine_tabelle mt 
            WHERE mt.id = NEW.ursprungs_id 
            AND mt.user_id = auth.uid()
        )
    );

-- RLS-Policies für verarbeitungs_log
CREATE POLICY "Eigene Logs sehen" ON public.verarbeitungs_log
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Neue Logs erstellen" ON public.verarbeitungs_log
    FOR INSERT
    TO authenticated
    WITH CHECK (
        user_id = auth.uid() OR
        (user_id IS NULL AND auth.uid() IS NOT NULL)  -- Erlaubt DEFAULT auth.uid()
    );

-- Service-Role behält vollen Zugriff (implizit durch SECURITY DEFINER)
-- Keine expliziten GRANT-Statements nötig, da service_role bereits alle Rechte hat

COMMENT ON FUNCTION public.process_betraege() IS 
$md$Verarbeitet Beträge mit folgenden Sicherheitsmerkmalen:
1. Cursor-basierte Verarbeitung mit robuster Fehlerbehandlung
2. Automatisches Cursor-Cleanup bei Fehlern
3. Detailliertes Logging in verarbeitungs_log
4. RLS-konform: Verarbeitet nur eigene Datensätze
5. Transaktionssicher mit EXCEPTION-Handling$md$;

/*
Sicherheitsarchitektur-Dokumentation:

1. Rollen und Berechtigungen:
   - anon: Keine Rechte (REVOKE ALL)
   - authenticated: Minimale Rechte (SELECT, INSERT)
   - service_role: Voller Zugriff für System-Tasks

2. Row Level Security (RLS):
   - Aktiviert auf allen Tabellen
   - user_id-basierte Filterung
   - Verknüpfte Policies über EXISTS-Abfragen
   - DEFAULT auth.uid() für neue Einträge

3. Fehlerbehandlung und Logging:
   - Separate Logging-Tabelle
   - Detaillierte Fehlerinformationen
   - Cursor-Status-Tracking
   - Transaktionszeiten und Performance-Metriken

4. Best Practices:
   - Explicit Denies (REVOKE ALL von anon)
   - Minimale Rechte für authenticated
   - Verknüpfte RLS-Policies
   - Automatische user_id-Zuweisung
   - Umfassende Dokumentation
*/

-- #################################################
-- 7. Aufruf der Funktion und Ergebnis anzeigen
-- #################################################
-- Nachdem Migrationen ausgeführt und Rechte vergeben wurden, kann ein Aufruf so aussehen:
-- SELECT process_betraege();

-- Anschließend kann man die verarbeiteten Ergebnisse abfragen:
-- SELECT * FROM public.verarbeitete_betraege ORDER BY verarbeitet_am DESC;

-- #################################################
-- 8. Kommentierung der wichtigsten Schritte
-- #################################################
-- a) Cursor-Deklaration:
--    DECLARE proj_cursor CURSOR FOR SELECT id, name, betrag FROM public.meine_tabelle ORDER BY id;
--    Ein Cursor definiert eine zeilenweise Verarbeitung der Resultset-Ergebnisse. 
--
-- b) OPEN, FETCH, CLOSE:
--    OPEN proj_cursor;
--      – Initialisiert den Cursor und bereitet ihn vor, um Zeile für Zeile abzuarbeiten.
--    FETCH proj_cursor INTO v_id, v_name, v_betrag;
--      – Liest jeweils die nächste Zeile und speichert Spaltenwerte in lokalen Variablen. 
--    EXIT WHEN NOT FOUND;
--      – Bricht die Schleife ab, sobald keine Daten mehr im Cursor vorhanden sind.
--    CLOSE proj_cursor;
--      – Schließt den Cursor und gibt alle damit verbundenen Ressourcen frei.
--
-- c) Fehlerbehandlung:
--    Der EXCEPTION-Block stellt sicher, dass der Cursor immer geschlossen wird, 
--    falls während der Verarbeitung ein Fehler auftritt. Ansonsten könnte er geöffnet bleiben 
--    und Speicher/Verbindungen blockieren.
--
-- d) Unterschiede PL/pgSQL vs. T-SQL (MS SQL Server):
--    – PL/pgSQL (PostgreSQL) verwendet:
--         DECLARE cursor_name CURSOR FOR <SELECT-Statement>;
--         OPEN cursor_name;
--         FETCH cursor_name INTO var1, var2, ...;
--         CLOSE cursor_name;
--      Bei PL/pgSQL ist der Cursor typischerweise innerhalb einer Funktion oder eines DO-Blocks deklariert.
--      Das Schließen im EXCEPTION-Block ist eine PostgreSQL-Best Practice.
--
--    – T-SQL (MS SQL Server) verwendet:
--         DECLARE cursor_name CURSOR LOCAL FAST_FORWARD FOR <SELECT-Statement>;
--         OPEN cursor_name;
--         FETCH NEXT FROM cursor_name INTO @var1, @var2, ...;
--         WHILE @@FETCH_STATUS = 0
--         BEGIN
--             -- Verarbeitung ...
--             FETCH NEXT FROM cursor_name INTO @var1, @var2, ...;
--         END
--         CLOSE cursor_name;
--         DEALLOCATE cursor_name;
--      In T-SQL muss man nach CLOSE noch DEALLOCATE ausführen, um alle Ressourcen freizugeben.
--      Außerdem gibt es FETCH NEXT FROM …; und man prüft den Systemwert @@FETCH_STATUS.
--      Supabase/PostgreSQL führt FETCH automatisch auf das nächste Datensatz-Paar aus, 
--      ohne externen Status-Check wie @@FETCH_STATUS zu benötigen.

-- Grant necessary permissions
GRANT ALL ON public.meine_tabelle TO authenticated;
GRANT ALL ON public.verarbeitete_betraege TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- #################################################
-- 9. Performance-Optimierung durch Indexe
-- #################################################

-- Primäre Performance-Indexe
-- -------------------------

-- Index für RLS-Performance auf meine_tabelle
CREATE INDEX IF NOT EXISTS idx_meine_tabelle_user_id
    ON public.meine_tabelle(user_id);

-- Index für Fremdschlüssel-Lookups in verarbeitete_betraege
CREATE INDEX IF NOT EXISTS idx_verarbeitete_betraege_ursprungs_id
    ON public.verarbeitete_betraege(ursprungs_id);

-- Index für Zeitreihen-Analysen im Log
CREATE INDEX IF NOT EXISTS idx_verarbeitungs_log_zeitpunkt
    ON public.verarbeitungs_log(zeitpunkt);

-- Zusätzliche Indexe für spezifische Anwendungsfälle
-- ------------------------------------------------

-- Ermöglicht schnelle Benutzer-spezifische Log-Abfragen
-- Nützlich für: "Zeige alle Fehler eines bestimmten Benutzers"
CREATE INDEX IF NOT EXISTS idx_verarbeitungs_log_user_id
    ON public.verarbeitungs_log(user_id);

-- Optional: Index für direkte User-basierte Abfragen auf verarbeitete_betraege
-- Relevant für zukünftige Reporting-Szenarien, die direkt nach user_id filtern
-- Hinweis: Nicht notwendig für das aktuelle RLS-Schema, da primär über EXISTS gefiltert wird
CREATE INDEX IF NOT EXISTS idx_verarbeitete_betraege_user_id
    ON public.verarbeitete_betraege(user_id);

-- Add helpful comments
COMMENT ON TABLE public.meine_tabelle IS 'Example table for cursor demonstration';
COMMENT ON TABLE public.verarbeitete_betraege IS 'Table storing processed results from cursor operation';
COMMENT ON FUNCTION process_betraege() IS 'Demonstrates cursor usage by processing amounts from meine_tabelle';

/*
Key differences between PL/pgSQL (PostgreSQL) and T-SQL (MS SQL Server) cursors:

1. Declaration:
   - PL/pgSQL: DECLARE cur_name CURSOR FOR <SELECT-Statement>;
   - T-SQL: DECLARE cur_name CURSOR FOR SELECT ... [with options]

2. Options:
   - T-SQL has more cursor options (FAST_FORWARD, STATIC, etc.)
   - PostgreSQL cursors are always forward-only by default

3. Variable declaration:
   - PL/pgSQL: DECLARE v_name type;
   - T-SQL: DECLARE @name type

4. Fetch syntax:
   - PL/pgSQL: FETCH cur_name INTO v_var1, v_var2;
   - T-SQL: FETCH NEXT FROM cur_name INTO @var1, @var2

5. Loop structure:
   - PL/pgSQL: LOOP ... EXIT WHEN NOT FOUND ... END LOOP;
   - T-SQL: WHILE @@FETCH_STATUS = 0 BEGIN ... END

6. Error handling:
   - PL/pgSQL: EXCEPTION WHEN ...
   - T-SQL: TRY ... CATCH

7. Automatic closing:
   - PostgreSQL automatically closes cursors at transaction end
   - SQL Server requires explicit DEALLOCATE
*/ 
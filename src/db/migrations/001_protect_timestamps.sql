-- Stelle sicher, dass created_at und updated_at nicht manuell geändert werden können
ALTER TABLE entries
  ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

-- Trigger für automatische Aktualisierung von updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_entries_updated_at
    BEFORE UPDATE ON entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Verhindere direkte Änderungen an den Zeitstempeln
CREATE OR REPLACE FUNCTION protect_timestamps()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        NEW.created_at := CURRENT_TIMESTAMP;
        NEW.updated_at := CURRENT_TIMESTAMP;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Verhindere manuelle Änderungen an created_at
        IF OLD.created_at != NEW.created_at THEN
            RAISE EXCEPTION 'created_at cannot be modified';
        END IF;
        -- Erlaube nur System-Updates von updated_at
        NEW.updated_at := CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER protect_entries_timestamps
    BEFORE INSERT OR UPDATE ON entries
    FOR EACH ROW
    EXECUTE FUNCTION protect_timestamps(); 
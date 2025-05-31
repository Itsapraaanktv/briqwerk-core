-- Erstelle eine Funktion zum Abrufen der Serverzeit
CREATE OR REPLACE FUNCTION get_server_time()
RETURNS json
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT json_build_object('now', NOW()::text);
$$; 
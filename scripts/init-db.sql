-- Ensure unique partial index: Each table can have at most ONE 'open' session
CREATE UNIQUE INDEX IF NOT EXISTS table_sessions_single_open_idx 
ON table_sessions (table_id) 
WHERE status = 'open';

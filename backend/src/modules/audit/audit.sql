CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  action VARCHAR(120) NOT NULL,
  actor VARCHAR(180) NOT NULL,
  target VARCHAR(180) DEFAULT '-',
  detail TEXT DEFAULT '-',
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

CREATE TABLE saas_users (
  id uuid PRIMARY KEY,
  email text NOT NULL,
  password_hash text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX saas_users_email_lower_unique ON saas_users (lower(email));

CREATE TABLE saas_account_sessions (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES saas_users(id) ON DELETE CASCADE,
  token_hash bytea NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  user_agent text,
  CHECK (expires_at > created_at)
);
CREATE INDEX saas_account_sessions_user_active_idx
  ON saas_account_sessions (user_id, expires_at) WHERE revoked_at IS NULL;

CREATE TABLE saas_provider_connections (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES saas_users(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('openai', 'anthropic', 'google', 'openrouter')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'connected', 'invalid')),
  credential_ciphertext bytea NOT NULL,
  credential_nonce bytea NOT NULL,
  credential_auth_tag bytea NOT NULL,
  encryption_key_version smallint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_validated_at timestamptz,
  UNIQUE (id, user_id),
  UNIQUE (user_id, provider),
  CHECK (octet_length(credential_nonce) = 12),
  CHECK (octet_length(credential_auth_tag) = 16)
);
CREATE INDEX saas_provider_connections_owner_idx ON saas_provider_connections (user_id, created_at DESC);
ALTER TABLE saas_provider_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE saas_provider_connections FORCE ROW LEVEL SECURITY;
CREATE POLICY saas_provider_connections_owner_policy ON saas_provider_connections
  USING (user_id = nullif(current_setting('app.user_id', true), '')::uuid)
  WITH CHECK (user_id = nullif(current_setting('app.user_id', true), '')::uuid);

CREATE TABLE saas_model_preferences (
  user_id uuid PRIMARY KEY REFERENCES saas_users(id) ON DELETE CASCADE,
  provider_connection_id uuid NOT NULL,
  model_id text NOT NULL CHECK (length(model_id) BETWEEN 1 AND 256),
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (provider_connection_id, user_id)
    REFERENCES saas_provider_connections (id, user_id) ON DELETE CASCADE
);
ALTER TABLE saas_model_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE saas_model_preferences FORCE ROW LEVEL SECURITY;
CREATE POLICY saas_model_preferences_owner_policy ON saas_model_preferences
  USING (user_id = nullif(current_setting('app.user_id', true), '')::uuid)
  WITH CHECK (user_id = nullif(current_setting('app.user_id', true), '')::uuid);

CREATE TABLE saas_agent_sessions (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES saas_users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'New conversation' CHECK (length(title) <= 120),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (id, user_id)
);
CREATE INDEX saas_agent_sessions_owner_idx ON saas_agent_sessions (user_id, updated_at DESC)
  WHERE deleted_at IS NULL;
ALTER TABLE saas_agent_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE saas_agent_sessions FORCE ROW LEVEL SECURITY;
CREATE POLICY saas_agent_sessions_owner_policy ON saas_agent_sessions
  USING (user_id = nullif(current_setting('app.user_id', true), '')::uuid)
  WITH CHECK (user_id = nullif(current_setting('app.user_id', true), '')::uuid);

CREATE TABLE saas_audit_events (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES saas_users(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  success boolean NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (length(event_type) BETWEEN 1 AND 80),
  CHECK (jsonb_typeof(metadata) = 'object')
);
CREATE INDEX saas_audit_events_owner_idx ON saas_audit_events (user_id, created_at DESC);
ALTER TABLE saas_audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE saas_audit_events FORCE ROW LEVEL SECURITY;
CREATE POLICY saas_audit_events_owner_policy ON saas_audit_events
  USING (user_id IS NOT NULL AND user_id = nullif(current_setting('app.user_id', true), '')::uuid)
  WITH CHECK (
    (user_id IS NOT NULL AND user_id = nullif(current_setting('app.user_id', true), '')::uuid)
    OR (user_id IS NULL AND nullif(current_setting('app.user_id', true), '') IS NULL)
  );

CREATE TABLE saas_password_reset_tokens (
  token_hash bytea PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES saas_users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  CHECK (expires_at > created_at)
);
CREATE INDEX saas_password_reset_owner_idx ON saas_password_reset_tokens (user_id, expires_at);

CREATE TABLE saas_rate_limit_buckets (
  bucket_key_hash text NOT NULL,
  window_started_at timestamptz NOT NULL,
  hit_count integer NOT NULL CHECK (hit_count > 0),
  expires_at timestamptz NOT NULL,
  PRIMARY KEY (bucket_key_hash, window_started_at)
);
CREATE INDEX saas_rate_limit_expiry_idx ON saas_rate_limit_buckets (expires_at);

-- ===================================================================
-- Aspen-Lite Integration Schema
-- ===================================================================
--
-- Purpose: Database schema for external system integration support
--
-- New Tables:
--   1. integration_sync_logs - Track sync operations with external systems
--   2. integration_cache - Cache external system responses
--   3. ferpa_audit_logs - FERPA compliance audit trail
--   4. integration_config - Runtime integration configuration
--
-- Extends Existing Schema:
--   - students table (no changes - backward compatible)
--   - schools table (no changes - backward compatible)
--
-- Version: 1.0
-- Created: 2026-01-29
-- ===================================================================

-- ===================================================================
-- TABLE 1: Integration Sync Logs
-- ===================================================================
-- Purpose: Track all synchronization operations with external systems
-- Use Cases:
--   - Monitor integration health
--   - Debug sync failures
--   - Generate compliance reports
--   - Calculate availability metrics

CREATE TABLE IF NOT EXISTS integration_sync_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Integration identification
    integration_name TEXT NOT NULL,              -- 'icare', 'ssm', 'isbe', etc.
    sync_type TEXT NOT NULL,                     -- 'full', 'incremental', 'manual', 'webhook'

    -- Sync status
    status TEXT NOT NULL,                        -- 'success', 'failed', 'partial', 'timeout'
    records_synced INTEGER DEFAULT 0,            -- Number of records processed
    records_failed INTEGER DEFAULT 0,            -- Number of failed records

    -- Error tracking
    error_message TEXT,                          -- Error details (if failed)
    error_code TEXT,                             -- Machine-readable error code

    -- Timing
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    duration_ms INTEGER,                         -- Milliseconds (completed_at - started_at)

    -- Metadata
    triggered_by TEXT,                           -- 'scheduler', 'user:123', 'webhook', 'manual'
    user_id TEXT,                                -- User who triggered (if manual)

    -- Index for fast lookups
    CHECK (status IN ('success', 'failed', 'partial', 'timeout')),
    CHECK (sync_type IN ('full', 'incremental', 'manual', 'webhook'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_integration_sync_logs_name
    ON integration_sync_logs(integration_name);

CREATE INDEX IF NOT EXISTS idx_integration_sync_logs_status
    ON integration_sync_logs(status);

CREATE INDEX IF NOT EXISTS idx_integration_sync_logs_started
    ON integration_sync_logs(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_integration_sync_logs_name_started
    ON integration_sync_logs(integration_name, started_at DESC);

-- ===================================================================
-- TABLE 2: Integration Cache
-- ===================================================================
-- Purpose: Cache responses from external systems to reduce API calls
-- Use Cases:
--   - Improve response times
--   - Reduce load on external systems
--   - Enable offline operation during outages
--   - Track data freshness

CREATE TABLE IF NOT EXISTS integration_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Cache key (unique identifier)
    cache_key TEXT NOT NULL UNIQUE,              -- Format: "{integration}:{resource}:{id}"
                                                 -- Example: "icare:immunizations:10000000"

    -- Cached data
    data TEXT NOT NULL,                          -- JSON-encoded response
    data_hash TEXT,                              -- SHA-256 hash for change detection

    -- Source tracking
    source TEXT NOT NULL,                        -- 'icare', 'ssm', 'isbe'
    resource_type TEXT NOT NULL,                 -- 'immunizations', 'iep', '504'
    resource_id TEXT,                            -- Student ID or other identifier

    -- Cache metadata
    cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,               -- TTL expiration
    hit_count INTEGER DEFAULT 0,                 -- Number of times served from cache
    last_accessed TIMESTAMP,                     -- Last cache hit

    -- Data quality
    is_stale BOOLEAN DEFAULT 0,                  -- Marked stale by invalidation
    checksum TEXT,                               -- Optional data integrity check

    -- Constraints
    CHECK (source IN ('icare', 'ssm', 'isbe', 'local'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_integration_cache_key
    ON integration_cache(cache_key);

CREATE INDEX IF NOT EXISTS idx_integration_cache_expires
    ON integration_cache(expires_at);

CREATE INDEX IF NOT EXISTS idx_integration_cache_source_resource
    ON integration_cache(source, resource_type, resource_id);

CREATE INDEX IF NOT EXISTS idx_integration_cache_stale
    ON integration_cache(is_stale, expires_at);

-- ===================================================================
-- TABLE 3: FERPA Audit Logs
-- ===================================================================
-- Purpose: Compliance audit trail for sensitive student data access
-- Use Cases:
--   - FERPA compliance reporting
--   - Security incident investigation
--   - Access pattern analysis
--   - Parent/student access requests (right to know who viewed data)

CREATE TABLE IF NOT EXISTS ferpa_audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Who accessed the data
    user_id TEXT NOT NULL,                       -- User identifier
    user_email TEXT,                             -- User email
    user_role TEXT,                              -- 'teacher', 'counselor', 'admin', 'nurse', etc.

    -- What was accessed
    student_id TEXT NOT NULL,                    -- Student whose data was accessed
    action TEXT NOT NULL,                        -- 'view', 'export', 'edit', 'delete'
    resource_type TEXT NOT NULL,                 -- 'student_profile', 'health', 'iep', '504'

    -- Data classification
    ferpa_classification TEXT NOT NULL,          -- 'directory', 'educational', 'sensitive'
    fields_accessed TEXT,                        -- JSON array of field names

    -- Context
    ip_address TEXT,                             -- Source IP
    user_agent TEXT,                             -- Browser/client info
    session_id TEXT,                             -- Session identifier

    -- Integration tracking
    data_source TEXT,                            -- 'local', 'icare', 'ssm' (where data came from)

    -- Timing
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Purpose/justification (optional)
    access_reason TEXT,                          -- Why was data accessed

    -- Constraints
    CHECK (action IN ('view', 'export', 'edit', 'delete', 'print')),
    CHECK (ferpa_classification IN ('directory', 'educational', 'sensitive')),
    CHECK (data_source IN ('local', 'icare', 'ssm', 'isbe'))
);

-- Indexes for compliance queries
CREATE INDEX IF NOT EXISTS idx_ferpa_audit_user
    ON ferpa_audit_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_ferpa_audit_student
    ON ferpa_audit_logs(student_id);

CREATE INDEX IF NOT EXISTS idx_ferpa_audit_timestamp
    ON ferpa_audit_logs(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_ferpa_audit_classification
    ON ferpa_audit_logs(ferpa_classification);

CREATE INDEX IF NOT EXISTS idx_ferpa_audit_student_timestamp
    ON ferpa_audit_logs(student_id, timestamp DESC);

-- ===================================================================
-- TABLE 4: Integration Configuration
-- ===================================================================
-- Purpose: Runtime configuration for external system integrations
-- Use Cases:
--   - Enable/disable integrations dynamically
--   - Store API endpoints and credentials (encrypted)
--   - Feature flags for gradual rollout
--   - Integration-specific settings

CREATE TABLE IF NOT EXISTS integration_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Integration identity
    integration_name TEXT NOT NULL UNIQUE,       -- 'icare', 'ssm', 'isbe'
    display_name TEXT NOT NULL,                  -- "I-CARE Immunization Registry"

    -- Status
    is_enabled BOOLEAN DEFAULT 0,                -- Master on/off switch
    is_healthy BOOLEAN DEFAULT 1,                -- Current health status

    -- Configuration
    endpoint_url TEXT,                           -- API base URL
    auth_type TEXT,                              -- 'oauth2', 'api_key', 'saml', 'none'

    -- Credentials (NOTE: Encrypt these in production!)
    credentials_encrypted TEXT,                  -- JSON with encrypted credentials

    -- Behavioral settings
    timeout_ms INTEGER DEFAULT 5000,             -- Request timeout
    retry_attempts INTEGER DEFAULT 3,            -- Max retry attempts
    retry_backoff_ms INTEGER DEFAULT 1000,       -- Initial backoff duration

    -- Caching
    cache_ttl_seconds INTEGER DEFAULT 1800,      -- Default cache TTL (30 min)
    enable_caching BOOLEAN DEFAULT 1,            -- Cache enabled

    -- Rate limiting
    rate_limit_requests INTEGER,                 -- Max requests per window
    rate_limit_window_seconds INTEGER,           -- Rate limit window

    -- Health monitoring
    last_health_check TIMESTAMP,                 -- Last successful health check
    last_error TIMESTAMP,                        -- Last error timestamp
    last_error_message TEXT,                     -- Last error details
    consecutive_failures INTEGER DEFAULT 0,      -- Circuit breaker state

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by TEXT,                             -- Who made the change

    -- Constraints
    CHECK (auth_type IN ('oauth2', 'api_key', 'saml', 'basic', 'none'))
);

-- Default integration configurations
INSERT OR IGNORE INTO integration_config (
    integration_name, display_name, is_enabled, auth_type,
    timeout_ms, cache_ttl_seconds
) VALUES
    ('local', 'Local Database', 1, 'none', 100, 300),
    ('icare', 'I-CARE Immunization Registry', 0, 'oauth2', 5000, 1800),
    ('ssm', 'Student Services Management', 0, 'api_key', 5000, 600),
    ('isbe', 'ISBE Student Information System', 0, 'saml', 10000, 3600);

-- ===================================================================
-- TABLE 5: Integration Metrics (Time-Series)
-- ===================================================================
-- Purpose: Store time-series metrics for monitoring dashboards
-- Use Cases:
--   - Real-time monitoring dashboards
--   - Performance trend analysis
--   - SLA compliance tracking
--   - Capacity planning

CREATE TABLE IF NOT EXISTS integration_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Metric identity
    integration_name TEXT NOT NULL,              -- 'icare', 'ssm', etc.
    metric_name TEXT NOT NULL,                   -- 'response_time_ms', 'error_rate', 'request_count'

    -- Metric value
    value REAL NOT NULL,                         -- Numeric value
    unit TEXT,                                   -- 'milliseconds', 'percentage', 'count'

    -- Time window
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    window_seconds INTEGER,                      -- Aggregation window (60, 300, 3600)

    -- Metadata
    tags TEXT,                                   -- JSON object with additional context

    -- Index for time-series queries
    CHECK (metric_name IN (
        'response_time_ms',
        'error_rate',
        'request_count',
        'cache_hit_rate',
        'availability',
        'timeout_count'
    ))
);

-- Indexes for time-series queries
CREATE INDEX IF NOT EXISTS idx_integration_metrics_name_time
    ON integration_metrics(integration_name, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_integration_metrics_metric_time
    ON integration_metrics(metric_name, timestamp DESC);

-- ===================================================================
-- VIEWS: Convenience Views for Common Queries
-- ===================================================================

-- View: Latest sync status per integration
CREATE VIEW IF NOT EXISTS v_integration_latest_sync AS
SELECT
    integration_name,
    sync_type,
    status,
    records_synced,
    error_message,
    started_at,
    completed_at,
    duration_ms
FROM integration_sync_logs
WHERE id IN (
    SELECT MAX(id)
    FROM integration_sync_logs
    GROUP BY integration_name
)
ORDER BY started_at DESC;

-- View: Integration health summary
CREATE VIEW IF NOT EXISTS v_integration_health AS
SELECT
    c.integration_name,
    c.display_name,
    c.is_enabled,
    c.is_healthy,
    c.last_health_check,
    c.last_error,
    c.last_error_message,
    c.consecutive_failures,
    l.status AS last_sync_status,
    l.started_at AS last_sync_time,
    CASE
        WHEN c.consecutive_failures >= 3 THEN 'down'
        WHEN c.consecutive_failures > 0 THEN 'degraded'
        WHEN c.is_healthy = 1 THEN 'healthy'
        ELSE 'unknown'
    END AS health_status
FROM integration_config c
LEFT JOIN v_integration_latest_sync l ON c.integration_name = l.integration_name;

-- View: FERPA sensitive data access (last 30 days)
CREATE VIEW IF NOT EXISTS v_ferpa_sensitive_access AS
SELECT
    student_id,
    user_id,
    user_email,
    user_role,
    resource_type,
    action,
    timestamp,
    ip_address
FROM ferpa_audit_logs
WHERE ferpa_classification = 'sensitive'
    AND timestamp >= datetime('now', '-30 days')
ORDER BY timestamp DESC;

-- View: Cache hit rate by integration
CREATE VIEW IF NOT EXISTS v_cache_hit_rate AS
SELECT
    source,
    COUNT(*) AS total_entries,
    SUM(hit_count) AS total_hits,
    AVG(hit_count) AS avg_hits_per_entry,
    COUNT(CASE WHEN is_stale = 1 THEN 1 END) AS stale_entries,
    COUNT(CASE WHEN expires_at < CURRENT_TIMESTAMP THEN 1 END) AS expired_entries
FROM integration_cache
GROUP BY source;

-- ===================================================================
-- FUNCTIONS: Helper Queries
-- ===================================================================

-- Query: Get integration availability (last 24 hours)
-- Usage: Run this query to calculate uptime percentage
--
-- SELECT
--     integration_name,
--     COUNT(*) AS total_syncs,
--     SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) AS successful_syncs,
--     ROUND(
--         100.0 * SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) / COUNT(*),
--         2
--     ) AS availability_percent
-- FROM integration_sync_logs
-- WHERE started_at >= datetime('now', '-24 hours')
-- GROUP BY integration_name;

-- Query: Get average response time by integration
-- Usage: Calculate P50, P95, P99 latency
--
-- SELECT
--     integration_name,
--     COUNT(*) AS request_count,
--     AVG(duration_ms) AS avg_ms,
--     MIN(duration_ms) AS min_ms,
--     MAX(duration_ms) AS max_ms
-- FROM integration_sync_logs
-- WHERE status = 'success'
--     AND started_at >= datetime('now', '-1 hour')
-- GROUP BY integration_name;

-- Query: Get error rate (last 5 minutes)
-- Usage: For alerting on high error rates
--
-- SELECT
--     integration_name,
--     COUNT(*) AS total_requests,
--     SUM(CASE WHEN status != 'success' THEN 1 ELSE 0 END) AS failed_requests,
--     ROUND(
--         100.0 * SUM(CASE WHEN status != 'success' THEN 1 ELSE 0 END) / COUNT(*),
--         2
--     ) AS error_rate_percent
-- FROM integration_sync_logs
-- WHERE started_at >= datetime('now', '-5 minutes')
-- GROUP BY integration_name;

-- Query: Clean expired cache entries
-- Usage: Run periodically to free up disk space
--
-- DELETE FROM integration_cache
-- WHERE expires_at < CURRENT_TIMESTAMP
--     OR is_stale = 1;

-- Query: Purge old audit logs (retain 1 year)
-- Usage: Run periodically for data retention compliance
--
-- DELETE FROM ferpa_audit_logs
-- WHERE timestamp < datetime('now', '-1 year');

-- Query: Purge old sync logs (retain 90 days)
-- Usage: Run periodically to manage database size
--
-- DELETE FROM integration_sync_logs
-- WHERE started_at < datetime('now', '-90 days');

-- ===================================================================
-- TRIGGERS: Automated Maintenance
-- ===================================================================

-- Trigger: Update integration_config updated_at timestamp
CREATE TRIGGER IF NOT EXISTS trg_integration_config_updated
AFTER UPDATE ON integration_config
BEGIN
    UPDATE integration_config
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.id;
END;

-- Trigger: Increment cache hit count on access
-- Note: This would be called from application code, not automatically
-- Included here as documentation of expected behavior

-- Trigger: Auto-mark cache as stale when TTL expires
-- Note: Application should check expires_at, this is for documentation

-- ===================================================================
-- SAMPLE DATA: For Development/Testing
-- ===================================================================

-- Sample sync log entries
INSERT INTO integration_sync_logs (
    integration_name, sync_type, status, records_synced,
    started_at, completed_at, duration_ms, triggered_by
) VALUES
    ('icare', 'incremental', 'success', 45,
     datetime('now', '-1 hour'), datetime('now', '-1 hour', '+234 milliseconds'), 234, 'scheduler'),
    ('ssm', 'full', 'success', 23,
     datetime('now', '-2 hours'), datetime('now', '-2 hours', '+567 milliseconds'), 567, 'scheduler'),
    ('icare', 'manual', 'failed', 0,
     datetime('now', '-30 minutes'), datetime('now', '-30 minutes', '+5000 milliseconds'), 5000, 'user:admin');

-- Sample cache entries
INSERT INTO integration_cache (
    cache_key, data, source, resource_type, resource_id,
    cached_at, expires_at, hit_count
) VALUES
    ('icare:immunizations:10000000',
     '{"immunizations": [{"type": "COVID-19", "date": "2024-09-15"}]}',
     'icare', 'immunizations', '10000000',
     datetime('now', '-10 minutes'), datetime('now', '+20 minutes'), 5),
    ('ssm:iep:10000001',
     '{"hasIEP": true, "status": "active"}',
     'ssm', 'iep', '10000001',
     datetime('now', '-5 minutes'), datetime('now', '+5 minutes'), 2);

-- Sample FERPA audit entries
INSERT INTO ferpa_audit_logs (
    user_id, user_email, user_role, student_id, action, resource_type,
    ferpa_classification, fields_accessed, ip_address, data_source
) VALUES
    ('user123', 'teacher@cps.edu', 'teacher', '10000000', 'view', 'student_profile',
     'educational', '["firstName", "lastName", "grade"]', '192.168.1.100', 'local'),
    ('user456', 'nurse@cps.edu', 'nurse', '10000000', 'view', 'health',
     'sensitive', '["immunizations", "complianceStatus"]', '192.168.1.101', 'icare'),
    ('user789', 'counselor@cps.edu', 'counselor', '10000001', 'view', 'iep',
     'sensitive', '["disabilities", "accommodations", "services"]', '192.168.1.102', 'ssm');

-- ===================================================================
-- MIGRATION NOTES
-- ===================================================================

-- To apply this schema to existing database:
-- 1. Backup current database: cp data/aspen.db data/aspen.db.backup
-- 2. Run: sqlite3 data/aspen.db < docs/database/integration-schema.sql
-- 3. Verify: sqlite3 data/aspen.db ".schema"
-- 4. Test queries to ensure indexes are being used

-- To rollback (if needed):
-- DROP TABLE IF EXISTS integration_sync_logs;
-- DROP TABLE IF EXISTS integration_cache;
-- DROP TABLE IF EXISTS ferpa_audit_logs;
-- DROP TABLE IF EXISTS integration_config;
-- DROP TABLE IF EXISTS integration_metrics;
-- DROP VIEW IF EXISTS v_integration_latest_sync;
-- DROP VIEW IF EXISTS v_integration_health;
-- DROP VIEW IF EXISTS v_ferpa_sensitive_access;
-- DROP VIEW IF EXISTS v_cache_hit_rate;

-- ===================================================================
-- END OF SCHEMA
-- ===================================================================

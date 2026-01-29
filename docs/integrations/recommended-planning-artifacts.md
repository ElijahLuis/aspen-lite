# Recommended Integration Planning Artifacts

Before starting implementation, consider creating these additional planning documents:

---

## 1. API Contract Specifications (HIGH PRIORITY)

**Purpose**: Define exact request/response formats for new endpoints

**Tool**: OpenAPI 3.0 (Swagger)

**Why Important**:
- Frontend and backend teams can work in parallel
- Auto-generate client libraries
- Built-in API documentation
- Contract testing prevents breaking changes

**What to Document**:
```yaml
# Example: GET /api/students/{id}/health
/api/students/{studentId}/health:
  get:
    summary: Get student immunization records from I-CARE
    parameters:
      - name: studentId
        in: path
        required: true
        schema:
          type: string
    responses:
      200:
        description: Immunization records retrieved successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                studentId:
                  type: string
                immunizations:
                  type: array
                  items:
                    $ref: '#/components/schemas/Immunization'
                source:
                  type: string
                  enum: [I-CARE]
      500:
        description: I-CARE system unavailable
```

**Create**: `docs/api/openapi.yaml`

---

## 2. Mock Data & Sample Responses (HIGH PRIORITY)

**Purpose**: Enable development without live external systems

**Why Important**:
- Don't need real I-CARE credentials during development
- Faster iteration (no network calls)
- Consistent test data
- Can simulate error conditions

**What to Create**:

### I-CARE Mock Responses
```json
// data/mocks/icare-immunizations.json
{
  "studentId": "10000000",
  "immunizations": [
    {
      "immunization_type": "COVID-19 (Pfizer-BioNTech)",
      "administration_date": "2024-09-15",
      "provider": "Chicago Department of Public Health",
      "source": "I-CARE"
    },
    {
      "immunization_type": "Tdap (Tetanus, Diphtheria, Pertussis)",
      "administration_date": "2023-08-01",
      "provider": "CVS Pharmacy",
      "source": "I-CARE"
    }
  ],
  "source": "I-CARE"
}
```

### SSM Mock Responses
```json
// data/mocks/ssm-special-services.json
{
  "studentId": "10000000",
  "iep": {
    "has_iep": true,
    "begin_date": "2024-09-01",
    "end_date": "2025-08-31",
    "disabilities": ["Specific Learning Disability"],
    "services": ["Resource Room - 45 min daily", "Extended time on tests"]
  },
  "504": null,
  "source": "SSM"
}
```

### Mock Adapter Implementation
```python
# adapters/mock_icare_adapter.py
class MockICareAdapter(BaseAdapter):
    """Mock I-CARE adapter for development."""

    async def get_immunizations(self, student_id: str):
        # Load from JSON file
        with open('data/mocks/icare-immunizations.json') as f:
            return json.load(f)
```

**Create**:
- `data/mocks/` directory with sample responses
- `adapters/mock_*.py` files for each integration

---

## 3. Environment Configuration Guide (MEDIUM PRIORITY)

**Purpose**: Document how to set up local development environment

**Why Important**:
- New developers can get started quickly
- Reduces "works on my machine" issues
- Documents all dependencies and credentials

**What to Document**:

### Development Setup
```markdown
## Local Development Setup

### Prerequisites
- Python 3.11+
- Redis (for caching and async tasks)
- I-CARE test credentials (optional)
- SSM test credentials (optional)

### Quick Start
1. Clone repository
2. Install dependencies: `pip install -r requirements.txt`
3. Copy `.env.example` to `.env`
4. Start Redis: `redis-server`
5. Run server: `python3 server_v2.py`

### Environment Variables

#### Local Development (No External Integrations)
```bash
# Use mock adapters
ICARE_ENABLED=false
SSM_ENABLED=false
USE_MOCKS=true  # Use mock data from data/mocks/
```

#### Development with I-CARE Integration
```bash
ICARE_ENABLED=true
ICARE_ENDPOINT=https://test.icareHL7.dph.illinois.gov  # Test environment
ICARE_CLIENT_ID=<obtain from IDPH>
ICARE_CLIENT_SECRET=<obtain from IDPH>
ICARE_TOKEN_URL=https://test.okta.example.com/oauth2/token
```

#### Testing
```bash
# Run unit tests (no external calls)
pytest tests/unit/

# Run integration tests (requires external systems)
pytest tests/integration/

# Run with coverage
pytest --cov=. --cov-report=html
```
```

**Create**: `docs/DEVELOPMENT.md`

---

## 4. Security & Credential Management (HIGH PRIORITY)

**Purpose**: Define how to securely manage API keys, tokens, secrets

**Why Important**:
- Prevent credential leaks to Git
- Meet compliance requirements (FERPA, SOC 2)
- Enable secure CI/CD

**What to Document**:

### Credential Storage
```markdown
## Credential Management Strategy

### Development
- Use `.env` file (never commit to Git)
- Add `.env` to `.gitignore`
- Store in secure password manager (1Password, LastPass)

### Production
- Use environment variables (set by deployment system)
- Or use secret management service:
  - AWS Secrets Manager
  - Azure Key Vault
  - HashiCorp Vault

### Rotation Policy
- I-CARE OAuth tokens: Auto-refresh (1 hour expiry)
- SSM API keys: Rotate quarterly
- Database credentials: Rotate semi-annually
- Application secrets: Rotate annually

### Access Control
- Limit who can access production credentials
- Use role-based access (RBAC)
- Audit credential access
```

### Git Security
```bash
# Add to .gitignore
.env
.env.local
.env.production
*.key
*.pem
credentials.json
secrets.json

# Scan for leaked secrets
git-secrets --scan
```

**Create**:
- `docs/SECURITY.md`
- `.env.example` (with placeholder values)
- Update `.gitignore`

---

## 5. Database Schema Changes (MEDIUM PRIORITY)

**Purpose**: Document new tables/columns needed for integrations

**Why Important**:
- Track integration metadata
- Cache external data
- Store sync logs

**What to Document**:

### New Tables
```sql
-- Integration sync logs
CREATE TABLE integration_sync_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  integration_name TEXT NOT NULL,  -- 'icare', 'ssm', etc.
  sync_type TEXT NOT NULL,         -- 'full', 'incremental', 'manual'
  status TEXT NOT NULL,            -- 'success', 'failed', 'partial'
  records_synced INTEGER,
  error_message TEXT,
  started_at TIMESTAMP,
  completed_at TIMESTAMP
);

-- Cached integration data
CREATE TABLE integration_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cache_key TEXT NOT NULL UNIQUE,
  data TEXT NOT NULL,              -- JSON data
  source TEXT NOT NULL,            -- 'icare', 'ssm'
  cached_at TIMESTAMP,
  expires_at TIMESTAMP
);

-- FERPA audit logs
CREATE TABLE ferpa_audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  action TEXT NOT NULL,            -- 'view', 'export', 'edit'
  data_classification TEXT,        -- 'directory', 'educational', 'sensitive'
  fields_accessed TEXT,            -- JSON array
  ip_address TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Create**: `docs/database/integration-schema.sql`

---

## 6. Integration Health Monitoring Plan (MEDIUM PRIORITY)

**Purpose**: Define how to monitor integration health and alert on failures

**Why Important**:
- Know when I-CARE/SSM are down
- Track response times and error rates
- Proactive incident response

**What to Monitor**:

### Metrics to Track
- **Availability**: Uptime percentage for each integration
- **Latency**: P50, P95, P99 response times
- **Error Rate**: Failed requests / total requests
- **Throughput**: Requests per minute
- **Cache Hit Rate**: Percentage of requests served from cache

### Alerting Rules
```yaml
# Example monitoring config
alerts:
  - name: I-CARE High Error Rate
    condition: icare_error_rate > 10%
    duration: 5 minutes
    severity: warning

  - name: I-CARE Down
    condition: icare_availability < 95%
    duration: 2 minutes
    severity: critical

  - name: SSM Slow Response
    condition: ssm_p95_latency > 2000ms
    duration: 5 minutes
    severity: warning
```

### Health Check Endpoint
```python
# GET /api/integrations/status
{
  "local": {
    "status": "healthy",
    "response_time_ms": 5
  },
  "icare": {
    "status": "healthy",
    "response_time_ms": 234,
    "last_sync": "2026-01-29T10:30:00Z",
    "error_rate_5m": 0.02
  },
  "ssm": {
    "status": "degraded",
    "response_time_ms": 1850,
    "last_sync": "2026-01-29T09:45:00Z",
    "error_rate_5m": 0.15
  }
}
```

**Create**: `docs/monitoring/integration-health.md`

---

## 7. Rollback Strategy (LOW PRIORITY - but good to have)

**Purpose**: Define how to safely revert if integration causes issues

**Why Important**:
- Minimize downtime during incidents
- Safe experimentation with new integrations
- Confidence to deploy changes

**What to Document**:

### Feature Flags
```python
# Use feature flags to enable/disable integrations
if feature_flags.is_enabled('icare_integration'):
    icare_adapter = ICareAdapter(...)
else:
    icare_adapter = None  # Graceful degradation
```

### Database Migrations
```python
# All schema changes should be reversible
class AddIntegrationTables(Migration):
    def up(self):
        # Create new tables
        pass

    def down(self):
        # Drop tables (rollback)
        pass
```

### Deployment Strategy
- Blue-green deployment
- Canary releases (5% → 25% → 100% traffic)
- Automated rollback on high error rate

**Create**: `docs/deployment/rollback-strategy.md`

---

## Priority Recommendations

### Start Implementation Phase
**Must Have Before Coding**:
1. ✅ API Contract Specifications (OpenAPI)
2. ✅ Mock Data & Sample Responses
3. ✅ Security & Credential Management Strategy

**Should Have Before Beta**:
4. Environment Configuration Guide
5. Database Schema Changes
6. Integration Health Monitoring Plan

**Nice to Have**:
7. Rollback Strategy

---

## Quick Wins

### This Week
- Create `.env.example` with all integration variables
- Add mock JSON files to `data/mocks/`
- Write simple mock adapters for development
- Update `.gitignore` with credential patterns

### Next Week
- Draft OpenAPI spec for new endpoints
- Document environment setup in `docs/DEVELOPMENT.md`
- Design integration sync logs table schema

---

**Note**: These are recommendations, not requirements. Start with what provides immediate value for your workflow.

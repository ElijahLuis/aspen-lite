# Integration Architecture: Technical Specifications Summary

**Created**: 2026-01-29
**Status**: Planning Complete - Ready for Implementation

This document provides a comprehensive overview of the technical specifications for integrating aspen-lite with external CPS systems (I-CARE, SSM) and implementing educational technology standards (Ed-Fi, OneRoster).

---

## Quick Navigation

### Core Documents

1. **[Integration Architecture Plan](../../.claude/plans/prancy-strolling-star.md)**
   - Overall integration strategy
   - Implementation phases (5 phases, 9+ weeks)
   - Architecture diagrams and patterns

2. **[External Systems Research](external-systems-research.md)**
   - I-CARE (Illinois Immunization Registry) integration details
   - SSM (Student Services Management) API information
   - CPS systems overview and integration patterns

3. **[Ed-Tech Standards Guide](edtech-standards-guide.md)**
   - Ed-Fi Data Standard implementation guide
   - OneRoster 1.2 REST API specification
   - Code examples and data mapping

4. **[Database Schema](../database/integration-schema.sql)**
   - New tables: `integration_sync_logs`, `integration_cache`, `ferpa_audit_logs`
   - Views for monitoring and reporting
   - Sample queries and maintenance procedures

5. **[API Specifications](#api-specifications)** (this document)
   - Complete OpenAPI 3.0 specification
   - Request/response formats
   - Error handling patterns

---

## API Specifications

### New Integration Endpoints

#### 1. GET /api/students/{studentId}/health

**Purpose**: Retrieve immunization records from I-CARE

**Request**:
```http
GET /api/students/10000000/health?includeCompliance=true
```

**Response** (200 OK):
```json
{
  "studentId": "10000000",
  "firstName": "Nia",
  "lastName": "Moore",
  "immunizations": [
    {
      "immunizationType": "COVID-19 (Pfizer-BioNTech)",
      "administrationDate": "2024-09-15",
      "provider": "Chicago Department of Public Health",
      "lotNumber": "FG3482",
      "doseNumber": 1,
      "seriesComplete": false,
      "source": "I-CARE"
    }
  ],
  "complianceStatus": {
    "isCompliant": true,
    "lastVerified": "2026-01-29T10:30:00Z",
    "missingRequirements": []
  },
  "source": "I-CARE",
  "timestamp": "2026-01-29T14:25:33Z"
}
```

**Caching**: 30 minutes (1800 seconds)

**Ed-Fi Mapping**: `StudentHealthImmunizations` domain

---

#### 2. GET /api/students/{studentId}/special-services

**Purpose**: Retrieve IEP/504 data from SSM

**Request**:
```http
GET /api/students/10000000/special-services?includeAccommodations=true
```

**Response** (200 OK):
```json
{
  "studentId": "10000000",
  "firstName": "Nia",
  "lastName": "Moore",
  "hasServices": true,
  "iep": {
    "hasIEP": true,
    "status": "active",
    "beginDate": "2024-09-01",
    "endDate": "2025-08-31",
    "disabilities": ["Specific Learning Disability"],
    "services": ["Resource Room - 45 min daily"],
    "accommodations": [
      {
        "category": "Testing",
        "description": "Extended time (1.5x)",
        "applies_to": ["Classroom tests", "Standardized assessments"]
      }
    ]
  },
  "section504": null,
  "caseManager": {
    "name": "Sarah Johnson",
    "email": "sjohnson@cps.edu"
  },
  "source": "SSM",
  "timestamp": "2026-01-29T14:25:33Z"
}
```

**Caching**: 10 minutes (600 seconds)

**FERPA**: Highly sensitive - requires authorization, audit logged

**Ed-Fi Mapping**: `StudentSpecialEducationProgramAssociation` domain

---

#### 3. GET /api/integrations/status

**Purpose**: Health check for all external integrations

**Request**:
```http
GET /api/integrations/status
```

**Response** (200 OK):
```json
{
  "overall": "healthy",
  "integrations": {
    "local": {
      "status": "healthy",
      "responseTimeMs": 5,
      "availability": 100.0,
      "lastCheck": "2026-01-29T14:25:33Z"
    },
    "icare": {
      "status": "healthy",
      "responseTimeMs": 234,
      "availability": 99.8,
      "lastSync": "2026-01-29T14:20:00Z",
      "errorRate5m": 0.02,
      "lastCheck": "2026-01-29T14:25:33Z"
    },
    "ssm": {
      "status": "healthy",
      "responseTimeMs": 156,
      "availability": 99.5,
      "lastSync": "2026-01-29T14:15:00Z",
      "errorRate5m": 0.05,
      "lastCheck": "2026-01-29T14:25:33Z"
    }
  },
  "timestamp": "2026-01-29T14:25:33Z"
}
```

**Caching**: 1 minute (60 seconds)

---

#### 4. GET /api/students/{studentId} (ENHANCED)

**Changes**: Added data provenance tracking

**New Fields**:
- `sources[]` - Array showing which systems contributed data
- `timestamp` - Response generation timestamp
- `healthSummary` - Summary from I-CARE (if available)
- `specialServicesSummary` - Summary from SSM (if available)

**Response** (200 OK):
```json
{
  "student": {
    "studentId": "10000000",
    "firstName": "Nia",
    "lastName": "Moore",
    "grade": 11,
    "gender": "Female",
    "ethnicity": "Black/African American",
    "school": "Whitney M. Young Magnet High School",
    "healthSummary": {
      "isCompliant": true,
      "source": "I-CARE",
      "detailsUrl": "/api/students/10000000/health"
    },
    "specialServicesSummary": {
      "hasServices": true,
      "serviceTypes": ["IEP"],
      "source": "SSM",
      "detailsUrl": "/api/students/10000000/special-services"
    }
  },
  "sources": [
    {
      "system": "local",
      "status": "success",
      "fields": ["studentId", "firstName", "lastName", "grade", "gender", "ethnicity", "school"]
    },
    {
      "system": "I-CARE",
      "status": "success",
      "fields": ["healthSummary"]
    },
    {
      "system": "SSM",
      "status": "success",
      "fields": ["specialServicesSummary"]
    }
  ],
  "timestamp": "2026-01-29T14:25:33Z"
}
```

**Backward Compatible**: All existing fields unchanged

---

## Database Schema

### New Tables

#### integration_sync_logs
Tracks all synchronization operations with external systems.

```sql
CREATE TABLE integration_sync_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    integration_name TEXT NOT NULL,     -- 'icare', 'ssm', 'isbe'
    sync_type TEXT NOT NULL,            -- 'full', 'incremental', 'manual'
    status TEXT NOT NULL,               -- 'success', 'failed', 'partial'
    records_synced INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    duration_ms INTEGER
);
```

**Use Cases**:
- Monitor integration health
- Debug sync failures
- Calculate availability metrics

---

#### integration_cache
Cache responses from external systems to reduce API calls.

```sql
CREATE TABLE integration_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cache_key TEXT NOT NULL UNIQUE,     -- "{integration}:{resource}:{id}"
    data TEXT NOT NULL,                 -- JSON-encoded response
    source TEXT NOT NULL,               -- 'icare', 'ssm', 'isbe'
    resource_type TEXT NOT NULL,        -- 'immunizations', 'iep', '504'
    cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    hit_count INTEGER DEFAULT 0
);
```

**Use Cases**:
- Improve response times
- Reduce load on external systems
- Enable offline operation during outages

---

#### ferpa_audit_logs
FERPA compliance audit trail for sensitive student data access.

```sql
CREATE TABLE ferpa_audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    action TEXT NOT NULL,                -- 'view', 'export', 'edit'
    resource_type TEXT NOT NULL,         -- 'health', 'iep', '504'
    ferpa_classification TEXT NOT NULL,  -- 'sensitive'
    fields_accessed TEXT,                -- JSON array
    ip_address TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Use Cases**:
- FERPA compliance reporting
- Security incident investigation
- Parent/student access requests

---

#### integration_config
Runtime configuration for external system integrations.

```sql
CREATE TABLE integration_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    integration_name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    is_enabled BOOLEAN DEFAULT 0,
    endpoint_url TEXT,
    auth_type TEXT,                      -- 'oauth2', 'api_key', 'saml'
    timeout_ms INTEGER DEFAULT 5000,
    cache_ttl_seconds INTEGER DEFAULT 1800
);
```

**Default Entries**:
- `local` - Local Database (always enabled)
- `icare` - I-CARE Immunization Registry (disabled by default)
- `ssm` - Student Services Management (disabled by default)
- `isbe` - ISBE Student Information System (disabled by default)

---

## Educational Standards Implementation

### Ed-Fi Data Standard

**Purpose**: Core data model for K-12 education

**Usage in Aspen-Lite**:
- Internal data models use Ed-Fi entity structure
- API responses map to Ed-Fi schemas
- Documentation references Ed-Fi domains

**Key Entities**:
- `Student` → aspen-lite students table
- `StudentSchoolAssociation` → enrollment data
- `StudentHealthImmunizations` → I-CARE immunization data
- `StudentSpecialEducationProgramAssociation` → SSM IEP data

**Example Mapping**:
```python
class EdFiStudent(BaseModel):
    studentUniqueId: str          # student_id column
    firstName: str                # first_name column
    lastSurname: str              # last_name column
    sexDescriptor: str            # gender column
    races: List[str]              # derived from ethnicity column
    healthRecords: List[HealthRecord] = []  # From I-CARE integration
    specialEducation: Optional[SpecialEducation] = None  # From SSM
```

---

### OneRoster 1.2

**Purpose**: SIS-to-LMS integration standard

**Usage in Aspen-Lite**:
- Expose OneRoster REST API for external integrations
- Enable Canvas, Google Classroom connections
- Provide rostering data to third-party tools

**Core Resources**:
- `User` (students, teachers)
- `Org` (schools, districts)
- `Class` (course sections)
- `Enrollment` (user-to-class relationships)

**Example Endpoint**:
```http
GET /ims/oneroster/v1p2/users

Response:
{
  "users": [
    {
      "sourcedId": "student-10000000",
      "status": "active",
      "givenName": "Nia",
      "familyName": "Moore",
      "role": "student",
      "identifier": "10000000",
      "grades": ["11"]
    }
  ]
}
```

---

## Implementation Phases

### Phase 1: Foundation (Weeks 1-2)
- ✅ Create directory structure (`core/`, `services/`, `adapters/`)
- ✅ Implement Ed-Fi data models (Pydantic)
- ✅ Create base adapter interface
- ✅ Wrap existing SQLite in local adapter
- ✅ Build service layer for aggregation
- ✅ Unit tests

**Critical Files**:
- `core/models.py` - Ed-Fi data models
- `adapters/base_adapter.py` - Adapter interface
- `adapters/local_adapter.py` - SQLite adapter
- `services/student_service.py` - Aggregation logic

---

### Phase 2: I-CARE Integration (Weeks 3-4)
- ⏳ Set up OAuth 2.0 client
- ⏳ Implement HL7 v2.5.1 parser (using `hl7apy`)
- ⏳ Create I-CARE adapter
- ⏳ Add `/api/students/{id}/health` endpoint
- ⏳ Update frontend with Health tab
- ⏳ Add integration status endpoint

**Critical Files**:
- `integrations/auth/oauth_client.py` - OAuth 2.0
- `integrations/hl7/parser.py` - HL7 parsing
- `adapters/icare_adapter.py` - I-CARE integration
- `views/student-detail.js` - Health tab UI

**Required Libraries**:
```txt
hl7apy==1.3.5
authlib==1.3.0
pydantic==2.5.3
httpx==0.25.2
python-dotenv==1.0.0
```

---

### Phase 3: SSM Integration (Weeks 5-6)
- ⏳ Research SSM API (coordinate with CPS IT)
- ⏳ Create SSM adapter
- ⏳ Add `/api/students/{id}/special-services` endpoint
- ⏳ Implement FERPA validator
- ⏳ Add audit logging
- ⏳ Update frontend with Special Services tab

**Critical Files**:
- `adapters/ssm_adapter.py` - SSM integration
- `integrations/validators/ferpa_validator.py` - FERPA compliance
- `views/student-detail.js` - Special Services tab UI

---

### Phase 4: Async Processing (Weeks 7-8)
- ⏳ Set up Redis for caching
- ⏳ Implement Celery for background tasks
- ⏳ Add retry logic with exponential backoff
- ⏳ Implement circuit breaker pattern
- ⏳ Performance monitoring

**Required Libraries**:
```txt
celery==5.3.4
redis==5.0.1
```

---

### Phase 5: OneRoster API (Week 9+)
- ⏳ Implement OneRoster 1.2 REST endpoints
- ⏳ OAuth 1.0a authentication
- ⏳ Test with Canvas/Google Classroom
- ⏳ Consider IMS certification

---

## Error Handling & Graceful Degradation

### Graceful Degradation Strategy

When external integrations fail, the system continues to function:

```python
# Example: I-CARE unavailable
def get_student_health(student_id):
    try:
        data = icare_adapter.get_immunizations(student_id)
        return jsonify(data), 200
    except ICareUnavailableError:
        # Log error, return 500 with degraded status
        return jsonify({
            'error': 'I-CARE service unavailable',
            'source': 'I-CARE',
            'degraded': True,
            'retryAfter': 60,
            'timestamp': datetime.utcnow().isoformat() + 'Z'
        }), 500
```

**Frontend Handling**:
```javascript
// UI shows error but application continues
async function renderHealth(studentId, content) {
    try {
        const { immunizations, source } = await getStudentHealth(studentId);
        // Render immunization table
    } catch (error) {
        content.innerHTML = `
            <div class="detail-section">
                <h2>Health & Immunizations</h2>
                <p class="error-message">
                    Unable to load health records. The I-CARE system may be unavailable.
                </p>
            </div>
        `;
    }
}
```

---

## Security & Compliance

### FERPA Classification

| Data Type | Classification | Access Level | Audit Required |
|-----------|----------------|--------------|----------------|
| Student demographics | Educational Record | Standard | No |
| Immunization records | Educational Record | Standard | No |
| IEP/504 data | Highly Sensitive | Restricted | Yes |

### Role-Based Access Control (RBAC)

```python
access_matrix = {
    'teacher': ['directory', 'educational'],
    'counselor': ['directory', 'educational', 'sensitive'],
    'nurse': ['directory', 'educational', 'sensitive'],
    'admin': ['directory', 'educational', 'sensitive'],
    'parent': ['directory', 'educational']
}
```

### Audit Logging

All access to sensitive data (IEP/504) is logged:

```python
ferpa_audit_log.create({
    'user_id': current_user.id,
    'student_id': student_id,
    'action': 'view',
    'resource_type': 'iep',
    'ferpa_classification': 'sensitive',
    'fields_accessed': ['disabilities', 'accommodations'],
    'ip_address': request.remote_addr,
    'timestamp': datetime.utcnow()
})
```

---

## Performance Targets

| Metric | Target | Strategy |
|--------|--------|----------|
| Student detail (local only) | 50ms | Indexed SQLite queries |
| Student detail (with integrations) | 300ms (first), 50ms (cached) | Multi-layer caching |
| Integration health check | 100ms | Cached for 1 minute |
| I-CARE immunization query | 200ms | Cache for 30 minutes |
| SSM IEP query | 150ms | Cache for 10 minutes |

### Caching Strategy

```python
CACHE_CONFIG = {
    'immunizations': {'ttl': 1800},      # 30 minutes
    'iep': {'ttl': 600},                  # 10 minutes
    '504': {'ttl': 600},                  # 10 minutes
    'integration_status': {'ttl': 60}     # 1 minute
}
```

---

## Testing Strategy

### Unit Tests
```python
def test_icare_adapter_parses_hl7():
    adapter = ICareAdapter(endpoint='https://test', oauth_config={})
    immunizations = adapter.get_immunizations('10000000')
    assert len(immunizations) > 0
    assert immunizations[0].immunization_type == 'COVID-19'
```

### Integration Tests
```python
@pytest.mark.integration
def test_student_service_aggregates_all_sources():
    service = StudentService(
        local_adapter=LocalAdapter('data/test.db'),
        icare_adapter=MockICareAdapter(),
        ssm_adapter=MockSSMAdapter()
    )
    student = service.get_student_profile('10000000')
    assert student.health_records  # From I-CARE
    assert student.special_education  # From SSM
```

### FERPA Compliance Tests
```python
def test_ferpa_restricts_sensitive_data():
    student_data = {'iep': {...}, 'immunizations': [...]}
    filtered = FERPAValidator.filter_student_data(student_data, 'teacher')
    assert 'iep' not in filtered  # Teachers can't see IEP
    assert 'immunizations' in filtered  # But can see immunizations
```

---

## Monitoring & Alerting

### Key Metrics

```python
# Prometheus metrics (future)
icare_requests_total = Counter('icare_requests_total')
icare_errors_total = Counter('icare_errors_total')
icare_latency_seconds = Histogram('icare_latency_seconds')
```

### Alert Rules

```yaml
alerts:
  - name: I-CARE High Error Rate
    condition: icare_error_rate > 10%
    duration: 5 minutes
    severity: warning

  - name: I-CARE Down
    condition: icare_availability < 95%
    duration: 2 minutes
    severity: critical
```

---

## Environment Configuration

### .env File

```bash
# Local Database
DB_PATH=data/aspen.db

# I-CARE Integration
ICARE_ENABLED=true
ICARE_ENDPOINT=https://icareHL7.dph.illinois.gov
ICARE_CLIENT_ID=your_client_id
ICARE_CLIENT_SECRET=your_client_secret
ICARE_TOKEN_URL=https://okta.example.com/oauth2/token

# SSM Integration
SSM_ENABLED=true
SSM_BASE_URL=https://ssm.cps.edu/api/v1
SSM_API_KEY=your_api_key

# Caching
REDIS_URL=redis://localhost:6379/1

# Security
SECRET_KEY=your_secret_key
FERPA_AUDIT_ENABLED=true
```

---

## Summary

This integration architecture provides:

✅ **Clean Abstractions**: Adapter pattern isolates external system complexity

✅ **Standards-Based**: Ed-Fi data model, OneRoster API, HL7 for health data

✅ **Graceful Degradation**: System works even when integrations fail

✅ **FERPA Compliant**: Built-in access control and audit logging

✅ **Performance**: Multi-layer caching, async processing

✅ **Future-Proof**: Easy to add new integrations (MealViewer, LMS, etc.)

### Next Steps

1. Review all technical specifications
2. Set up development environment
3. Begin Phase 1 implementation (Foundation)
4. Contact I-CARE for test credentials
5. Coordinate with CPS IT for SSM API access

---

**Document Maintained By**: Claude Code
**Last Updated**: 2026-01-29
**Status**: Specifications complete, ready for implementation

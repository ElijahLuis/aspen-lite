# Educational Technology Standards Implementation Guide

**Document Version**: 1.0
**Last Updated**: 2026-01-29
**Purpose**: Technical guide for implementing Ed-Fi and OneRoster standards in aspen-lite

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Ed-Fi Data Standard](#ed-fi-data-standard)
3. [OneRoster Standard](#oneroster-standard)
4. [Implementation Strategy](#implementation-strategy)
5. [Data Mapping](#data-mapping)
6. [Code Examples](#code-examples)
7. [Certification & Compliance](#certification--compliance)

---

## Executive Summary

### Why Use Educational Standards?

**Problem**: Every student information system (SIS) uses different data formats, making integrations complex and brittle.

**Solution**: Industry standards provide:
- **Common language**: Agreed-upon field names and data structures
- **Interoperability**: Works with 250+ vendors out of the box
- **Reduced cost**: No custom integration for each new system
- **Future-proof**: Standards evolve with education technology needs

### Standards Overview

| Standard | Purpose | Adoption | When to Use |
|----------|---------|----------|-------------|
| **Ed-Fi** | Core data model for K-12 | 250+ vendors, 32 states, 12K districts | Internal data modeling, state reporting |
| **OneRoster** | SIS interoperability | Most LMS platforms (Canvas, Google Classroom) | External API, third-party integrations |
| **HL7 v2.x** | Healthcare data exchange | Universal in healthcare | Immunization data (I-CARE) |
| **CEDS** | Federal data definitions | US Department of Education | State/federal reporting |

### Recommendation for Aspen-Lite

1. **Use Ed-Fi for internal data model** - Structures our database and APIs around proven standard
2. **Expose OneRoster API for external integrations** - Enables Canvas, Google Classroom, assessment tools to connect
3. **Map to both standards** - Internal Ed-Fi, external OneRoster (translation layer)

---

## Ed-Fi Data Standard

### Overview

**Ed-Fi Alliance**: Non-profit organization creating open-source data standards for K-12 education.

**Current Version**: Ed-Fi Data Standard v5.0 (released 2023)

**License**: Apache 2.0 (free and open-source)

**Website**: https://www.ed-fi.org/

### Core Concepts

#### 1. Domain Model

Ed-Fi organizes education data into **domains**:

| Domain | Description | Key Entities |
|--------|-------------|--------------|
| **Student** | Student demographics and enrollment | Student, StudentSchoolAssociation, StudentEducationOrganizationAssociation |
| **Enrollment** | School attendance and enrollment | StudentSchoolAssociation, StudentSectionAssociation |
| **Assessment** | Testing and assessments | Assessment, StudentAssessment, ObjectiveAssessment |
| **Grades** | Grading and transcripts | Grade, GradebookEntry, StudentGradebookEntry |
| **Attendance** | Daily and class attendance | StudentSchoolAttendanceEvent, StudentSectionAttendanceEvent |
| **Special Education** | IEP, 504 plans, services | StudentSpecialEducationProgramAssociation, StudentSection504PlanProgramAssociation |
| **Health** | Student health records | StudentHealthImmunizations, StudentHealthConditions |

#### 2. Entity Structure

Ed-Fi entities follow consistent patterns:

```
Entity Name: Student
Properties:
  - studentUniqueId (required) - Natural key, usually state ID
  - personalIdentificationDocument - Social security number, passport, etc.
  - firstName (required)
  - middleName (optional)
  - lastSurname (required) - Last name
  - generationCodeSuffix (optional) - Jr., Sr., III
  - birthDate (required)
  - birthSexDescriptor (optional) - Sex assigned at birth
  - birthCity, birthStateAbbreviation, birthCountryDescriptor (optional)

Collections:
  - races (array) - RaceDescriptor (e.g., "White", "Black or African American")
  - hispanicLatinoEthnicity (boolean)
  - addresses (array) - Home, physical, mailing, etc.
  - electronicMails (array) - Email addresses
  - telephones (array) - Phone numbers
  - languages (array) - Languages spoken
```

#### 3. Descriptors (Enumerations)

Ed-Fi uses **descriptors** instead of hard-coded enums:

```
Descriptor: GradeLevelDescriptor
Values:
  - Infant/toddler
  - Preschool/Prekindergarten
  - Transitional Kindergarten
  - Kindergarten
  - First grade, Second grade, ... Twelfth grade
  - Grade 13
  - Postsecondary
  - Ungraded
  - Other
```

**Why descriptors?**
- Extensible (add custom values)
- Namespace support (avoid collisions)
- Localized (different states/districts use different terms)

#### 4. Associations (Relationships)

Ed-Fi uses explicit association entities:

```
StudentSchoolAssociation:
  - studentReference (FK to Student)
  - schoolReference (FK to School)
  - entryDate (when student enrolled)
  - entryGradeLevelDescriptor (grade at entry)
  - exitWithdrawDate (optional, when student left)
  - exitWithdrawTypeDescriptor (reason for leaving)
  - graduationPlanReference (FK to GraduationPlan)
```

This approach:
- Makes relationships explicit
- Supports temporal data (entry/exit dates)
- Enables rich metadata (reason for leaving, graduation plan)

### Ed-Fi API Specification

Ed-Fi also defines a **REST API specification** called the **Ed-Fi ODS/API** (Operational Data Store / API).

**Key Features**:
- REST endpoints for all entities
- OAuth 2.0 authentication
- Bulk operations
- Change notifications
- Composites (pre-joined data)

**Example Endpoints**:
```
GET    /ed-fi/students                    # List students
POST   /ed-fi/students                    # Create student
GET    /ed-fi/students/{id}               # Get student
PUT    /ed-fi/students/{id}               # Update student
DELETE /ed-fi/students/{id}               # Delete student

GET    /ed-fi/studentSchoolAssociations   # Enrollments
GET    /ed-fi/grades                      # Grades
GET    /ed-fi/attendanceEvents            # Attendance
```

**Aspen-Lite Decision**: We won't implement full Ed-Fi ODS/API (complex), but we'll:
1. Use Ed-Fi data model internally (our database matches Ed-Fi entities)
2. Map our API responses to Ed-Fi structure
3. Provide Ed-Fi documentation for integrators

### Ed-Fi Resources

**Official Documentation**:
- Data Standard Docs: https://docs.ed-fi.org/reference/data-exchange/data-standard/
- API Guidelines: https://docs.ed-fi.org/reference/data-exchange/api-guidelines/
- Data Handbook: https://docs.ed-fi.org/reference/data-handbook/

**GitHub Repositories**:
- Data Standard: https://github.com/Ed-Fi-Alliance-OSS/Ed-Fi-Data-Standard
- ODS/API: https://github.com/Ed-Fi-Alliance-OSS/Ed-Fi-ODS

**Learning Resources**:
- Ed-Fi 101: https://www.ed-fi.org/getting-started/
- Webinars: https://www.ed-fi.org/resources/webinars/

---

## OneRoster Standard

### Overview

**IMS Global Learning Consortium**: International organization creating ed-tech standards.

**OneRoster Version**: 1.2 (current), 1.3 (draft)

**Purpose**: Rostering (syncing users, courses, enrollments between SIS and LMS/tools)

**License**: IMS Global specification (free to implement)

**Website**: https://www.imsglobal.org/activity/onerosterlis

### Core Concepts

#### 1. Resource Types

OneRoster defines 7 core resource types:

| Resource | Description | Example |
|----------|-------------|---------|
| **User** | Students, teachers, staff, parents | Student "Jane Doe", Teacher "Mr. Smith" |
| **Org** | Schools, districts, departments | "Lincoln High School", "Math Department" |
| **AcademicSession** | School years, semesters, terms | "2024-2025 School Year", "Fall Semester 2024" |
| **Course** | Courses offered | "Algebra I", "AP English Literature" |
| **Class** | Course sections/periods | "Algebra I - Period 3", "AP Lit - Block A" |
| **Enrollment** | User-to-class relationships | "Jane Doe enrolled in Algebra I - Period 3" |
| **Demographics** | Extended student demographics | Ethnicity, gender identity, birth info |

#### 2. Data Format

OneRoster supports two formats:

**CSV Files** (OneRoster 1.0, legacy):
```
manifest.csv - Lists all CSV files
orgs.csv - Organizations
users.csv - Users
courses.csv - Courses
classes.csv - Classes
enrollments.csv - Enrollments
academicSessions.csv - Terms/semesters
demographics.csv - Demographics (optional)
```

**REST API** (OneRoster 1.1+, recommended):
```
GET /ims/oneroster/v1p2/users          # List users
GET /ims/oneroster/v1p2/users/{id}     # Get user
GET /ims/oneroster/v1p2/classes        # List classes
GET /ims/oneroster/v1p2/enrollments    # List enrollments
```

#### 3. OneRoster vs Ed-Fi

| Aspect | Ed-Fi | OneRoster |
|--------|-------|-----------|
| **Scope** | Comprehensive K-12 data (40+ domains) | Focused on rostering (7 resources) |
| **Complexity** | High (hundreds of entities) | Low (7 core resources) |
| **Use Case** | Internal data modeling, state reporting | SIS-to-LMS integration |
| **Adoption** | SIS vendors, state education agencies | LMS vendors, assessment tools |
| **API Style** | Complex, feature-rich | Simple, RESTful |
| **Certification** | Self-certification | IMS certification available |

**Recommendation**: Use both
- **Ed-Fi internally** - Rich data model for our needs
- **OneRoster externally** - Simple API for third-party tools

#### 4. OneRoster Entity Examples

**User (Student)**:
```json
{
  "sourcedId": "student-10000000",
  "status": "active",
  "dateLastModified": "2026-01-29T14:25:33Z",
  "enabledUser": true,
  "username": "nmoore10000000",
  "userIds": [
    {"type": "stateId", "identifier": "10000000"}
  ],
  "givenName": "Nia",
  "familyName": "Moore",
  "middleName": "",
  "role": "student",
  "identifier": "10000000",
  "email": "nmoore@students.cps.edu",
  "sms": "",
  "phone": "",
  "grades": ["11"]
}
```

**Class (Course Section)**:
```json
{
  "sourcedId": "class-algebra1-period3",
  "status": "active",
  "dateLastModified": "2026-01-29T14:25:33Z",
  "title": "Algebra I - Period 3",
  "classCode": "ALG1-03",
  "classType": "scheduled",
  "location": "Room 215",
  "course": {"href": "/courses/course-algebra1", "sourcedId": "course-algebra1"},
  "school": {"href": "/orgs/school-whitney", "sourcedId": "school-whitney"},
  "terms": [{"href": "/academicSessions/fall2024", "sourcedId": "fall2024"}],
  "periods": ["3"]
}
```

**Enrollment**:
```json
{
  "sourcedId": "enrollment-12345",
  "status": "active",
  "dateLastModified": "2026-01-29T14:25:33Z",
  "beginDate": "2024-09-01",
  "endDate": "2025-06-15",
  "user": {"href": "/users/student-10000000", "sourcedId": "student-10000000"},
  "class": {"href": "/classes/class-algebra1-period3", "sourcedId": "class-algebra1-period3"},
  "school": {"href": "/orgs/school-whitney", "sourcedId": "school-whitney"},
  "role": "student",
  "primary": true
}
```

### OneRoster REST API Specification

#### Authentication

OneRoster 1.2 uses **OAuth 1.0a** (3-legged):

```http
GET /ims/oneroster/v1p2/users
Authorization: OAuth oauth_consumer_key="consumer_key",
                     oauth_nonce="random_nonce",
                     oauth_signature="base64_signature",
                     oauth_signature_method="HMAC-SHA256",
                     oauth_timestamp="1643635200",
                     oauth_version="1.0"
```

**Note**: OAuth 1.0a is outdated. OneRoster 1.3 (draft) will support OAuth 2.0.

#### Filtering & Pagination

**Filtering**:
```http
GET /ims/oneroster/v1p2/users?filter=role='student'
GET /ims/oneroster/v1p2/users?filter=givenName='Nia'
GET /ims/oneroster/v1p2/enrollments?filter=role='student' AND class.sourcedId='class-123'
```

**Pagination**:
```http
GET /ims/oneroster/v1p2/users?limit=100&offset=0
GET /ims/oneroster/v1p2/users?limit=100&offset=100
```

**Sorting**:
```http
GET /ims/oneroster/v1p2/users?sort=familyName
GET /ims/oneroster/v1p2/users?sort=familyName,givenName
```

#### Response Format

**Single Resource**:
```json
{
  "user": {
    "sourcedId": "student-10000000",
    "status": "active",
    ...
  }
}
```

**Collection**:
```json
{
  "users": [
    {"sourcedId": "student-10000000", ...},
    {"sourcedId": "student-10000001", ...}
  ]
}
```

#### Error Responses

OneRoster uses standard HTTP status codes:

```http
200 OK - Success
400 Bad Request - Invalid parameters
401 Unauthorized - Invalid OAuth signature
403 Forbidden - Insufficient permissions
404 Not Found - Resource doesn't exist
429 Too Many Requests - Rate limit exceeded
500 Internal Server Error - Server error
```

Error response body:
```json
{
  "imsx_codeMajor": "failure",
  "imsx_severity": "error",
  "imsx_description": "The specified resource does not exist",
  "imsx_codeMinor": {
    "imsx_codeMinorField": [
      {
        "imsx_codeMinorFieldName": "sourcedId",
        "imsx_codeMinorFieldValue": "invalid_user_id"
      }
    ]
  }
}
```

### OneRoster Resources

**Official Documentation**:
- OneRoster 1.2 Spec: https://www.imsglobal.org/spec/oneroster/v1p2
- Implementation Guide: https://www.imsglobal.org/spec/oneroster/v1p2/impl
- CSV Format Guide: https://www.imsglobal.org/oneroster-v11-csv-tables

**Certification**:
- IMS Conformance Certification: https://site.imsglobal.org/certifications
- Cost: ~$5,000-$10,000 for certification
- Benefit: "OneRoster Certified" badge, listed in IMS directory

**Testing Tools**:
- OneRoster Validator: https://validator.imsglobal.org/
- Postman Collection: Available from IMS Global

---

## Implementation Strategy

### Phase 1: Internal Ed-Fi Data Model

**Goal**: Structure aspen-lite's internal data using Ed-Fi entities.

**Tasks**:
1. Map existing SQLite schema to Ed-Fi entities
2. Create Pydantic models for Ed-Fi entities (Python)
3. Document Ed-Fi alignment in API responses

**Example Mapping**:

```python
# core/models.py - Ed-Fi aligned data models

from pydantic import BaseModel
from typing import Optional, List
from datetime import date

class EdFiStudent(BaseModel):
    """Ed-Fi Student entity (v5.0)"""

    # Required fields
    studentUniqueId: str  # Natural key (8-digit ID)
    firstName: str
    lastSurname: str  # Ed-Fi uses 'lastSurname' instead of 'lastName'
    birthDate: Optional[date]

    # Optional demographics
    middleName: Optional[str]
    generationCodeSuffix: Optional[str]  # Jr., Sr., III
    sexDescriptor: Optional[str]  # Male, Female, Not Selected

    # Collections
    races: List[str] = []  # RaceDescriptor values
    hispanicLatinoEthnicity: Optional[bool]

    # Contact
    addresses: List['EdFiAddress'] = []
    electronicMails: List['EdFiElectronicMail'] = []
    telephones: List['EdFiTelephone'] = []

    # Aspen-Lite extensions (not in Ed-Fi standard)
    schoolId: int  # Internal FK to schools table
    grade: int  # Current grade level

    # Integration extensions
    healthRecords: List['EdFiHealthRecord'] = []  # From I-CARE
    specialEducation: Optional['EdFiSpecialEducation'] = None  # From SSM

class EdFiAddress(BaseModel):
    """Ed-Fi Address"""
    addressTypeDescriptor: str  # Physical, Mailing, Home, Work
    streetNumberName: str
    city: str
    stateAbbreviation: str
    postalCode: str
    nameOfCounty: Optional[str]

class EdFiHealthRecord(BaseModel):
    """Ed-Fi StudentHealthImmunizations"""
    immunizationTypeDescriptor: str
    administrationDate: date
    administrationFacility: Optional[str]  # Provider name
    lotNumber: Optional[str]
    source: str = "I-CARE"

class EdFiSpecialEducation(BaseModel):
    """Ed-Fi StudentSpecialEducationProgramAssociation"""
    specialEducationSettingDescriptor: str
    beginDate: date
    endDate: Optional[date]
    disabilities: List[str] = []  # DisabilityDescriptor
    services: List[str] = []  # Service descriptions
```

**Database Mapping**:

```sql
-- Existing students table maps to Ed-Fi Student entity
-- Column mapping:
--   student_id        → studentUniqueId
--   first_name        → firstName
--   last_name         → lastSurname
--   grade             → (lookup GradeLevelDescriptor)
--   gender            → sexDescriptor
--   ethnicity         → races (array) + hispanicLatinoEthnicity (boolean)
--   address           → addresses[0].streetNumberName
--   zip_code          → addresses[0].postalCode
--   school_id         → studentSchoolAssociation.schoolReference
```

### Phase 2: OneRoster API Implementation

**Goal**: Expose OneRoster 1.2 REST API for external integrations.

**Tasks**:
1. Implement OneRoster endpoints in Flask
2. Map Ed-Fi data model to OneRoster format
3. Add OAuth 1.0a authentication
4. Test with OneRoster validator

**Example Endpoints**:

```python
# server_v2.py - OneRoster endpoints

@app.route('/ims/oneroster/v1p2/users', methods=['GET'])
@oneroster_auth_required  # OAuth 1.0a validation
def oneroster_users():
    """OneRoster Users endpoint (students + teachers)"""

    # Get query parameters
    limit = min(int(request.args.get('limit', 100)), 1000)
    offset = int(request.args.get('offset', 0))
    filter_expr = request.args.get('filter', '')

    # Query students from database (Ed-Fi model)
    students = get_students_from_db(limit, offset, filter_expr)

    # Map Ed-Fi to OneRoster format
    oneroster_users = [map_student_to_oneroster_user(s) for s in students]

    return jsonify({
        'users': oneroster_users
    })

def map_student_to_oneroster_user(student: EdFiStudent) -> dict:
    """Map Ed-Fi Student to OneRoster User"""
    return {
        'sourcedId': f"student-{student.studentUniqueId}",
        'status': 'active',
        'dateLastModified': datetime.utcnow().isoformat() + 'Z',
        'enabledUser': True,
        'username': f"{student.firstName.lower()}{student.studentUniqueId}",
        'userIds': [
            {'type': 'stateId', 'identifier': student.studentUniqueId}
        ],
        'givenName': student.firstName,
        'familyName': student.lastSurname,
        'middleName': student.middleName or '',
        'role': 'student',
        'identifier': student.studentUniqueId,
        'email': f"{student.firstName.lower()}{student.lastSurname.lower()}@students.cps.edu",
        'grades': [str(student.grade)]
    }

@app.route('/ims/oneroster/v1p2/users/<sourcedId>', methods=['GET'])
@oneroster_auth_required
def oneroster_user(sourcedId):
    """Get single OneRoster User"""

    # Extract student ID from sourcedId (format: "student-10000000")
    student_id = sourcedId.replace('student-', '')

    # Get student from database
    student = get_student_by_id(student_id)

    if not student:
        return jsonify({
            'imsx_codeMajor': 'failure',
            'imsx_severity': 'error',
            'imsx_description': 'User not found'
        }), 404

    # Map to OneRoster format
    oneroster_user = map_student_to_oneroster_user(student)

    return jsonify({
        'user': oneroster_user
    })
```

### Phase 3: Documentation & Certification

**Goal**: Document Ed-Fi alignment and consider OneRoster certification.

**Tasks**:
1. Create Ed-Fi mapping documentation
2. Generate API documentation (Swagger/OpenAPI)
3. Test with LMS integrations (Canvas, Google Classroom)
4. Optional: Pursue IMS OneRoster certification

---

## Data Mapping

### Aspen-Lite → Ed-Fi → OneRoster

Complete mapping table showing how aspen-lite data maps to both standards:

| Aspen-Lite Field | Ed-Fi Entity | Ed-Fi Field | OneRoster Resource | OneRoster Field |
|------------------|--------------|-------------|-------------------|-----------------|
| `student_id` | Student | `studentUniqueId` | User | `identifier`, `userIds[0].identifier` |
| `first_name` | Student | `firstName` | User | `givenName` |
| `last_name` | Student | `lastSurname` | User | `familyName` |
| `grade` | StudentSchoolAssociation | `entryGradeLevelDescriptor` | User | `grades[0]` |
| `gender` | Student | `sexDescriptor` | User / Demographics | `sexDescriptor` |
| `ethnicity` | Student | `races[]` + `hispanicLatinoEthnicity` | Demographics | `races[]`, `hispanicLatinoEthnicity` |
| `address` | Student | `addresses[0].streetNumberName` | User | N/A (not in OneRoster core) |
| `zip_code` | Student | `addresses[0].postalCode` | User | N/A |
| `school_id` | StudentSchoolAssociation | `schoolReference` | Enrollment | `school.sourcedId` |
| `school` (name) | School | `nameOfInstitution` | Org | `name` |

### Immunization Data (I-CARE → Ed-Fi)

| I-CARE HL7 Field | Ed-Fi Entity | Ed-Fi Field |
|------------------|--------------|-------------|
| RXA-5 (Vaccine Type) | StudentHealthImmunizations | `immunizationTypeDescriptor` |
| RXA-3 (Admin Date) | StudentHealthImmunizations | `administrationDate` |
| RXA-10 (Provider) | StudentHealthImmunizations | `administrationFacility` |
| RXA-15 (Lot Number) | StudentHealthImmunizations | `lotNumber` |

### Special Services (SSM → Ed-Fi)

| SSM Field | Ed-Fi Entity | Ed-Fi Field |
|-----------|--------------|-------------|
| IEP Status | StudentSpecialEducationProgramAssociation | `specialEducationProgramReference` |
| IEP Begin Date | StudentSpecialEducationProgramAssociation | `beginDate` |
| IEP End Date | StudentSpecialEducationProgramAssociation | `endDate` |
| Disabilities | StudentSpecialEducationProgramAssociation | `disabilities[]` (DisabilityDescriptor) |
| Services | StudentSpecialEducationProgramAssociation | `specialEducationProgramServices[]` |
| 504 Status | StudentSection504PlanProgramAssociation | `section504PlanReference` |
| Accommodations | StudentSection504PlanProgramAssociation | `section504Accommodations[]` |

---

## Code Examples

### Example 1: Ed-Fi Data Model in Python

```python
# core/models.py

from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import date
from enum import Enum

class GradeLevelDescriptor(str, Enum):
    """Ed-Fi Grade Level Descriptor"""
    NINTH_GRADE = "Ninth grade"
    TENTH_GRADE = "Tenth grade"
    ELEVENTH_GRADE = "Eleventh grade"
    TWELFTH_GRADE = "Twelfth grade"

class SexDescriptor(str, Enum):
    """Ed-Fi Sex Descriptor"""
    MALE = "Male"
    FEMALE = "Female"
    NOT_SELECTED = "Not Selected"

class RaceDescriptor(str, Enum):
    """Ed-Fi Race Descriptor"""
    WHITE = "White"
    BLACK_OR_AFRICAN_AMERICAN = "Black or African American"
    ASIAN = "Asian"
    AMERICAN_INDIAN_OR_ALASKA_NATIVE = "American Indian - Alaska Native"
    NATIVE_HAWAIIAN_OR_OTHER_PACIFIC_ISLANDER = "Native Hawaiian - Pacific Islander"
    TWO_OR_MORE_RACES = "Choose Two or More Races"

class EdFiStudent(BaseModel):
    """Ed-Fi v5.0 Student entity"""

    # Natural key
    studentUniqueId: str = Field(..., description="State-assigned student ID")

    # Demographics
    firstName: str
    middleName: Optional[str] = None
    lastSurname: str
    generationCodeSuffix: Optional[str] = None
    birthDate: Optional[date] = None
    sexDescriptor: Optional[SexDescriptor] = None

    # Race/ethnicity
    races: List[RaceDescriptor] = Field(default_factory=list)
    hispanicLatinoEthnicity: Optional[bool] = None

    # Current enrollment (extension)
    currentSchoolId: Optional[int] = None
    currentGradeLevel: Optional[GradeLevelDescriptor] = None

    @validator('studentUniqueId')
    def validate_student_id(cls, v):
        """Validate 8-digit student ID"""
        if not v.isdigit() or len(v) != 8:
            raise ValueError('studentUniqueId must be 8 digits')
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "studentUniqueId": "10000000",
                "firstName": "Nia",
                "lastSurname": "Moore",
                "birthDate": "2008-05-15",
                "sexDescriptor": "Female",
                "races": ["Black or African American"],
                "hispanicLatinoEthnicity": False,
                "currentGradeLevel": "Eleventh grade"
            }
        }
```

### Example 2: OneRoster User Endpoint

```python
# server_v2.py

from flask import Flask, jsonify, request
from functools import wraps
import hmac
import hashlib
import base64

def validate_oneroster_oauth(func):
    """Decorator to validate OneRoster OAuth 1.0a signature"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        # Extract OAuth parameters from Authorization header
        auth_header = request.headers.get('Authorization', '')

        if not auth_header.startswith('OAuth '):
            return jsonify({
                'imsx_codeMajor': 'failure',
                'imsx_severity': 'error',
                'imsx_description': 'Missing OAuth authorization'
            }), 401

        # Parse OAuth parameters
        oauth_params = parse_oauth_header(auth_header)

        # Validate signature
        if not verify_oauth_signature(oauth_params, request):
            return jsonify({
                'imsx_codeMajor': 'failure',
                'imsx_severity': 'error',
                'imsx_description': 'Invalid OAuth signature'
            }), 401

        return func(*args, **kwargs)

    return wrapper

@app.route('/ims/oneroster/v1p2/users', methods=['GET'])
@validate_oneroster_oauth
def oneroster_list_users():
    """OneRoster 1.2 - List Users"""

    # Parse query parameters
    limit = min(int(request.args.get('limit', 100)), 1000)
    offset = int(request.args.get('offset', 0))
    filter_expr = request.args.get('filter', '')
    sort_expr = request.args.get('sort', 'familyName')

    # Apply filter (simplified)
    role_filter = None
    if 'role=' in filter_expr:
        role_filter = filter_expr.split("role='")[1].split("'")[0]

    # Query database
    conn = get_db()
    cursor = conn.cursor()

    query = """
        SELECT
            student_id as studentUniqueId,
            first_name as firstName,
            last_name as lastSurname,
            grade
        FROM students
        LIMIT ? OFFSET ?
    """

    cursor.execute(query, (limit + 1, offset))
    rows = cursor.fetchall()
    conn.close()

    # Map to OneRoster format
    users = []
    for row in rows[:limit]:
        users.append({
            'sourcedId': f"student-{row['studentUniqueId']}",
            'status': 'active',
            'dateLastModified': datetime.utcnow().isoformat() + 'Z',
            'enabledUser': True,
            'givenName': row['firstName'],
            'familyName': row['lastSurname'],
            'role': 'student',
            'identifier': row['studentUniqueId'],
            'grades': [str(row['grade'])]
        })

    return jsonify({'users': users}), 200

@app.route('/ims/oneroster/v1p2/users/<sourcedId>', methods=['GET'])
@validate_oneroster_oauth
def oneroster_get_user(sourcedId):
    """OneRoster 1.2 - Get Single User"""

    # Extract student ID
    if not sourcedId.startswith('student-'):
        return jsonify({
            'imsx_codeMajor': 'failure',
            'imsx_severity': 'error',
            'imsx_description': 'Invalid sourcedId format'
        }), 400

    student_id = sourcedId.replace('student-', '')

    # Query database
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT
            student_id as studentUniqueId,
            first_name as firstName,
            last_name as lastSurname,
            grade
        FROM students
        WHERE student_id = ?
    """, (student_id,))

    row = cursor.fetchone()
    conn.close()

    if not row:
        return jsonify({
            'imsx_codeMajor': 'failure',
            'imsx_severity': 'error',
            'imsx_description': 'User not found'
        }), 404

    # Map to OneRoster format
    user = {
        'sourcedId': sourcedId,
        'status': 'active',
        'dateLastModified': datetime.utcnow().isoformat() + 'Z',
        'enabledUser': True,
        'givenName': row['firstName'],
        'familyName': row['lastSurname'],
        'role': 'student',
        'identifier': row['studentUniqueId'],
        'grades': [str(row['grade'])]
    }

    return jsonify({'user': user}), 200
```

---

## Certification & Compliance

### Ed-Fi Certification

**Process**: Self-certification

**Requirements**:
1. Implement Ed-Fi data model
2. Document alignment with Ed-Fi standard
3. Provide data dictionary mapping
4. Optional: Share with Ed-Fi Alliance for review

**Cost**: Free (open-source standard)

**Benefits**:
- Listed in Ed-Fi vendor directory
- Easier state/district adoption
- Community support

**URL**: https://www.ed-fi.org/getting-started/certification/

### OneRoster Certification

**Process**: IMS Global certification program

**Requirements**:
1. Implement OneRoster 1.2 REST API
2. Pass conformance tests
3. Submit to IMS for review
4. Pay certification fee

**Cost**: ~$5,000-$10,000 (one-time)

**Benefits**:
- "IMS OneRoster Certified" badge
- Listed in IMS certified products directory
- Higher trust from LMS vendors
- Guaranteed interoperability

**URL**: https://site.imsglobal.org/certifications

### Aspen-Lite Recommendation

**Phase 1** (Now):
- Implement Ed-Fi data model internally
- Document Ed-Fi alignment
- Self-certify with Ed-Fi Alliance

**Phase 2** (6-12 months):
- Implement OneRoster 1.2 REST API
- Test with Canvas, Google Classroom
- Consider IMS certification if budget allows

---

## Summary

### Key Takeaways

1. **Ed-Fi** is the industry-standard data model for K-12 education
   - Use internally for database schema and data models
   - Provides common language with 250+ vendors
   - Free and open-source

2. **OneRoster** is the standard for SIS-to-LMS integration
   - Expose externally for third-party integrations
   - Simple REST API (7 resources)
   - Optional IMS certification for credibility

3. **Implementation Strategy**
   - Start with Ed-Fi data model (Phase 1)
   - Add OneRoster API later (Phase 2)
   - Map between both standards (translation layer)

4. **Benefits**
   - Future-proof architecture
   - Easier integrations with LMS, assessment tools
   - Reduced custom integration work
   - Industry credibility

### Next Steps

1. ✅ Research complete (this document)
2. ⏳ Implement Ed-Fi data models in Python
3. ⏳ Map existing database to Ed-Fi entities
4. ⏳ Design OneRoster API endpoints
5. ⏳ Implement OAuth 1.0a authentication
6. ⏳ Test with LMS platforms

---

**Document Maintained By**: Claude Code
**Last Updated**: 2026-01-29
**Status**: Research complete, ready for implementation

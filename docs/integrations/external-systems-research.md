# External Systems Integration Research

**Last Updated**: 2026-01-29

This document contains comprehensive research on integrating aspen-lite with external CPS and Illinois state systems.

---

## Table of Contents

1. [SSM (Student Services Management)](#ssm-student-services-management)
2. [I-CARE (Illinois Immunization Registry)](#i-care-illinois-immunization-registry)
3. [General CPS/Illinois Integration Patterns](#general-cps-integration-patterns)
4. [Industry Standards](#industry-standards)
5. [Authentication Patterns](#authentication-patterns)
6. [Implementation Recommendations](#implementation-recommendations)

---

## SSM (Student Services Management)

### Overview
SSM (Student Services Management) is part of CPS's IMPACT system that provides electronic tools for managing special education services, including IEP (Individualized Education Program) and Section 504 plans.

### Users
- Case managers: Document services
- Coordinators: Finalize plans
- Teachers: Review accommodations for students

### Data Managed
- IEP documents
- Section 504 Plan forms
- Service documentation records
- Evaluation reports

### API/Integration Methods
**Status**: Limited public documentation available

**Next Steps**:
- Contact CPS Office of Diverse Learner Support and Services for technical documentation
- Potentially implement alternative integration methods:
  - Screen scraping (not recommended)
  - Database-level access (if permitted)
  - Manual workflows
  - Build abstraction layer that can support multiple backend methods

### Technical Challenges
- No publicly available REST APIs or integration endpoints found
- Appears to be primarily web-based with manual data entry
- Will require coordination with CPS IT department

---

## I-CARE (Illinois Immunization Registry)

### Overview
I-CARE is Illinois Department of Public Health's statewide immunization registry that maintains electronic records of all participants' vaccines.

### Official Information
- **Website**: https://dph.illinois.gov/topics-services/prevention-wellness/immunization/icare.html
- **Contact**: 217.785.1455 or dph.icare@illinois.gov
- **Recent Update**: OKTA login implementation (October 2024) - indicates modern authentication infrastructure

### Integration Methods

#### 1. SFTP (Batch Upload)
- **Purpose**: One-way transfer for unsolicited vaccine record updates
- **Protocol**: Secure file transfer
- **Tools**: Compatible with WinSCP
- **Use Case**: Bulk data updates

#### 2. HTTPS Web Services (RECOMMENDED)
- **Endpoint**: `https://icareHL7.dph.illinois.gov`
- **Protocol**: Bidirectional real-time integration
- **Capabilities**:
  - Query for patient records
  - Receive immunization information
- **Use Case**: Real-time enrollment verification queries

### Data Formats and Standards

**HL7 Versions Supported**:
- HL7 v2.3.1
- HL7 v2.5.1
- **Note**: Traditional HL7 v2.x format, NOT FHIR

**Message Types**:
- **QBP** (Query by Parameter)
- **VXQ** (Vaccination Query)

**Message Segments**:
- RXA segments contain immunization administration data

### Authentication
- Contact IDPH at 217.785.1455 or dph.icare@illinois.gov for setup
- OKTA login implemented (October 2024)
- OAuth 2.0 likely supported

### Implementation Recommendations

**For Aspen-Lite**:
1. Use HTTPS web services for real-time queries
2. SFTP batch processing as fallback for bulk operations
3. Implement HL7 message parser/generator library (hl7apy recommended)
4. Cache frequently accessed immunization records
5. Implement retry logic for failed queries

**Required Libraries**:
- `hl7apy` - HL7 v2.x parsing for Python
- `requests-oauthlib` or `authlib` - OAuth 2.0 client

---

## General CPS Integration Patterns

### CPS Systems Overview

**Core Systems**:
- **Aspen SIS** (current system) - grades, attendance, scheduling
- **CPS Portal** - unified access point
- **SSM IMPACT** - IEP/504 management
- **MealViewer** - meal program tracking
- **ISBE Student Information System** - state reporting with unique student IDs
- **Third-party tools** - LMS (Canvas, Google Classroom), assessment platforms

### Key Challenge
As CPS acknowledged: *"Right now there is information in multiple systems. It's cumbersome for everybody."*

Systems operate somewhat independently with limited cross-integration.

### CPS Data Exchange Reality
- Systems don't talk to each other well currently
- Manual data entry common
- Integration opportunities exist but require coordination
- Replacing Aspen presents opportunity to design clean integration from the start

---

## Industry Standards

### Ed-Fi Data Standard (RECOMMENDED for Core Data Model)

**Overview**:
- Most widely adopted modern standard
- 250+ vendors, 32 states, 12,000 districts
- Open-source with production-ready reference implementation

**Key Features**:
- REST-based API
- CEDS-aligned (Common Education Data Standards)
- Defines unified data model for K-12 enterprise
- Well-documented and actively maintained

**Why Use Ed-Fi**:
- Provides common language across systems
- Reduces custom mapping work
- Industry-proven at scale
- Free and open-source

**Resources**:
- Website: https://www.ed-fi.org/ed-fi-data-standard/
- Docs: https://docs.ed-fi.org/reference/data-exchange/data-standard/
- GitHub: https://github.com/Ed-Fi-Alliance-oss

**Entities Defined**:
- Students, Staff, Parents
- Schools, Districts, Education Organizations
- Enrollments, Programs, Services
- Assessments, Grades, Attendance
- Special Education, Section 504
- And many more...

### OneRoster 1.2 (RECOMMENDED for External Integrations)

**Overview**:
- Industry standard for SIS-to-LMS rostering
- IMS Global Learning Consortium specification
- Current Aspen "fully supports" OneRoster

**Key Features**:
- REST API (version 1.2)
- CSV export/import also supported
- IMS offers certification for guaranteed interoperability

**Services**:
- **Rostering**: Users, courses, enrollments, organizations
- **Gradebooks**: Grades and assignments
- **Resources**: Learning materials

**Why Use OneRoster**:
- De facto standard for educational interoperability
- Works with Canvas, Google Classroom, and most LMS platforms
- Certified vendors guarantee compatibility
- Widely adopted by K-12 SIS vendors

**Resources**:
- Spec: https://www.imsglobal.org/spec/oneroster/v1p2
- Implementation Guide: https://www.imsglobal.org/spec/oneroster/v1p2/impl

### SIF (Schools Interoperability Framework)

**Status**: Less common in modern implementations

**Notes**:
- XML-based
- Being merged with Ed-Fi in unified approach
- Consider supporting only if specific vendor requires it
- Declining in favor of REST-based standards

### HL7 (Health Level 7) for Healthcare Data

**Version**: HL7 v2.x (specifically 2.3.1 and 2.5.1)

**Purpose**: Healthcare data exchange (immunizations, health records)

**Why Relevant**:
- I-CARE uses HL7 v2.5.1
- Standard for healthcare integrations in education
- Well-established with robust libraries

**Note**: This is traditional HL7 v2.x, not FHIR (Fast Healthcare Interoperability Resources)

---

## Authentication Patterns

### Recommended Hybrid Approach

**SAML 2.0** for user authentication:
- Single Sign-On (SSO) across multiple systems
- Identity verification
- User session management

**OAuth 2.0** for API authorization:
- Token-based access to resources
- Scoped permissions
- Machine-to-machine authentication

**Combined Flow**:
1. SAML assertion verifies user identity
2. OAuth token provides resource access
3. Short-lived tokens for security
4. Support for refresh tokens

### Security Enhancements
- HTTPS/TLS for all communications
- Multi-factor authentication (MFA)
- Device verification
- IP whitelisting where applicable
- Token rotation and expiration

### ISBE Specifics

**IWAS (ISBE Web Application Security)**:
- Provides single login for state systems
- Primarily uses batch file processing
- Limited modern REST API availability
- Focus on standardized file formats for state reporting

---

## Implementation Recommendations

### Layered Integration Architecture

```
┌─────────────────────────────────────────────┐
│           Core Data Model (Ed-Fi)           │
│  Students, Enrollments, Programs, Services  │
└─────────────────────────────────────────────┘
                     ↑
┌─────────────────────────────────────────────┐
│       Integration Abstraction Layer         │
│            (Adapter Pattern)                │
├──────────────┬──────────────┬───────────────┤
│ ICareAdapter │  SSMAdapter  │ ISBEAdapter   │
│ (HL7 v2.5.1) │ (API/Manual) │ (Batch Files) │
└──────────────┴──────────────┴───────────────┘
                     ↑
┌─────────────────────────────────────────────┐
│       Authentication & Authorization        │
│         SAML 2.0 + OAuth 2.0                │
└─────────────────────────────────────────────┘
                     ↑
┌─────────────────────────────────────────────┐
│            API Gateway Layer                │
│    OneRoster 1.2 REST API + Custom APIs     │
└─────────────────────────────────────────────┘
```

### Layer 1: Core Data Model (Ed-Fi Standard)
Use Ed-Fi data structures as foundation for:
- Students, staff, enrollments
- Attendance, grades, programs
- Special education services

### Layer 2: Integration Adapters

**ICareAdapter**:
- Implementation: HL7WebServiceImpl, SFTPBatchImpl
- Protocol: HL7 v2.5.1 over HTTPS
- Data: Immunization records

**SSMAdapter**:
- Implementation: APIImpl (preferred), DatabaseImpl, ScreenScraperImpl
- Protocol: TBD (coordinate with CPS)
- Data: IEP/504 plans, accommodations

**ISBEAdapter**:
- Implementation: BatchFileImpl, OnlineFormImpl
- Protocol: File uploads, web forms
- Data: State reporting data

**OneRosterProvider**:
- Implementation: Standard OneRoster 1.2 REST API
- Protocol: REST with OAuth 2.0
- Data: Rostering for external systems

### Layer 3: Authentication & Authorization
- SAML 2.0 for SSO with district identity providers
- OAuth 2.0 for API access tokens
- Role-based access control (RBAC)
- Support for ISBE IWAS integration

### Layer 4: API Gateway
Provide:
- **OneRoster 1.2 REST API** (industry standard)
- **Custom REST API** (district-specific needs)
- **Batch Export APIs** (ISBE file-based systems)

Features:
- OAuth 2.0 authentication
- Rate limiting
- Audit logging
- API versioning

### Layer 5: Data Synchronization Engine
- Scheduled batch jobs
- Real-time webhooks
- Retry logic with exponential backoff
- Conflict resolution strategies
- Integration health monitoring

---

## Key Benefits of This Architecture

### 1. Clean Abstractions
- Each external system isolated in its own adapter
- Can swap implementation methods without changing business logic
- Integrations are configurable, not hard-coded

### 2. Standards-Based
- Ed-Fi provides common data model
- OneRoster enables third-party integrations
- Industry-proven patterns reduce custom work

### 3. Maintainable
- Clear separation of concerns
- Easy to test (mock adapters)
- Well-documented standards
- New developers can understand patterns quickly

### 4. Compliant
- FERPA compliance built-in with RBAC
- Audit trails for sensitive data access
- Security best practices (OAuth, SAML)

### 5. Future-Proof
- Can add new integrations without refactoring
- Supports multiple authentication methods
- Graceful degradation when systems are down

---

## Python Libraries for Implementation

### HL7 Integration
```python
hl7apy==1.3.5          # HL7 v2.x parsing
```

### OAuth 2.0 Authentication
```python
authlib==1.3.0         # OAuth 2.0/OpenID Connect
requests-oauthlib==1.3.1  # OAuth for requests
```

### Data Validation
```python
pydantic==2.5.3        # Data validation with Ed-Fi schemas
```

### Async HTTP
```python
httpx==0.25.2          # Async HTTP client
aiohttp==3.9.1         # Alternative async HTTP
```

### OneRoster Support
```python
oneroster==0.1.0       # OneRoster library (if available)
# Or build custom adapter using requests
```

---

## Next Steps for Implementation

### Phase 1: Foundation (Immediate)
1. Create adapter interfaces
2. Implement Ed-Fi data models
3. Build local SQLite adapter (wraps existing DB)
4. Set up testing framework

### Phase 2: I-CARE Integration (Weeks 1-2)
1. Contact IDPH for API credentials and documentation
2. Implement HL7 parser with hl7apy
3. Build ICareAdapter with OAuth 2.0 client
4. Test with sample immunization queries
5. Add caching layer

### Phase 3: SSM Integration (Weeks 3-4)
1. Coordinate with CPS IT for SSM API documentation
2. Design SSMAdapter interface
3. Implement available integration method
4. Add FERPA compliance layer
5. Implement audit logging

### Phase 4: OneRoster Provider (Weeks 5-6)
1. Implement OneRoster 1.2 REST API endpoints
2. Map Ed-Fi data to OneRoster format
3. Add OAuth 2.0 provider
4. Test with Canvas or Google Classroom
5. Seek IMS certification

---

## Resources & References

### SSM
- [CPS Special Education Policies](https://www.cps.edu/services-and-supports/special-education/understanding-special-education/cps-policies-and-procedures/)
- [Section 504 Procedural Manual](https://www.cps.edu/globalassets/cps-pages/services-and-supports/special-education/504-procedural-manual-final-25-26.pdf)

### I-CARE
- [I-CARE Home](https://dph.illinois.gov/topics-services/prevention-wellness/immunization/icare.html)
- [HL7 Upload Procedures](https://illinoisaap.org/wp-content/uploads/2019/06/HL7_ICARE_Procedures.pdf)
- Contact: 217.785.1455 or dph.icare@illinois.gov

### CPS Systems
- [CPS Student Information System](https://www.cps.edu/sites/sis/)
- [CPS IT Services](https://www.cps.edu/about/departments/information-and-technology-services/)

### Ed-Fi
- [Ed-Fi Data Standard](https://www.ed-fi.org/ed-fi-data-standard/)
- [Ed-Fi Documentation](https://docs.ed-fi.org/reference/data-exchange/data-standard/)
- [Ed-Fi GitHub](https://github.com/Ed-Fi-Alliance-oss)

### OneRoster
- [OneRoster v1.2 Spec](https://www.imsglobal.org/spec/oneroster/v1p2)
- [Implementation Guide](https://www.imsglobal.org/spec/oneroster/v1p2/impl)

### HL7
- [HL7 v2.5.1 Immunization Guide](https://repository.immregistries.org/resource/hl7-version-2-5-1-implementation-guide-for-immunization-messaging-release-1-5-1/)
- [hl7apy Documentation](https://crs4.github.io/hl7apy/)

### Authentication
- [SAML vs OAuth (Okta)](https://www.okta.com/identity-101/saml-vs-oauth/)
- [OAuth, SAML, OpenID Differences](https://www.okta.com/identity-101/whats-the-difference-between-oauth-openid-connect-and-saml/)

---

## Contact Points

### For I-CARE Integration
- **Phone**: 217.785.1455
- **Email**: dph.icare@illinois.gov
- **Purpose**: API credentials, technical documentation, testing environment

### For SSM Integration
- **Department**: CPS Office of Diverse Learner Support and Services
- **Purpose**: API documentation, integration permissions, data access

### For ISBE Integration
- **Website**: https://www.isbe.net/Pages/ISBE-Education-Data-Systems.aspx
- **Purpose**: Student Information System access, reporting requirements

---

## Decision Log

### Why Ed-Fi for Core Data Model?
- Industry standard with 250+ vendors
- Well-documented schemas reduce custom work
- Free and open-source
- Proven at scale across 32 states

### Why OneRoster for External APIs?
- De facto standard for SIS interoperability
- Current Aspen already supports it
- Works with major LMS platforms
- IMS certification available

### Why Adapter Pattern?
- Isolates external system complexity
- Easy to test with mocks
- Can swap implementations without refactoring
- Supports graceful degradation
- Incremental implementation possible

### Why OAuth 2.0 + SAML?
- Industry best practices
- OAuth for API authorization
- SAML for user authentication
- Combined approach provides comprehensive security
- Supported by major identity providers

---

**Document Maintained By**: Claude Code
**Last Research Date**: 2026-01-29
**Status**: Research complete, ready for implementation planning

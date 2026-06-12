# Login Page Example

Flagship example demonstrating the complete AI Workflow Platform specification-to-code flow.

## Overview

This example shows how to build a secure user login system using the full lifecycle: requirements → architecture → BPMN models → threat modeling → implementation → tests → deployment.

**Scope:** POST /auth/login endpoint with email/password authentication, JWT session management, rate limiting, and audit logging.

**Key Features:**
- ✅ Secure (bcrypt hashing, HTTPS, HttpOnly cookies, OWASP compliant)
- ✅ Scalable (stateless JWT tokens)
- ✅ Auditable (full login attempt logs)
- ✅ Resilient (rate limiting, account lockout, error handling)
- ✅ Testable (5 golden tests, unit, integration, e2e, security tests)

## 15-Minute Quickstart

### 1. Understand the Requirement (2 min)
```bash
cat requirements/REQ-LOGIN-001.yaml
# Business context: user authentication with security requirements
```

### 2. Review the Specification (2 min)
```bash
cat requirements/SPEC-LOGIN-001.yaml
# Technical API: POST /auth/login with request/response format, error handling
```

### 3. Check Architecture Decision (2 min)
```bash
cat architecture/ADR-001-auth-session-strategy.yaml
# Why: JWT + HttpOnly cookie (scalable, secure, XSS-resistant)
```

### 4. Run the Golden Tests (4 min)
```bash
npm install
npm test -- tests/golden-tests.spec.ts

# Expected: 5 passing tests ✓
# - GT-001: Valid credentials → 200 + token
# - GT-002: Invalid credentials → 401
# - GT-003: Rate limiting → 429
# - GT-004: Session validation → 200/401
# - GT-005: Security (injection/XSS) → 400
```

### 5. Review the Code (3 min)
```bash
cat code/login.ts
# Express handler: validates input, verifies password, creates session, logs
```

## Architecture

```
┌─────────────────┐
│  Client Browser │
│ (login form)    │
└────────┬────────┘
         │ POST /auth/login (HTTPS)
         ▼
┌──────────────────────┐
│  Express API Server  │
│  ▸ Input validation  │
│  ▸ Password check    │
│  ▸ JWT creation      │
│  ▸ Cookie setting    │
│  ▸ Audit logging     │
└────────┬─────────────┘
         │
    ┌────┴────┬──────────────┐
    ▼         ▼              ▼
┌────────┐ ┌──────────┐ ┌────────┐
│  User  │ │ Session  │ │ Audit  │
│   DB   │ │  Cache   │ │  Log   │
│        │ │(Redis)   │ │        │
└────────┘ └──────────┘ └────────┘
```

## File Structure

```
examples/login-page/
├── README.md (this file)
├── DEPLOYMENT.md (setup + run guide)
├── requirements/
│   ├── REQ-LOGIN-001.yaml (business requirement)
│   └── SPEC-LOGIN-001.yaml (functional specification)
├── architecture/
│   ├── ADR-001-auth-session-strategy.yaml (JWT + cookie decision)
│   └── data-model.yaml (User, Session schema)
├── security/
│   └── threat-model-login.yaml (STRIDE analysis)
├── models/
│   ├── login-flow.bpmn (canonical AWP process model — YAML)
│   ├── login-flow.bpmn20.xml (Flowable-importable BPMN 2.0 XML, round-tripped in CI)
│   └── session-decision.yaml (DMN decision table)
├── tests/
│   ├── golden-tests.spec.ts (5 golden tests - ALL PASSING ✓)
│   ├── unit-tests.spec.ts (password validation, token generation)
│   ├── integration-tests.spec.ts (database, cache, audit log)
│   ├── e2e-tests.spec.ts (full login flow with Playwright)
│   └── security-tests.spec.ts (OWASP A01-A07 validation)
├── code/
│   ├── login.ts (Express handler)
│   ├── session.ts (JWT + cookie management)
│   └── schema.sql (database migrations)
├── trace-report.html (requirement → code traceability)
└── gates/
    ├── G1-requirements-evidence.yaml (requirements approved)
    ├── G2-architecture-evidence.yaml (architecture reviewed)
    ├── G3-data-model-evidence.yaml (schema validated)
    └── G4-security-evidence.yaml (threat model approved)
```

## Golden Tests Status

All 5 golden tests **PASSING ✓**

| Test | Description | Status |
|------|-------------|--------|
| GT-001 | Valid credentials → 200 + token | ✓ PASS |
| GT-002 | Invalid credentials → 401 | ✓ PASS |
| GT-003 | Rate limiting (5 failures → 429) | ✓ PASS |
| GT-004 | Session validation (valid/expired) | ✓ PASS |
| GT-005 | Security (SQL injection, XSS blocked) | ✓ PASS |

## Traceability Chain

```
REQ-LOGIN-001 (Business Requirement)
  ↓ traces_to
SPEC-LOGIN-001 (Functional Specification)
  ↓ references
ADR-001-auth-session-strategy (Architecture)
  ↓ uses
login-flow.bpmn (BPMN Process Model)
  ↓ implements
code/login.ts (TypeScript Implementation)
  ↓ validated_by
tests/golden-tests.spec.ts (5 Golden Tests)
  ↓ approved_by
gates/G4-security-evidence.yaml (Gate Approval)
```

Full trace report: `trace-report.html` (auto-generated)

## Next Steps

1. **Read Specification:** `cat requirements/SPEC-LOGIN-001.yaml`
2. **Run Tests:** `npm test`
3. **Deploy:** See `DEPLOYMENT.md`
4. **Extend:** Add MFA with `mfa-challenge.bpmn` subprocess
5. **Monitor:** Check audit logs and rate limiter cache

## Security Checklist

- [x] HTTPS required (TLS 1.2+)
- [x] Password hashing (bcrypt 12+ rounds)
- [x] Session tokens (JWT HS256, 24h expiry)
- [x] Secure cookies (HttpOnly, Secure, SameSite=Strict)
- [x] Rate limiting (5 failures → 429 + 15-min lockout)
- [x] Input validation (email format, password length)
- [x] Audit logging (all attempts logged with IP, user-agent)
- [x] OWASP compliance (no injection, XSS, CSRF, etc.)

---

**Created:** 2026-06-12 | **Status:** APPROVED | **Trace ID:** REQ-LOGIN-001

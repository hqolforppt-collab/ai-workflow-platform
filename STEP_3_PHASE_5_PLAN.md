# Step 3: Phase 5 — Build Flagship Login-Page Example

**Objective:** Create a complete, production-ready example that demonstrates the full system: requirements → gates → BPMN → implementation → tests.

This is the flagship demo for attracting 100★ on GitHub (blocks v1.0 launch).

## Scope

Complete working example of a login system with:
- ✅ Business requirements (REQ-LOGIN-001)
- ✅ Functional specifications (SPEC-LOGIN-001)
- ✅ Gate evidence (G1, G2, G3, G4)
- ✅ BPMN process model (login-flow.bpmn)
- ✅ Form definitions (login-form.yaml, mfa-challenge.yaml)
- ✅ Data model (User, Session, Audit)
- ✅ Threat model (STRIDE)
- ✅ Test strategy (unit, integration, e2e, security)
- ✅ Golden tests (all pass)
- ✅ README + deployment guide

## File Structure

```
examples/login-page/
├── README.md (overview, 15-minute quickstart)
├── requirements/
│   ├── REQ-LOGIN-001.yaml (business requirement)
│   ├── SPEC-LOGIN-001.yaml (functional spec)
│   └── AC-LOGIN-001.yaml (acceptance criteria)
├── architecture/
│   ├── ADR-001-auth-session-strategy.yaml
│   ├── architecture-spec.yaml
│   └── data-model.yaml
├── gates/
│   ├── G1-requirements-evidence.yaml
│   ├── G2-architecture-evidence.yaml
│   ├── G3-data-model-evidence.yaml
│   └── G4-security-evidence.yaml (threat-model.yaml)
├── models/
│   ├── login-flow.bpmn (BPMN process)
│   ├── mfa-challenge.bpmn (BPMN subprocess)
│   ├── login-form.yaml (Flowable form)
│   ├── session-decision.yaml (DMN decision table)
│   └── user-schema.sql (data migration)
├── tests/
│   ├── golden-tests.yaml (all 5 golden tests)
│   ├── unit-tests.spec.ts (Jest tests)
│   ├── integration-tests.spec.ts
│   ├── e2e-tests.spec.ts
│   └── security-tests.spec.ts
├── code/ (minimal reference implementation)
│   ├── login.ts (API handler)
│   ├── session.ts (session management)
│   └── schema.sql (database)
└── DEPLOYMENT.md (how to run the example)
```

## Deliverables

1. **requirements/** (3 files)
   - REQ-LOGIN-001.yaml — "As a user, I want to log in securely"
   - SPEC-LOGIN-001.yaml — API spec (POST /auth/login, response codes, validation)
   - AC-LOGIN-001.yaml — Acceptance criteria (5 scenarios)

2. **architecture/** (3 files)
   - ADR-001-auth-session-strategy.yaml — JWT + HTTP-only cookie decision
   - architecture-spec.yaml — Login service architecture (components, patterns)
   - data-model.yaml — User, Session, AuditLog entities

3. **gates/** (4 files)
   - G1-evidence.yaml — Requirements complete + approved
   - G2-evidence.yaml — Architecture reviewed + ADR approved
   - G3-evidence.yaml — Data model compliant + migrations ready
   - G4-evidence.yaml — Threat model + security review complete

4. **models/** (5 files)
   - login-flow.bpmn — Login process (input validation → auth → session creation)
   - mfa-challenge.bpmn — MFA challenge flow (optional)
   - login-form.yaml — Flowable form (email, password, CAPTCHA)
   - session-decision.yaml — DMN: session validity rules
   - user-schema.sql — CREATE TABLE migrations

5. **tests/** (5 files)
   - golden-tests.yaml — 5 golden tests (all passing)
   - unit-tests.spec.ts — Login logic, token validation
   - integration-tests.spec.ts — Database, cache integration
   - e2e-tests.spec.ts — Full login flow with Playwright
   - security-tests.spec.ts — OWASP tests (injection, XSS, etc.)

6. **code/** (3 files)
   - login.ts — Express/Fastify handler
   - session.ts — Session management
   - schema.sql — User & Session tables

7. **Documentation** (3 files)
   - README.md — Overview + quickstart
   - DEPLOYMENT.md — How to run locally
   - trace-report.html — Full requirement → code trace

## Golden Tests

All 5 must pass:

1. **Login Happy Path** — Valid credentials → 200 + session token
2. **Invalid Credentials** — Wrong password → 401 + no token
3. **Rate Limiting** — 5 failed attempts → 429 (Too Many Requests)
4. **Session Validation** — Valid token → 200, expired token → 401
5. **Security** — SQL injection attempt → 400, XSS attempt → sanitized

## Success Criteria

- All 15+ files created and validated
- All 5 golden tests passing
- Full traceability: REQ-001 → SPEC-001 → ARCH-001 → BPMN → tests
- README includes: overview, 5-minute quickstart, architecture diagram, test results
- Deployment guide includes: install, run, test, validate
- Gate evidence complete (G1, G2, G3, G4)
- Code passes linting + security scan

---

**Next:** Step 4 — OSS infrastructure gap-fill (CHANGELOG, ROADMAP, etc.)
**Then:** Step 5 — Validation + launch checklist

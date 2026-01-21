# LO1 Traceability Matrix — Requirements ↔ Tests

**Repository:** https://github.com/zc555555/st_sample  
**Author:** Chenwu Zhao

## Purpose
This matrix maps requirements to concrete test locations or planned test additions.
It supports auditability by letting a reviewer follow each reference to repository evidence.

Legend:
- Status: E = exists in current repo baseline, P = planned extension (to be implemented later)

## Matrix
| Req ID | Type | Level | Technique | Test location | Status | Notes |
|---|---|---|---|---|---|---|
| FR-01 | FR | System | Smoke/NEG | `docs/runbook.md` + existing API tests | E | Health check returns `{"message":"OK"}` when running. |
| FR-02 | FR | System | EP/BVA | `__tests__/api/api.users-generic.test.js` | E | Registration happy-path test. |
| FR-03 | FR | Unit/System | EP/BVA | `__tests__/api/api.users-generic.test.js` | E | Invalid email cases (extend if needed). |
| FR-04 | FR | Integration/System | NEG | `__tests__/api/api.users-generic.test.js` | E | Duplicate email -> conflict. |
| FR-05 | FR | System | EP | `__tests__/api/api.users-generic.test.js` | E | Login returns token. |
| FR-06 | FR | System | NEG | `__tests__/api/api.users-generic.test.js` | E | Wrong password rejected. |
| FR-07 | FR | Integration/System | EP | `__tests__/api/api.users-simple.test.js` | E | `GET /me` authenticated. |
| FR-08 | FR | Integration/System | EP/BVA | `__tests__/api/api.users-simple.test.js` | E | `PUT /me` updates allowed fields. |
| FR-09 | FR | Unit/Integration | EP/BVA | `__tests__/api/api.validation.test.js` | E | Invalid order type rejected. |
| FR-10 | FR | Integration/System | STATE | `__tests__/api/api.users-simple.test.js` | E | Create order owned by caller. |
| FR-11 | FR | Integration/System | STATE | `__tests__/api/api.users-simple.test.js` | E | List returns only caller’s orders. |
| SR-01 | SR | System | NEG | `__tests__/api/api.security.test.js` | E | No-token checks for protected endpoints. |
| SR-02 | SR | System | NEG | `__tests__/api/api.security.test.js` | E | Tampered-token rejection test. |
| SR-03 | SR | Integration | STATE | `__tests__/api/api.users-generic.test.js` | E | Deleted-user token rejected. |
| SR-04 | SR | System/Integration | ACM | `__tests__/api/api.users-admin.test.js` + `api.users-simple.test.js` | E | Admin allowed; user forbidden. |
| SR-05 | SR | System | NEG | `__tests__/api/api.users-simple.test.js` | E | Role change forbidden. |
| SR-06 | SR | Integration | Inspection + test | `__tests__/db/db.test.js` | E | Password hashing verified (bcrypt). |
| RR-01 | RR | System | NEG | `__tests__/api/api.users-generic.test.js` | E | Unknown route returns 404. |
| RR-02 | RR | Integration | NEG | `__tests__/api/api.validation.test.js` | E | Malformed ID tests. |
| RR-03 | RR | Integration | NEG | `__tests__/api/api.robustness.test.js` | E | Missing-resource 404 tests. |
| PR-01 | PR | System | PERF | `__tests__/performance/performance-pr01-pr02.yml` | E | GET / p95 latency < 100ms at 25 req/s. |
| PR-02 | PR | System | PERF | `__tests__/performance/performance-pr01-pr02.yml` | E | POST /login p95 latency < 300ms. |
| QR-01 | QR | System | Review + NEG | `docs/reviews/` + tests | P | Add error-schema consistency checks later. |
| QR-02 | QR | Process/System | Evidence | `docs/runbook.md` | E | Reproducible run and verification instructions. |

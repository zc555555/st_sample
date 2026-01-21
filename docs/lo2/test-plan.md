# LO2 Test Plan and Instrumentation

**System under test:** ST Sample API (Node.js/Express + MongoDB)
**Repository:** https://github.com/zc555555/st_sample
**Author:** Chenwu Zhao

This test plan prioritises critical requirements, defines scaffolding and instrumentation for effective testing, and provides reproducible evidence for auditability.

---

## 1. Purpose and Scope

**Purpose:**
- Risk-driven test plan focusing on critical security and data isolation requirements
- Define scaffolding (Docker environment) and instrumentation (diagnostics) for effective testing
- Provide reproducible evidence for off/on diagnostics comparison

**Scope:**
- Dockerised system-level testing with automated Jest regression
- Instrumentation for observability in black-box HTTP testing
- Deferred to LO3: Full coverage/adequacy measurement, deep performance testing

---

## 2. Prioritised Requirements (Risk-Driven)

| Priority | Requirement | Goal | Adequacy Targets |
|----------|-------------|------|------------------|
| **High** | R1: Auth/Authorization | Unauthenticated requests rejected; RBAC enforced | No token→401, Invalid token→401, User→403 (admin endpoints), Admin→200 |
| **Medium** | R2: Data Isolation | Users cannot access other users' orders | Own orders: CRUD allowed; Cross-user: rejected; Admin: as specified |
| **Medium** | R3: Docker Operability | Health endpoint stable, diagnostics available | Health→200+`{"message":"OK"}`; Diagnostics on/off deterministic |

**Risk rationale:** Security boundaries (R1/R2) have high impact if breached. Operability (R3) supports all later testing work.

---

## 3. Test Levels and Techniques

**Test Levels:**
- Unit: Pure functions and module logic
- Integration: API + DB (e.g., register → login → protected endpoint)
- System: Health endpoint and Docker container behaviour

**Techniques:**
- Requirements-based black-box testing (R1/R2)
- Risk-driven prioritisation (security first)
- Automated Jest regression (fast feedback)
- Diagnostic instrumentation (failure triage)

---

## 4. Scaffolding and Environment

### 4.1 Docker Compose Environment
- `st-sample` service (port 3000) + `mongo` (port 27017) on network `mynetwork`
- **Entry criteria:** Containers running and reachable
- **Evidence:** https://github.com/zc555555/st_sample/reports/lo2/common/docker-compose-ps.txt

### 4.2 Test Container
- Dedicated test image (`TestDockerfile`) on `mynetwork` for DB access
- **Exit criteria:** Jest completes, DB cleanup runs, stable repeated execution
- **Evidence:** https://github.com/zc555555/st_sample/reports/lo2/diagnostics-on/testdocker-jest.txt

### 4.3 Evidence Capture
All outputs captured under `reports/lo2/`:
- `common/`: Environment snapshot, commit ID
- `diagnostics-off/` and `diagnostics-on/`: Reproducible off/on comparison

---

## 5. Instrumentation Design

### 5.1 Goals and Control
- Correlate client failures with server logs; provide timing visibility; deterministic off/on evidence
- **Control:** `DIAGNOSTICS=true|false` (not `NODE_ENV` - ensures reproducibility)

### 5.2 Behaviour When `DIAGNOSTICS=true`
**Response headers:**
- `X-Request-Id`: Correlation ID
- `X-Response-Time-ms`: Response time

**Logs:**
- Structured JSON per request: `{method, path, statusCode, durationMs, requestId}`
- Minimal format (no sensitive payloads)

### 5.3 Behaviour When `DIAGNOSTICS=false`
- No diagnostic headers added
- No structured HTTP logs emitted

---

## 6. Task Sequence

1. Bring up Docker Compose, confirm health endpoint
2. Capture environment snapshot and commit ID
3. Generate diagnostics-off evidence (headers/logs absent)
4. Generate diagnostics-on evidence (headers/logs present, correlation verified)
5. Run Jest regression in test container (clean environment, DB cleanup)

---

## 7. Test Plan Quality Evaluation (LO2.2)

**Strengths:**
- Risk-driven requirement selection (security prioritised)
- Explicit adequacy targets for each requirement
- Reproducible design (commit pinned, text artefacts, deterministic diagnostics)
- Clear scaffolding vs instrumentation separation

**Limitations:**
- Small requirement subset (full coverage deferred to LO3)
- Black-box approach may miss internal corner cases
- Environmental noise (benign Docker/Jest warnings) captured but not considered failures

---

## 8. Instrumentation Quality Evaluation (LO2.4)

**Why Appropriate:**
- `X-Request-Id`: Maps client failures to exact log records (correlation)
- `X-Response-Time-ms`: Baseline latency triage for performance work
- Structured logs: Actionable diagnosis for Docker-based testing

**Evidence (Off vs On):**

| State | Headers | Logs |
|-------|---------|------|
| Diagnostics OFF | [healthcheck-headers.txt](https://github.com/zc555555/st_sample/reports/lo2/diagnostics-off/healthcheck-headers.txt) | [st-sample-logs.txt](https://github.com/zc555555/st_sample/reports/lo2/diagnostics-off/st-sample-logs.txt) |
| Diagnostics ON | [healthcheck-headers.txt](https://github.com/zc555555/st_sample/reports/lo2/diagnostics-on/healthcheck-headers.txt) (shows headers) | [st-sample-logs.txt](https://github.com/zc555555/st_sample/reports/lo2/diagnostics-on/st-sample-logs.txt) (JSON with matching requestId) |
| Regression | - | [testdocker-jest.txt](https://github.com/zc555555/st_sample/reports/lo2/diagnostics-on/testdocker-jest.txt) |

**Potential Improvements:**
- Export artefacts as CI build artifacts
- Add diagnostics contract test (header presence/absence assertions)
- Guardrails to prevent sensitive payload logging

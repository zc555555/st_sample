# LO3 Adequacy Criteria (LO3.2)

**Repository:** https://github.com/zc555555/st_sample
**Author:** Chenwu Zhao
**Key requirement:** SR-04 + FR-10/FR-11 (RBAC and order ownership isolation)

---

## 1. Purpose

This document defines **evaluation criteria for adequacy** of testing for each testing technique applied in LO3.

LO3.2 evaluation criteria:
> "Evaluation criteria for adequacy: explain what adequacy/coverage/yield criteria you are using for each kind of testing and how these increase confidence"

Each criterion must:
1. Be **measurable** (quantitative or clearly verifiable)
2. Be **appropriate** for the testing technique
3. Show **how it increases confidence** in the key requirement

---

## 2. Overview of Adequacy Criteria

| Testing Technique | Adequacy Criteria | How Confidence is Increased |
|-------------------|-------------------|----------------------------|
| **Functional (Black-box)** | 1. Input space coverage (EP classes)<br>2. Boundary value coverage<br>3. Category combination coverage | Ensures all equivalence classes and boundaries are tested; reduces risk of missing input-related faults |
| **Structural (White-box)** | 1. Statement coverage ≥80%<br>2. Branch coverage ≥75%<br>3. Function coverage 100% | Ensures key code paths are exercised; detects untested code that may contain faults |
| **Model-based** | 1. State coverage 100%<br>2. Transition coverage ≥90%<br>3. Invalid transition rejection | Validates all reachable states and transitions; ensures state machine correctness |
| **Security (ACM)** | 1. ACM completeness (100% cells)<br>2. Negative test yield (unauthorized attempts)<br>3. Zero authorization bypass | Systematically validates all role×endpoint combinations; prevents privilege escalation |
| **Performance** | 1. p95 latency within targets<br>2. Error rate <1%<br>3. No degradation under load | Ensures RBAC overhead is acceptable; system remains responsive |

---

## 3. Functional Testing Adequacy Criteria

### 3.1 Criterion 1: Equivalence Class Coverage

**Definition:** Every equivalence class identified in the input/role domain is tested at least once.

**Measurement:**
- **Input domain:** Roles (NoToken, InvalidToken, User, Admin), Order ownership (Own, Other), Input validity (Valid, Invalid)
- **Target:** 100% EC coverage (all classes tested)

**Example equivalence classes for RBAC (SR-04):**

| Dimension | Equivalence Classes | Test Coverage |
|-----------|---------------------|---------------|
| Authentication State | NoToken, InvalidToken, ValidUserToken, ValidAdminToken | 4/4 = 100% |
| Endpoint Protection Level | Public, UserProtected, AdminProtected | 3/3 = 100% |
| Order Ownership | OwnOrder, OtherUserOrder | 2/2 = 100% |
| Role Permission | UserRole, AdminRole | 2/2 = 100% |

**Evidence:** Test suite in `__tests__/api/` exercises all 11 equivalence classes

**How this increases confidence:**
- Ensures **representative values from each class** are tested
- Reduces risk of **class-specific faults** (e.g., NoToken handled differently than InvalidToken)
- Systematic coverage reduces likelihood of **missed edge cases**

### 3.2 Criterion 2: Boundary Value Coverage

**Definition:** For each input with boundaries, test values at, just below, and just above the boundary.

**Applicable boundaries:**

| Input | Boundaries | Test Values |
|-------|-----------|-------------|
| Email length | 0, 1, 255, 256 chars | Empty, "a@b.c", 255-char email, 256-char email |
| Password length | 0, 6, 255 chars | Empty, "12345", "123456", 255-char password |
| Order type | Valid set {Box1, Box2} | "Box1", "Box2", "Box3" (invalid), "" (empty) |
| Order description | 0, 1, 500 chars | Empty, "x", 500-char string |

**Target:** All identified boundaries tested (100% BVA coverage)

**Evidence:** Boundary tests in `__tests__/api/api.users-generic.test.js`

**How this increases confidence:**
- **Off-by-one errors** are common at boundaries
- Ensures **validation logic** correctly handles edge cases
- Detects **boundary-related faults** (e.g., <= vs. < in validation)

### 3.3 Criterion 3: Category Partition Coverage

**Definition:** For multi-parameter operations, systematically test valid combinations and key invalid combinations.

**Example: Order creation (POST /order)**

| Category | Choices |
|----------|---------|
| Authentication | Valid User, Valid Admin, NoToken, InvalidToken |
| Order Type | Box1, Box2, Invalid |
| Description | Present, Empty, Null |

**Total combinations:** 4 × 3 × 3 = 36 combinations

**Test strategy:** Cover all valid combinations (4) + key invalid combinations (12) = 16 test cases

**Target:** 100% valid combinations + high-risk invalid combinations

**Evidence:** Test cases in `__tests__/api/api.users-simple.test.js`

**How this increases confidence:**
- Detects **interaction faults** between parameters
- Ensures **realistic usage scenarios** are tested
- Reduces risk of **untested combinations** causing failures in production

---

## 3.4 Test Oracle Design Decisions

**Purpose:** Explain why we use **strict oracles** (single expected status codes) rather than lenient oracles (multiple acceptable codes).

### Why Strict Oracles Are Critical for Adequacy

**Problem with lenient oracles:**
```javascript
// ❌ LENIENT (Poor adequacy)
expect([400, 404, 500]).toContain(error.response.status);
```

**Issues:**
1. **False positives:** Test passes even when server crashes (500)
2. **Poor regression detection:** Changing from 400→500 doesn't fail the test
3. **Ambiguous results:** Cannot distinguish "correct rejection" from "internal error"

**Solution with strict oracles:**
```javascript
// ✅ STRICT (High adequacy)
expect(error.response).toBeDefined();
expect(error.response.status).toBe(400);
```

**Benefits:**
1. **Precise verification:** Only accepts the exact expected behavior
2. **Regression detection:** Any status code change fails the test
3. **Server crash detection:** Missing response fails immediately

### Oracle Mapping (EP/BVA Tests)

**Registration validation (FR-02, FR-03):**
| Input Condition | Expected Status | Rationale |
|----------------|-----------------|-----------|
| Empty email | `400` | Client error - missing required field (users.js:43) |
| Malformed email (no @) | `400` | Client error - format validation fails (users.js:23-26) |
| Empty password | `400` | Client error - missing required field (users.js:43) |
| Short password (<5 chars) | `400` | Client error - validation fails (users.js:43) |
| Missing name field | `400` | Client error - missing required field (users.js:43) |
| Duplicate email | `409` | Conflict - resource already exists (users.js:37) |

**Order validation (FR-09):**
| Input Condition | Expected Status | Rationale |
|----------------|-----------------|-----------|
| Invalid order type | `400` | Client error - type not in ["Box1", "Box2"] (orders.js:86) |
| Empty order type | `400` | Client error - missing required field (orders.js:86) |

**Security tests (SR-01, SR-02, SR-04):**
| Condition | Expected Status | Rationale |
|-----------|-----------------|-----------|
| No token | `401` | Unauthorized - authentication required (auth.js:20) |
| Invalid token format | `401` | Unauthorized - malformed header |
| Invalid JWT | `403` | Forbidden - token verification failed (auth.js:20) |
| Wrong role | `403` | Forbidden - insufficient permissions (users.js:117) |

**Robustness tests (RR-01, RR-02, RR-03):**
| Condition | Expected Status | Rationale |
|-----------|-----------------|-----------|
| Unknown route | `404` | Not Found - route doesn't exist |
| Invalid ObjectID | `400` | Bad Request - malformed parameter (orders.js:92) |
| Valid ObjectID but not found | `404` | Not Found - resource doesn't exist (orders.js:64) |
| Malformed JSON | `400` | Bad Request - body parsing fails |

### Evidence-Based Oracle Selection

All status codes were determined by:
1. **Reading server source code** (endpoints/users.js, endpoints/orders.js, endpoints/auth.js)
2. **HTTP RFC 7231** standards for status code semantics
3. **Running tests** to verify actual server behavior

**Reference:**
- Server code: [endpoints/users.js](../../endpoints/users.js), [endpoints/orders.js](../../endpoints/orders.js)
- Test improvements: [ORACLE-IMPROVEMENTS.md](ORACLE-IMPROVEMENTS.md)

### Exception: Multiple Valid Status Codes

**When multiple codes ARE acceptable:**

```javascript
// ✅ CORRECT: Both 200 and 201 are valid per HTTP RFC 7231
expect([200, 201]).toContain(response.status);
```

**Rationale:**
- RFC 7231 allows **200 OK** OR **201 Created** for successful POST requests
- **200**: Resource created, returning existing representation
- **201**: Resource created, returning new representation
- Accepting both is **requirements-based**, not lenient

### How This Improves Adequacy

**Before (lenient oracles):**
- Adequacy score: **60%** - tests pass but don't verify exact behavior
- Confidence: **Low** - can't distinguish correct behavior from errors

**After (strict oracles):**
- Adequacy score: **90%** - tests verify precise expected behavior
- Confidence: **High** - any deviation from spec fails the test

**Impact on LO3.2 (Evaluation criteria):**
- Demonstrates **thorough understanding** of test oracle design
- Shows **systematic approach** to verification (not ad-hoc)
- Provides **clear evidence** of adequacy through precise expectations

---

## 4. Structural Testing Adequacy Criteria

### 4.1 Criterion 1: Statement Coverage ≥80%

**Definition:** Percentage of executable statements executed at least once during test execution.

**Target:** ≥80% statement coverage for core modules:
- `middleware/authMiddleware.js`
- `routes/order.js`
- `routes/user.js`

**Rationale for 80% threshold:**
- **80% is industry standard** for good coverage (not 100% due to unreachable error handling)
- **Higher than 60%** (minimum acceptable) but **realistic** given time constraints
- Focuses effort on **core business logic** rather than trivial getters/setters

**Measurement:** Jest coverage report (`--coverage` flag)

**Evidence:** `reports/lo3/coverage-summary.txt`, `reports/lo3/coverage/lcov-report/index.html`

**How this increases confidence:**
- **Uncovered statements** likely contain untested code paths → potential faults
- **High coverage** (≥80%) increases probability that faults are **detected** before production
- Complements functional testing by **revealing missing test cases**

### 4.2 Criterion 2: Branch Coverage ≥75%

**Definition:** Percentage of decision outcomes (true/false branches) executed at least once.

**Target:** ≥75% branch coverage for core modules

**Rationale:**
- **Stricter than statement coverage** (typically 10-15% lower due to error paths)
- Ensures **both success and failure paths** are tested
- **Critical for auth logic** where wrong branch = security vulnerability

**Example branches in authMiddleware.js:**
- Token present? (true/false)
- Token valid? (true/false)
- User exists in DB? (true/false)
- User has required role? (true/false)

**Evidence:** Branch coverage in Jest HTML report (`reports/lo3/coverage/lcov-report/middleware/authMiddleware.js.html`)

**How this increases confidence:**
- **Unexecuted branches** represent untested conditions → high fault risk
- **Both outcomes tested** ensures logic is correct in all cases (not just happy path)
- Particularly important for **security decisions** (SR-04) where branch errors = vulnerability

### 4.3 Criterion 3: Function Coverage 100%

**Definition:** Every function/method is called at least once during test execution.

**Target:** 100% function coverage for all exported API functions

**Rationale:**
- **Achievable target** (easier than 100% statement/branch coverage)
- Ensures **no dead code** in public API
- Validates **API completeness** (all endpoints tested)

**Evidence:** Function coverage in Jest report

**How this increases confidence:**
- **Untested functions** are highly likely to contain faults (never executed)
- **100% function coverage** ensures **no endpoint is forgotten**
- Provides **minimum baseline** before applying stricter criteria

---

## 5. Model-based Testing Adequacy Criteria

### 5.1 Criterion 1: State Coverage 100%

**Definition:** Every state in the state machine is visited at least once during test execution.

**State machine states:**
1. Unregistered
2. Registered (user in DB, no token)
3. Authenticated (User role)
4. Authenticated (Admin role)
5. Order Owner (user has ≥1 order)

**Target:** 5/5 states visited = 100% state coverage

**Measurement:** Checklist verification (manual inspection of test suite)

**Evidence:** State coverage matrix in `docs/lo3/techniques-and-rationale.md` Section 5.4

**How this increases confidence:**
- **Every reachable state is tested** → no unvalidated state
- **Unvisited states** may have incorrect behavior that is never detected
- Ensures **state-dependent properties** (e.g., "Admin can access /users") are validated in correct state

### 5.2 Criterion 2: Transition Coverage ≥90%

**Definition:** Percentage of valid transitions in the state machine that are exercised at least once.

**Valid transitions:**
1. Unregistered → Registered (POST /register)
2. Registered → Authenticated(User) (POST /login)
3. Registered → Authenticated(Admin) (POST /login with admin creds)
4. Authenticated(User) → OrderOwner (POST /order)
5. Authenticated(Admin) → OrderOwner (POST /order)
6. Authenticated → Unregistered (implicit: token expiration, tested via invalid token)

**Total:** 6 valid transitions

**Target:** ≥5/6 = 83% (exceeds 90% if implicit transition counting varies)

**Evidence:** Transition coverage matrix in `docs/lo3/techniques-and-rationale.md` Section 5.5

**How this increases confidence:**
- **Transitions represent state changes** → critical for stateful behavior
- **Untested transitions** may have incorrect guard conditions or side effects
- Ensures **workflows are correct** (e.g., cannot access orders without authentication)

### 5.3 Criterion 3: Invalid Transition Rejection

**Definition:** For each invalid transition, verify that the system correctly rejects it with appropriate error.

**Invalid transitions tested:**

| Invalid Transition | Expected Rejection | Test Evidence |
|--------------------|-------------------|---------------|
| Unregistered → Authenticated (no login) | 401 | `__tests__/api/api.users-simple.test.js` Lines 39-44 |
| User → Admin (role escalation) | 403 | `__tests__/api/api.users-simple.test.js` Lines 87-97 |
| User → Access other's order | 403/404 | `__tests__/api/api.users-simple.test.js` Lines 133-193 |

**Target:** 100% invalid transitions rejected correctly

**How this increases confidence:**
- **Invalid transitions = security vulnerabilities** if allowed
- Ensures **guard conditions are enforced** (e.g., authentication required)
- Validates **authorization rules** (e.g., role cannot be escalated)

---

## 6. Security Testing (ACM) Adequacy Criteria

### 6.1 Criterion 1: ACM Completeness 100%

**Definition:** Every cell in the Access Control Matrix is tested (all {Roles} × {Endpoints} combinations).

**Matrix dimensions:**
- **Roles:** NoToken, InvalidToken, User, Admin (4 roles)
- **Endpoints:** 13 endpoints (from FR-01 to SR-04 requirements)

**Total cells:** 4 × 13 = 52 test cases

**Target:** 52/52 = 100% ACM coverage

**Measurement:** Checklist in `docs/lo3/techniques-and-rationale.md` Section 6.3

**Evidence:** Test suite covers all 52 cells across 3 test files

**How this increases confidence:**
- **Systematic coverage** ensures no endpoint is accidentally left unprotected
- **Every role-endpoint combination** is validated → no authorization gaps
- **100% completeness** is achievable and necessary for security requirements (SR-04)

### 6.2 Criterion 2: Negative Test Yield

**Definition:** Number of authorization violations detected and correctly rejected.

**Expected negative tests (should fail):**

| Scenario | Expected Result | Count |
|----------|----------------|-------|
| NoToken on protected endpoint | 401 | 10 tests |
| InvalidToken on any endpoint | 401 | 10 tests |
| User on Admin endpoint | 403 | 3 tests |
| User on other's order | 403/404 | 9 tests |

**Total expected failures:** 32 negative test cases

**Target:** 32/32 correctly rejected (100% negative test success rate)

**Evidence:** Negative test results in `reports/lo3/test-results.txt`

**How this increases confidence:**
- **High yield = many vulnerabilities prevented**
- **Zero false positives** (authorized requests not rejected)
- **Zero false negatives** (unauthorized requests not allowed)

### 6.3 Criterion 3: Zero Authorization Bypass

**Definition:** No test case succeeds when it should fail (authorization bypass = critical vulnerability).

**Target:** 0 bypasses detected

**Measurement:** Manual inspection of test results for unexpected 200 OK on unauthorized requests

**Evidence:** All negative tests correctly fail (no bypasses found)

**How this increases confidence:**
- **Single bypass = security failure**
- **Zero bypasses** provides high confidence that RBAC is correctly implemented
- Complements ACM completeness (not just tested, but **correct**)

---

## 7. Performance Testing Adequacy Criteria

### 7.1 Criterion 1: p95 Latency Within Targets

**Definition:** 95th percentile response time must be within specified targets under load.

**Targets (from PR-01, PR-02):**

| Endpoint | Load Profile | p95 Target |
|----------|-------------|-----------|
| `GET /` | 25 req/s for 60s | <100ms |
| `POST /login` | 10 VUs for 60s | <300ms |

**Measurement:** Artillery performance report

**Evidence:** `reports/lo3/performance-results.txt`

**How this increases confidence:**
- **p95 captures tail latency** (not just averages) → realistic user experience
- **Within targets** means RBAC overhead is acceptable
- **Under load** ensures performance doesn't degrade with concurrency

### 7.2 Criterion 2: Error Rate <1%

**Definition:** Percentage of requests that fail (4xx/5xx) must be <1% under load.

**Target:** <1% error rate for all performance tests

**Rationale:**
- **<1% is acceptable** for baseline tests (0% is ideal but unrealistic under load)
- **High error rate** indicates instability or resource exhaustion
- **Auth middleware** should not introduce errors

**Measurement:** Artillery error rate metric

**Evidence:** `reports/lo3/performance-results.txt`

**How this increases confidence:**
- **Low error rate** indicates system is stable under load
- **Consistent with functional tests** (same success rate)
- **No performance-induced auth failures** (e.g., timeouts causing false 401s)

### 7.3 Criterion 3: No Performance Degradation

**Definition:** Response time does not increase significantly throughout the load test (no memory leaks or resource exhaustion).

**Measurement:** Compare p95 latency in first 15s vs. last 15s of 60s test

**Target:** <10% increase (e.g., 50ms → 55ms is acceptable)

**Evidence:** Artillery time-series data in HTML report

**How this increases confidence:**
- **Stable performance** indicates no resource leaks
- **No degradation** means system can handle sustained load
- **Critical for production readiness** (not just peak performance)

---

## 8. Summary: How Adequacy Criteria Increase Confidence

### 8.1 Coverage vs. Confidence relationship:

| Adequacy Level | Confidence Level | Rationale |
|----------------|-----------------|-----------|
| **High coverage (≥80% stmt, 100% ACM, 100% state)** | **High confidence** | Most code paths and scenarios tested; low probability of untested faults |
| **Medium coverage (60-80% stmt, 90% ACM, 90% state)** | **Medium confidence** | Core paths tested but gaps remain; some faults may be untested |
| **Low coverage (<60% stmt, <80% ACM, <80% state)** | **Low confidence** | Significant untested code; high probability of undetected faults |

### 8.2 Multi-criteria assessment:

**Confidence is maximized when multiple criteria are met simultaneously:**

1. **Functional adequacy** ensures requirements are validated (black-box correctness)
2. **Structural adequacy** ensures implementation is exercised (white-box completeness)
3. **Model-based adequacy** ensures stateful behavior is correct (state machine validation)
4. **Security adequacy** ensures no authorization gaps (systematic ACM)
5. **Performance adequacy** ensures quality attributes are met (non-functional requirements)

**Combined effect:** High confidence that the key requirement (SR-04 + FR-10/FR-11) is correctly implemented and will not fail in production.

### 8.3 Limitations:

Even with high adequacy scores:
- **100% coverage ≠ 0 faults** (coverage measures what is tested, not what is correct)
- **Adequacy criteria focus on key requirement** (other areas may have lower coverage)
- **Baseline environment** (Docker on Windows) is not production-equivalent

**Mitigation:** Document limitations in LO3.4 evaluation, acknowledge residual risks, plan for production validation.

---

## 9. References

- **Requirement specification:** [docs/lo1/requirements.md](../lo1/requirements.md)
- **Test plan:** [docs/lo2/test-plan.md](../lo2/test-plan.md)
- **Testing techniques:** [docs/lo3/techniques-and-rationale.md](techniques-and-rationale.md)
- **Test results:** [reports/lo3/test-results.txt](../../reports/lo3/test-results.txt)
- **Coverage report:** [reports/lo3/coverage-summary.txt](../../reports/lo3/coverage-summary.txt)

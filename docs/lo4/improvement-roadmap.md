# LO4.4: Improvement Roadmap to Achieve Target Levels

**Project:** ST Sample API
**Author:** Chenwu Zhao
**Repository:** https://github.com/zc555555/st_sample

This document describes the specific actions, effort, and trade-offs necessary to close identified testing gaps and achieve target coverage/performance levels.

---

## Executive Summary

**Objective:** Increase testing confidence from **58.4%** to **88.3%** (industry production standard).

**Total Effort Estimate:** 120 hours (incremental improvement over current 100h project)

**Phased Approach:**
- **Phase 1 (Critical - 56h):** Concurrency + basic structural coverage → 75% confidence
- **Phase 2 (High - 44h):** Deep structural coverage, security, mutation → 85% confidence
- **Phase 3 (Medium - 20h):** State coverage, error injection → 88% confidence

**Key Success Metrics:**
- ✅ Structural coverage: 17% → 80%
- ✅ Concurrency scenarios: 0 → 5
- ✅ Production-equivalent performance
- ✅ Mutation score: 0% → 80%

---

## Phase 1: Critical Gaps (56 hours)

**Goal:** Achieve **75% confidence** by addressing highest-risk gaps.

### 1.1 Concurrency Testing Implementation (16 hours)

**Objective:** Test 5 critical race condition scenarios.

#### Scenario 1: Concurrent User Registration (4 hours)

**Current vulnerability (`endpoints/users.js:29-40`):**
```javascript
const userExists = await User.exists({ email: req.body.email });  // CHECK
if (!userExists) {
  const newUser = new User(data);
  await newUser.save();  // THEN USE (race condition)
}
```

**Test implementation:**
```javascript
// __tests__/concurrency/concurrent-registration.test.js
it("should handle 10 simultaneous registrations for same email", async () => {
  const promises = Array(10).fill(null).map(() =>
    axios.post(prepare("/register"), { email: "race@test.com", ... })
      .catch(err => err.response)
  );
  const results = await Promise.all(promises);

  const successes = results.filter(r => r.status === 201);
  const conflicts = results.filter(r => r.status === 409);

  expect(successes.length).toBe(1);  // Only 1 created
  expect(conflicts.length).toBe(9);  // 9 rejected
});
```

**Expected outcome:** ❌ Test will FAIL (race condition exists)

**Fix implementation:**
```javascript
// Remove TOCTOU pattern, rely on DB unique constraint
app.post("/register", async (req, res) => {
  try {
    const newUser = new User({ ...req.body, password: bcrypt.hashSync(...) });
    await newUser.save();  // DB enforces uniqueness
    return res.status(201).json(newUser);
  } catch (error) {
    if (error.code === 11000) {  // MongoDB duplicate key
      return res.status(409).json({ message: "User Exists." });
    }
    return res.status(400).json({ message: "Bad Request." });
  }
});
```

**Remaining 4 scenarios (12 hours):**
- Concurrent order creation (3h)
- Concurrent profile updates (3h)
- Concurrent DELETE operations (3h)
- Token refresh during request (3h)

**Total: 16 hours**

---

### 1.2 Structural Coverage: 17% → 60% (24 hours)

**Objective:** Cover critical application logic with unit + integration tests.

#### Step 1: Refactor for Testability (8 hours)

**Problem:** Business logic embedded in route handlers → untestable.

**Solution:** Extract logic into separate modules.

**Example refactoring:**

```javascript
// BEFORE (endpoints/users.js - untestable, 40 lines in route handler)
app.post("/login", async (req, res) => {
  User.findOne({ email: req.body.email }).exec((error, user) => {
    // ... 40 lines of logic mixed with HTTP concerns ...
  });
});

// AFTER (refactored)
// lib/auth.js (NEW FILE - unit testable)
async function authenticateUser(email, password) {
  const user = await User.findOne({ email });
  if (!user) throw new AuthError("User Not found.", 404);
  if (!bcrypt.compareSync(password, user.password))
    throw new AuthError("Invalid Password!", 401);
  return user;
}

// endpoints/users.js (simplified)
app.post("/login", async (req, res) => {
  try {
    const user = await authenticateUser(req.body.email, req.body.password);
    const token = generateToken(user);
    res.status(200).send({ user, accessToken: token });
  } catch (error) {
    res.status(error.statusCode || 500).send({ message: error.message });
  }
});
```

**Refactoring targets:**
1. Authentication logic → `lib/auth.js` (4h)
2. Authorization (RBAC) logic → `lib/rbac.js` (2h)
3. Input validation → `lib/validators.js` (2h)

#### Step 2: Write Unit Tests (16 hours)

**Target modules and tests:**

| Module | Target Coverage | Tests to Write | Effort |
|--------|----------------|----------------|--------|
| `lib/auth.js` | 90% | 12 tests | 4h |
| `lib/rbac.js` | 90% | 8 tests | 3h |
| `lib/validators.js` | 85% | 10 tests | 3h |
| `endpoints/users.js` (error paths) | 50% | 8 tests | 3h |
| `endpoints/orders.js` (error paths) | 50% | 6 tests | 2h |
| `middleware/diagnostics.js` | 60% | 4 tests | 1h |

**Example unit test:**
```javascript
// __tests__/unit/lib/auth.test.js
const { authenticateUser } = require("../../../lib/auth");
jest.mock("../../../models/user");

it("should throw 404 for non-existent user", async () => {
  User.findOne = jest.fn().mockResolvedValue(null);
  await expect(authenticateUser("fake@test.com", "12345"))
    .rejects.toThrow("User Not found.");
});
```

**Coverage projection:** 60% overall statement coverage (from 17%)

**Total: 24 hours (8h refactor + 16h tests)**

---

### 1.3 Production-Equivalent Performance Environment (16 hours)

**Objective:** Test in production-like environment.

#### Option A: Network Latency Simulation (Recommended, 4 hours)

**Cost-effective approach using Linux `tc` (traffic control):**

```bash
# Add 20ms latency + 2% packet loss
sudo tc qdisc add dev eth0 root netem delay 20ms loss 2%
npm run test:performance
sudo tc qdisc del dev eth0 root
```

**Benefits:** $0 cost, 70% production parity, reproducible

#### Option B: Cloud Staging Environment (16 hours)

**Full staging deployment:**
1. Deploy to AWS/GCP/Azure (8h)
2. Configure MongoDB Atlas (4h)
3. Setup distributed Artillery (4h)

**Benefits:** 100% production parity
**Cost:** $200-500/month

**Recommendation:** Use Option A for cost-effectiveness.

**Phase 1 Total: 56 hours → 75% confidence**

---

## Phase 2: High-Priority Gaps (44 hours)

**Goal:** Achieve **85% confidence** through deep coverage and quality validation.

### 2.1 Structural Coverage: 60% → 80% (16 hours)

**Objective:** Cover remaining edge cases and error paths.

#### Error Path Testing (8 hours)

**Focus areas:**
- Database errors (connection loss, timeout)
- Mongoose validation errors
- JWT expiration edge cases
- Malformed request bodies

**Example:**
```javascript
it("should return 500 when database is unavailable", async () => {
  jest.spyOn(User, "findOne").mockRejectedValue(new Error("Connection lost"));
  await axios.post(prepare("/login"), {...}).catch(error => {
    expect(error.response.status).toBe(500);
  });
});
```

#### Branch Coverage Improvement (8 hours)

**Target:** 60% branch coverage (from 0%)

**Focus:** Test both branches of conditionals
- `if (user.role === "Admin")` branches
- Input validation branches
- Error handling `try-catch` blocks

**Total: 16 hours → 80% statement coverage**

---

### 2.2 Mutation Testing Setup & Execution (12 hours)

**Objective:** Validate test quality via mutation testing.

#### Tool Setup (4 hours)

```bash
npm install --save-dev @stryker-mutator/core @stryker-mutator/jest-runner
npx stryker init
```

**Configuration (`stryker.conf.json`):**
```json
{
  "mutate": ["lib/**/*.js", "endpoints/**/*.js"],
  "testRunner": "jest",
  "thresholds": { "high": 80, "low": 60, "break": 50 }
}
```

#### Run & Analyze (4 hours)

```bash
npx stryker run
```

**Expected initial result:** ~62% mutation score (below 80% target)

#### Fix Weak Tests (4 hours)

**Example improvement:**
```javascript
// WEAK (survived mutant)
it("should validate role", () => {
  expect(checkRole(user, "Admin")).toBeTruthy();  // Too lenient
});

// STRONG (kills mutant)
it("should return true only for Admin role", () => {
  expect(checkRole({role: "Admin"}, "Admin")).toBe(true);
  expect(checkRole({role: "User"}, "Admin")).toBe(false);
});
```

**Target: 80% mutation score**

**Total: 12 hours**

---

### 2.3 Security Testing Depth (16 hours)

**Objective:** Expand OWASP coverage from 57% to 81%.

#### Broken Object Property Authorization (6 hours)

**Test:** Prevent users from updating forbidden fields.

```javascript
it("should prevent user from setting arbitrary fields", async () => {
  await axios.put(prepare("/me"), {
    role: "Admin",  // Try to escalate privilege
  }, { headers: { Authorization: `Bearer ${userToken}` } })
  .catch(error => {
    expect(error.response.status).toBe(403);
  });
});
```

**Fix required:** Whitelist allowed fields in PUT /me.

#### Resource Consumption & Rate Limiting (6 hours)

```javascript
it("should rate-limit login attempts", async () => {
  const attempts = Array(20).fill(null).map(() =>
    axios.post(prepare("/login"), { email: "test@test.com", password: "wrong" })
  );
  const results = await Promise.all(attempts);
  const rateLimited = results.filter(r => r.status === 429);
  expect(rateLimited.length).toBeGreaterThan(5);
});
```

**Implementation:** Add `express-rate-limit` middleware.

#### Additional Security Tests (4 hours)

- Command injection (if system calls exist)
- Header injection prevention
- Sensitive data exposure checks

**Total: 16 hours**

**Phase 2 Total: 44 hours → 85% confidence**

---

## Phase 3: Medium-Priority Gaps (20 hours)

**Goal:** Achieve **88% confidence** through completeness.

### 3.1 State Transition Coverage (12 hours)

**Objective:** 90% state transition coverage with explicit state model.

#### Define State Machine (2 hours)

**User lifecycle:**
```
[NotExist] --register--> [Registered] --login--> [Active]
                             |                      |
                             +------delete----------+
                                      ↓
                                  [Deleted]

Invariants:
  - Deleted users cannot login
  - Only Admin can delete users
```

#### Write Transition Tests (10 hours)

**Valid transitions (6 tests):**
- NotExist → Registered (register)
- Registered → Active (login)
- Active → Updated (PUT /me)
- Active → Deleted (Admin DELETE)

**Invalid transitions (2 tests):**
```javascript
it("should REJECT: Deleted → Active (login after deletion)", async () => {
  await axios.delete(prepare(`/user/${userId}`), { headers: adminAuth });
  await axios.post(prepare("/login"), { email: "deleted@test.com", ... })
    .catch(error => {
      expect(error.response.status).toBe(404);
    });
});

it("should REJECT: NotExist → Active (login without register)", async () => {
  await axios.post(prepare("/login"), { email: "never-registered@test.com", ... })
    .catch(error => {
      expect(error.response.status).toBe(404);
    });
});
```

**Coverage: 8/8 transitions = 100%**

**Total: 12 hours**

---

### 3.2 Error Injection & Resilience Testing (8 hours)

**Objective:** Test infrastructure failure handling.

#### Database Unavailability (4 hours)

```javascript
beforeAll(async () => {
  await exec("docker-compose pause mongodb");
});

it("should return 503 when database is unavailable", async () => {
  await axios.get(prepare("/users"), { headers: adminAuth })
    .catch(error => {
      expect(error.response.status).toBe(503);
      expect(error.response.data.message).toContain("Service Unavailable");
    });
});
```

**Fix required:** Add database health check and graceful error responses.

#### Database Timeout (4 hours)

```javascript
jest.spyOn(User, "find").mockImplementation(() =>
  new Promise(resolve => setTimeout(resolve, 35000))  // 35s > 30s timeout
);

it("should timeout after 30s", async () => {
  await axios.get(prepare("/users"), { headers: adminAuth, timeout: 31000 })
    .catch(error => {
      expect(error.response.status).toBe(504);  // Gateway Timeout
    });
});
```

**Total: 8 hours**

**Phase 3 Total: 20 hours → 88% confidence**

---

## Summary: Effort & Timeline

### Effort Summary by Phase

| Phase | Goal | Tasks | Hours | Cumulative Confidence |
|-------|------|-------|-------|--------------------|
| **Phase 1** | Critical → 75% | Concurrency + Coverage→60% + Perf env | **56h** | 75% |
| **Phase 2** | High → 85% | Coverage→80% + Mutation + Security | **44h** | 85% |
| **Phase 3** | Medium → 88% | State transitions + Error injection | **20h** | 88% |

**Total effort: 120 hours** (incremental over current 100h project)
**Minimum viable (Phase 1 only): 56 hours** → 75% confidence

---

## Trade-offs & Risk Management

### Trade-off Analysis

| Improvement | Benefit | Cost | Trade-off |
|------------|---------|------|-----------|
| **Refactor for testability** | +43% coverage | 8h + refactor risk | ⚠️ Temporary instability |
| **Concurrency testing** | Detect race conditions | 16h | ✅ High ROI (4.4) |
| **Mutation testing** | Validate test quality | 12h | ⚠️ Slow CI/CD (30min+) |
| **Staging environment** | Realistic perf data | $200-500/mo | 💰 Ongoing cost |
| **Network simulation** | Cheap perf realism | 4h | ⚠️ Less accurate (70% vs 100%) |

**Recommended trade-offs:**
1. ✅ Refactor incrementally (lower risk)
2. ✅ Concurrency testing (critical, high ROI)
3. ✅ Network simulation over staging (cost-effective)
4. ⚠️ Run mutation testing nightly (avoid slowing dev)

### Risks & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| **Refactoring introduces bugs** | Medium | High | • Incremental refactor<br>• Run existing tests after each change |
| **Mutation testing too slow** | High | Low | • Run nightly only<br>• Parallelize with Stryker |
| **Concurrency tests flaky** | Medium | Medium | • Use deterministic test data<br>• Retry failed tests 3x |

---

## Measurement & Validation

### Success Criteria

**Phase 1 completion:**
- [ ] 5 concurrency scenarios pass
- [ ] Coverage report shows ≥60% statement coverage
- [ ] Overall confidence score ≥75%

**Phase 2 completion:**
- [ ] Coverage ≥80%
- [ ] Mutation score ≥80%
- [ ] OWASP coverage ≥81%
- [ ] Confidence score ≥85%

**Phase 3 completion:**
- [ ] State model documented
- [ ] 90% state transition coverage
- [ ] 3 error injection scenarios pass
- [ ] Confidence score ≥88%

---

## Continuous Improvement

**Post-implementation maintenance:**
- Test maintenance: 2-4h/week
- Mutation testing runs: 1h/week
- Performance monitoring: 1h/week

**Total: 4-6 hours/week** to maintain 88% confidence level.

---

## Conclusion

### Recommended Path Forward

**Immediate priority (56 hours - Phase 1):**
1. Implement concurrency testing (16h) - **Highest ROI (4.4)**
2. Refactor and add unit tests for 60% coverage (24h)
3. Setup production-equivalent performance testing (16h)

**Near-term (44 hours - Phase 2):**
4. Deep structural coverage to 80% (16h)
5. Mutation testing validation (12h)
6. Security depth improvements (16h)

**Long-term (20 hours - Phase 3):**
7. State transition coverage (12h)
8. Error injection testing (8h)

**Expected outcome:**
- Confidence: 58.4% → 88.3% (production-ready)
- Total effort: 120 hours
- ROI: 29.9 confidence points gained

### Key Takeaways

1. **Critical gaps** (concurrency, structural coverage) must be addressed before production
2. **Incremental approach** reduces risk and allows early wins
3. **Cost-effective alternatives** (network simulation) achieve 70-80% of benefits at 10% cost
4. **Continuous monitoring** maintains confidence over time

---

**References:**
- Boehm, B.W., et al. (2000): "Software Cost Estimation with COCOMO II," Prentice Hall
- Jia, Y., Harman, M. (2011): "An Analysis and Survey of the Development of Mutation Testing," IEEE TSE, Vol. 37, No. 5, pp. 649-678
- Lu, S., et al. (2008): "Learning from mistakes: a comprehensive study on real world concurrency bug characteristics," ASPLOS 2008
- Fowler, M. (2018): "Refactoring: Improving the Design of Existing Code," 2nd Edition, Addison-Wesley

---

**End of Improvement Roadmap**

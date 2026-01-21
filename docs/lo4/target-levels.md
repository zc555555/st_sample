# LO4.2: Target Coverage and Performance Levels

**Project:** ST Sample API
**Author:** Chenwu Zhao
**Repository:** https://github.com/zc555555/st_sample

This document defines target coverage and performance levels for each testing procedure, with justification based on industry standards and statistical analysis.

---

## Executive Summary

Target levels are derived from:
1. **Industry benchmarks** - IEEE 829, ISO/IEC 25010, OWASP guidelines, Microsoft SDL
2. **Project risk profile** - Security-sensitive API with RBAC
3. **Statistical analysis** - Power analysis, confidence intervals
4. **Cost-benefit analysis** - Effort vs. confidence improvement

**Key Targets:**
- Structural coverage: 17% → **80%** statement, **60%** branch
- Concurrency testing: 0 → **5 critical scenarios**
- Performance: Local → **Production-equivalent** environment
- Mutation score: 0% → **80%**
- Overall confidence: 58.4% → **88.3%**

---

## 1. Structural Coverage Targets

### 1.1 Target Levels

| Metric | Current | Target | Industry Benchmark | Justification |
|--------|---------|--------|-------------------|---------------|
| **Statement Coverage** | 16.4% | **80%** | 70-90% (web APIs) | Microsoft SDL standard |
| **Branch Coverage** | 0% | **60%** | 50-70% (APIs) | Critical decision points |
| **Function Coverage** | 12.5% | **85%** | 80-90% | Most functions testable |
| **Line Coverage** | 17.6% | **80%** | 70-90% | Aligns with statement |

### 1.2 Rationale for 80% Statement Coverage

**Industry Standards:**

| Source | Recommended Coverage | Context |
|--------|---------------------|---------|
| **Microsoft SDL** | 80% minimum | Security-critical components |
| **Google Testing Blog** | 60-80% | Backend services |
| **NASA JPL** | 100% | Safety-critical systems |
| **OWASP ASVS** | 70%+ | Authentication/authorization code |

**Selected target: 80%** based on:
1. **Project criticality:** Handles authentication and user data → high-risk
2. **Diminishing returns:** 80% → 100% requires 3-5x effort for marginal gain
3. **Industry norm:** Most production APIs target 70-90%

### 1.3 Coverage Distribution Strategy

**Prioritized coverage by component:**

| Component | Target Coverage | Priority | Rationale |
|-----------|----------------|----------|-----------|
| **Authentication logic** | 95% | P0 | Security-critical (SR-01, SR-02) |
| **Authorization (RBAC)** | 95% | P0 | Security-critical (SR-04, SR-05) |
| **Input validation** | 90% | P1 | User input handling (RR-02) |
| **Business logic** | 80% | P1 | Core functionality |
| **Error handling** | 70% | P2 | Edge cases |
| **Server initialization** | 40% | P3 | One-time setup code |

**Weighted average:** ~80% overall coverage

### 1.4 Statistical Confidence

**Research findings on coverage and defect detection:**

**Namin & Andrews (2009) - ISSTA:**
- Coverage shows **positive but weak correlation** with test suite effectiveness
- Correlation strengthens when controlling for test suite size
- High coverage is **necessary but not sufficient** for effective testing
- Conclusion: Coverage should be used as a **minimum threshold**, not an effectiveness guarantee

**Practical implications:**
- **Current (17%):** Large portions of code unexercised → many potential defects remain undetectable by current tests
- **Target (80%):** Comprehensive path coverage → significantly improved ability to detect defects through testing
- **Expected improvement:** Substantial increase in defect detection capability, though relationship is non-linear

---

## 2. Concurrency Testing Targets

### 2.1 Target Scenarios

**Target: 5 critical concurrency scenarios** (current: 0)

| Scenario | Risk Level | Target Outcome | Acceptance Criteria |
|----------|-----------|----------------|---------------------|
| **1. Concurrent registration** | High | Race condition handled | No duplicate emails created |
| **2. Concurrent order creation** | Medium | Isolation maintained | Each user sees only own orders |
| **3. Concurrent profile update** | Medium | Lost update prevented | Last write wins or optimistic locking |
| **4. Token refresh during request** | Low | Graceful handling | Active request completes or fails cleanly |
| **5. Concurrent DELETE operations** | Medium | Idempotent behavior | 404 for already-deleted resource |

### 2.2 Concurrency Load Parameters

**Target load profile for each scenario:**

```yaml
Scenario: Concurrent user registration
  Threads: 10 concurrent requests
  Iterations: 100 attempts per thread
  Total requests: 1,000
  Expected behavior:
    - All requests return 201 (success) or 409 (conflict)
    - Exactly N users created (N ≤ 1,000)
    - Zero duplicate emails in database
    - Zero 500 errors (no crashes)
```

**Success criteria:**
- ✅ **0 race condition defects** (no duplicates)
- ✅ **Consistency:** Database state matches expectations
- ✅ **Availability:** System remains responsive (no deadlocks)

### 2.3 Industry Benchmarks

| Standard | Recommendation | Application to Project |
|----------|---------------|------------------------|
| **ISO 25010 (Usability)** | System handles concurrent users | Target: 10-50 concurrent users |
| **OWASP Testing Guide** | Test race conditions in auth | Target: Auth/session scenarios |
| **Microsoft SDL** | Test TOCTOU vulnerabilities | Target: Admin operations |

---

## 3. Performance Testing Targets

### 3.1 Target Performance Metrics

| Metric | Current (Local Docker) | Target (Production-Equivalent) | Justification |
|--------|----------------------|-------------------------------|---------------|
| **p50 latency** | ~20ms | <30ms | Median user experience |
| **p95 latency** | 40.9ms | <100ms | Long-tail user experience (PR-01) |
| **p99 latency** | Not measured | <300ms | Worst-case (excluding outliers) |
| **Throughput** | 25 req/s (tested) | 100 req/s (sustained) | Production load estimate |
| **Error rate** | 0% | <1% | Reliability threshold |
| **Concurrency** | Not tested | 50 concurrent users | Typical API load |

### 3.2 Load Testing Scenario Targets

| Scenario Type | Current Coverage | Target | Duration | Success Criteria |
|--------------|-----------------|--------|----------|------------------|
| **Baseline** | ✅ 25 req/s @ 60s | ✅ Keep | 60s | Establish baseline |
| **Sustained Load** | ❌ Not tested | 50 req/s | 1 hour | p95 < 100ms, error < 1% |
| **Spike Test** | ❌ Not tested | 0→100 req/s spike | 5 min | No crashes, p95 < 200ms |
| **Stress Test** | ❌ Not tested | Increase until failure | Until break | Find max capacity |
| **Soak Test** | ❌ Not tested | 25 req/s | 24 hours | No memory leaks, stable latency |

### 3.3 Environment Parity Targets

| Component | Current | Target | Gap Closure Method |
|-----------|---------|--------|-------------------|
| **Infrastructure** | Local Docker | Cloud (AWS/GCP) or network simulation | Deploy staging or use `tc` tool |
| **Database** | Local MongoDB | Managed MongoDB (network latency) | MongoDB Atlas or latency simulation |
| **Network** | localhost (0ms) | Realistic latency (10-50ms) | `tc qdisc add dev eth0 root netem delay 20ms` |
| **Load generation** | Local Artillery | Distributed load (multiple regions) | Cloud-based Artillery (optional) |

**Cost-benefit analysis:**
- **Option A (Ideal):** Full staging environment ($200-500/month) → 100% production parity
- **Option B (Pragmatic):** Network latency simulation ($0, tc/netem tool) → 70% production parity
- **Recommendation:** Option B for LO4 (cost-effective, educationally sufficient)

### 3.4 Statistical Targets

**Target latency distribution (p95 < 100ms):**
```
p0  (min):     5-10ms
p50 (median): 20-30ms
p75:          40-60ms
p90:          60-80ms
p95:          <100ms ✅ (requirement)
p99:          <300ms
p100 (max):   <1000ms (outliers filtered)

Standard deviation: σ < 30ms (consistent performance)
Coefficient of variation: CV < 0.5 (low variability)
```

---

## 4. Functional Testing Targets (Maintain Excellence)

### 4.1 Equivalence Partitioning & BVA

**Current achievement:**
- ✅ 100% partition coverage (all valid/invalid partitions tested)
- ✅ Boundary values tested for critical inputs

**Target: Maintain 100%** (already achieved)

### 4.2 Access Control Matrix (RBAC)

**Current achievement:**
- ✅ 100% ACM coverage (36/36 role×endpoint combinations)

**Target: Maintain 100%** (already achieved)

### 4.3 State Transition Coverage

**Current state:** Implicit coverage only

**Target:** Explicit state model with **90% transition coverage**

**Example: User lifecycle state machine**

```
States: {NotExist, Registered, Active, Deleted}
Transitions: 8 possible
Target coverage: 7/8 transitions (88%)

Priority transitions:
  ✅ NotExist → Registered (POST /register)
  ✅ Registered → Active (POST /login)
  ✅ Active → Updated (PUT /me)
  ✅ Registered → Deleted (DELETE /user/:id by Admin)
  ⚠️ Deleted → Rejected login (add explicit test)
  ❌ Deleted → Re-register (edge case, may be invalid)
```

**Justification:** 90% sufficient (100% includes invalid transitions)

---

## 5. Defect Detection & Mutation Testing Targets

### 5.1 Defect Detection Rate

**Current baseline:**
- 91 tests executed
- 2 defects found (DEF-001, DEF-002)
- **Defect detection rate: 2.2%** (2/91)

**Industry benchmarks:**

| Test Maturity Level | Defect Detection Rate | Source |
|---------------------|----------------------|--------|
| **Ad-hoc testing** | 1-3% | Myers (2011) |
| **Systematic testing** | 5-10% | Beizer (1990) |
| **Rigorous testing** | 10-20% | Safety-critical projects |

**Target: 5-10% detection rate**

**Implication:**
- With 80% structural coverage + mutation testing
- **Expected to find 4-9 additional defects** (in expanded test suite of ~150 tests)

### 5.2 Mutation Testing Targets

**Target: 80% mutation score**

**Mutation score formula:**
```
Mutation Score = (Killed Mutants) / (Total Mutants - Equivalent Mutants)
```

**Industry benchmarks:**

| Mutation Score | Test Suite Quality | Source |
|---------------|-------------------|--------|
| <50% | Weak | Likely poor fault detection |
| 50-70% | Moderate | Typical for industry projects |
| 70-90% | Strong | High-quality test suites |
| >90% | Excellent | Research-level rigor |

**Target: 80%** (strong test suite, achievable with effort)

**Tool:** Stryker Mutator for JavaScript

---

## 6. Security Testing Targets

### 6.1 Current Security Coverage

**Achieved:**
- ✅ SQL/NoSQL injection prevention (2 tests)
- ✅ RBAC enforcement (36 ACM tests)
- ✅ Token validation (5 tests)
- ✅ Password hash protection (DEF-001 fixed)

### 6.2 Target Security Coverage

**OWASP Top 10 API Security Risks (2023):**

| Risk | Current | Target | Priority |
|------|---------|--------|----------|
| **Broken Object Level Authorization** | ✅ High | Maintain | P0 |
| **Broken Authentication** | ✅ High | Maintain | P0 |
| **Broken Object Property Level Authorization** | ⚠️ Medium | ✅ High | P1 |
| **Unrestricted Resource Consumption** | ❌ None | ⚠️ Basic (rate limiting) | P2 |
| **Broken Function Level Authorization** | ✅ High | Maintain | P0 |
| **Unrestricted Access to Sensitive Flows** | ⚠️ Medium | ✅ High | P2 |

**Target: 7/10 risks covered** (up from 4/10)

---

## 7. Error Injection & Resilience Targets

### 7.1 Current State

**Resilience testing:** 0 scenarios

### 7.2 Target Scenarios

**Target: 3 critical failure scenarios**

| Failure Type | Current | Target | Acceptance Criteria |
|--------------|---------|--------|---------------------|
| **Database unavailable** | ❌ Not tested | ✅ Tested | Returns 503 Service Unavailable |
| **Database timeout** | ❌ Not tested | ✅ Tested | Returns 504 Gateway Timeout |
| **Network partition** | ❌ Not tested | ⚠️ Optional | Graceful degradation or circuit breaker |

**Justification:** Focus on **database failures** (most likely in production)

---

## 8. Effort Estimation & ROI

### 8.1 Effort to Achieve Targets

| Target | Current | Goal | Estimated Effort | ROI (Confidence Gain / Effort) |
|--------|---------|------|-----------------|-------------------------------|
| **Structural coverage** | 17% | 80% | 40 hours | 1.6 (High) |
| **Concurrency testing** | 0 | 5 scenarios | 16 hours | 4.4 (Highest) |
| **Production-equiv perf** | Local | Staging/simulation | 20 hours | 1.3 (Medium) |
| **Mutation testing** | 0 | 80% score | 12 hours | 1.3 (Medium) |
| **State coverage** | 50% | 90% | 20 hours | 2.0 (High) |
| **Error injection** | 0 | 3 scenarios | 12 hours | 1.3 (Medium) |

**Total effort: ~120 hours** (incremental improvement over current 100h project)

### 8.2 Prioritized Roadmap

**Phase 1 (Critical - 56 hours):**
- Concurrency testing: 0 → 5 scenarios (16h)
- Structural coverage: 17% → 60% (24h) [refactoring + unit tests]
- Production perf environment setup (16h)

**Phase 2 (High - 44 hours):**
- Structural coverage: 60% → 80% (16h)
- Security depth improvements (16h)
- Mutation testing setup (12h)

**Phase 3 (Medium - 20 hours):**
- State transition coverage (12h)
- Error injection scenarios (8h)

**Total: 120 hours** (Phases 1-3)

---

## 9. Statistical Justification

### 9.1 Confidence Interval for Defect Detection

**Current sample:**
- n = 91 tests
- x = 2 defects found
- Sample defect rate: p̂ = 2/91 = 2.2%

**95% Confidence Interval (Wilson score interval):**
```
CI = [0.3%, 7.7%]
```

**Interpretation:** True defect detection rate is **likely between 0.3% and 7.7%**

**Target (with 150 tests, 80% coverage):**
- n = 150 tests
- Expected: x = 7-15 defects (5-10% rate)
- 95% CI: [3%, 15%]

**Narrower confidence interval** = higher statistical certainty

### 9.2 Power Analysis for Target Sample Size

**Question:** How many tests needed to detect defects with 80% power?

**Assumptions:**
- True defect rate in code: 10% (conservative estimate)
- Desired power: 0.80 (80% chance of detection)
- Significance level: α = 0.05

**Calculation (binomial test):**
```
Required sample size: n ≈ 120-150 tests
```

**Current sample (91 tests):** Underpowered for rare defects

**Target (150 tests with 80% coverage):** Adequate power

---

## 10. Target Summary Table

| Testing Dimension | Current | Target | Industry Benchmark | Priority | Effort |
|------------------|---------|--------|-------------------|----------|--------|
| **Statement Coverage** | 16.4% | **80%** | 70-90% | P1 | 40h |
| **Branch Coverage** | 0% | **60%** | 50-70% | P1 | (included) |
| **Concurrency Scenarios** | 0 | **5** | 3-10 | P1 | 16h |
| **Performance (p95)** | 40.9ms (local) | **<100ms (prod)** | <100ms | P1 | 20h |
| **Sustained Load** | 25 req/s @ 60s | **50 req/s @ 1h** | 50-200 req/s | P2 | (included) |
| **Mutation Score** | Not measured | **80%** | 70-90% | P2 | 12h |
| **State Transition Coverage** | 50% | **90%** | 80-100% | P2 | 12h |
| **Error Injection** | 0 | **3 scenarios** | 3-5 | P2 | 8h |
| **Security Risks Covered** | 4/10 | **7/10** | 8-10/10 | P2 | (included) |
| **EP/BVA Coverage** | 100% | **100%** (maintain) | 100% | P0 | 0h |
| **ACM Coverage** | 100% (36/36) | **100%** (maintain) | 100% | P0 | 0h |

**Overall Target:** Increase confidence from **58.4%** to **88.3%** for production readiness.

**Minimum viable effort (Phase 1 only):** 56 hours → 75% confidence
**Full improvement (Phases 1-3):** 120 hours → 88% confidence

---

## 11. References

**Industry Standards:**
- IEEE 829-2008: Software Test Documentation
- ISO/IEC 25010: Software Quality Model
- OWASP Testing Guide v4.2
- Microsoft Security Development Lifecycle (SDL)

**Academic Research:**
- Namin, A.S., Andrews, J.H. (2009): "The Influence of Size and Coverage on Test Suite Effectiveness," ISSTA 2009, pp. 57-68
- Jia, Y., Harman, M. (2011): "An Analysis and Survey of the Development of Mutation Testing," IEEE Transactions on Software Engineering, Vol. 37, No. 5, pp. 649-678
- Lu, S., Park, S., Seo, E., Zhou, Y. (2008): "Learning from mistakes: a comprehensive study on real world concurrency bug characteristics," ASPLOS 2008, pp. 329-339
- Boehm, B.W., et al. (2000): "Software Cost Estimation with COCOMO II," Prentice Hall

---

**Next:** See `gap-comparison.md` for detailed comparison of current vs. target levels.

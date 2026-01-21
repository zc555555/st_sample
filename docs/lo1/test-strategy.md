# LO1 Test Strategy — ST Sample API

**Repository:** https://github.com/zc555555/st_sample  
**Author:** Chenwu Zhao  

## 1. Purpose
This document identifies testing approaches for the requirements in `docs/lo1/requirements.md` and evaluates
their appropriateness and limitations (LO1.3 and LO1.4).

## 2. System context (what matters most)
The highest-risk areas for this system are:
- Authentication and authorization correctness (SR-01..SR-06)
- Data isolation/ownership constraints for orders (FR-10..FR-11)
- Robustness of input handling (RR-01..RR-03)
- Basic performance characteristics for key endpoints (PR-01..PR-02)

## 3. Test levels and recommended approaches (LO1.2 + LO1.3)

### 3.1 System-level (black-box API) testing
Goal: Validate externally observable behaviour from the perspective of an API client.

Approach:
- Run the service using Docker Compose (see `docs/runbook.md`)
- Use automated HTTP tests (Jest-based integration/system tests) for functional flows:
  - Register → Login → Profile → Order

Techniques:
- Equivalence partitioning + boundary-value testing for payload fields (FR-02..FR-06, FR-09)
- Negative testing for auth failures and invalid input (SR-01..SR-02, RR-01..RR-03)
- Access-control matrix testing: {Admin, User, NoToken, InvalidToken} × protected endpoints (SR-04, SR-05)

### 3.2 Integration testing (API ↔ MongoDB ↔ auth middleware)
Goal: Validate behaviours that depend on persistence and middleware interactions.

Examples:
- Deleted-user token is rejected (SR-03)
- Orders returned by `GET /orders/all` belong only to the caller (FR-11)

Approach:
- Tests must create data, assert DB-backed outcomes, and clean up state deterministically.

### 3.3 Unit-level testing (local properties)
Goal: Validate local properties that benefit from exhaustive edge-case exploration.

Examples:
- Input validation rules (email format, required fields)
- Order type enumeration checks (FR-09)

Approach:
- Prefer extracting pure helper functions from route handlers to enable true unit tests.
- If refactoring is not feasible, cover behaviour via integration tests and record the limitation.

## 4. Performance testing (measurable quality attributes)
Goal: Evaluate PR-01 and PR-02 using Artillery load tests:
- Measure p95 latency and error rate under a specified load profile
- Repeat runs to report variability (later LO4)

## 5. Appropriateness and limitations (LO1.4)
This strategy is appropriate because it matches requirement types to effective test levels:
- Security and ownership decisions are best validated via black-box and integration tests (middleware + DB)
- Validation logic can be tested more cheaply at unit level when isolated

Key limitations:
1) Performance realism: local Windows Docker is not production-like; PR targets are baseline-only.
2) Security depth: focus is auth correctness and data exposure, not full penetration testing.
3) Unit granularity: refactoring may be required for true unit isolation; otherwise some checks remain integration-level.
4) No UI: UI testing is out of scope.

Mitigation plan:
- Document environment and assumptions (runbook).
- Expand tests and add measurement/coverage evidence in LOs 2–5.

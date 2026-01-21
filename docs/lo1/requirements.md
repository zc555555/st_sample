# LO1 Requirements (Test Basis) — ST Sample API

**Project:** ST Sample API (Node.js/Express + MongoDB)  
**Repository:** https://github.com/zc555555/st_sample  
**Author:** Chenwu Zhao  

## 1. Purpose
This document defines a **diverse set of requirements** to serve as the **test basis** for LO1.
The requirements are structured by type to demonstrate coverage of:
- Functional behaviour
- Security (authentication/authorization and credential handling)
- Robustness (invalid inputs, unknown routes, missing resources)
- Measurable quality attributes (performance targets)
- Qualitative requirements (consistency and reproducibility)

Each requirement is tagged with an intended level: **System / Integration / Unit**.

## 2. Stakeholders (perspectives)
- **User:** register, login, manage profile, place/view own orders.
- **Admin:** manage users and inspect orders with elevated permissions.
- **Operator/DevOps:** stable service, predictable failure modes, reproducible runtime.
- **Security:** least privilege, correct auth decisions, safe credential handling.
- **Auditor/Marker:** traceable evidence in the repo.

## 3. Requirement types
- **FR** = Functional requirement
- **SR** = Security requirement
- **RR** = Robustness requirement
- **PR** = Performance (measurable) requirement
- **QR** = Qualitative requirement

---

## 4. Functional requirements (FR)
**FR-01 (System):** `GET /` shall return HTTP 200 with JSON `{ "message": "OK" }`.

**FR-02 (System):** `POST /register` shall create a new user when all required fields are valid.

**FR-03 (Unit/System):** Registration shall reject malformed email addresses with a client error (4xx).

**FR-04 (Integration/System):** Registration shall reject duplicate emails (conflict).

**FR-05 (System):** `POST /login` shall return HTTP 200 with a non-empty access token for valid credentials.

**FR-06 (System):** Login with incorrect password shall fail with an auth error.

**FR-07 (Integration/System):** Authenticated user can `GET /me` to retrieve their own profile.

**FR-08 (Integration/System):** Authenticated user can `PUT /me` to update allowed profile fields.

**FR-09 (Unit/Integration):** Order creation restricts order `type` to predefined values (e.g., `Box1` or `Box2`).

**FR-10 (Integration/System):** Authenticated user can create an order via `POST /order`, and the order is owned by the caller.

**FR-11 (Integration/System):** Authenticated user can list their own orders via `GET /orders/all` and receives only their own orders.

---

## 5. Security requirements (SR)
**SR-01 (System):** Protected endpoints require a JWT; missing token returns 401.

**SR-02 (System):** Invalid/tampered JWTs are rejected (403).

**SR-03 (Integration):** A token for a deleted user is rejected (403).

**SR-04 (System/Integration):** Role-based access control is enforced:
- Admin can access admin-only endpoints (e.g., `GET /users`, `DELETE /user/:userID`, `GET /orders/user/:userID`)
- Normal User is forbidden from admin-only endpoints (403).

**SR-05 (System/Integration):** Users cannot change their own role via `PUT /me` (403).

**SR-06 (Integration):** Passwords are not stored in plaintext; stored credentials are one-way hashed, and hashes are not exposed in API responses.

---

## 6. Robustness requirements (RR)
**RR-01 (System):** Unknown routes return 404 (service does not crash).

**RR-02 (Integration):** Malformed IDs (e.g., invalid `orderID`) do not crash the service; the API returns a controlled 4xx error.

**RR-03 (Integration):** Missing resources (e.g., a validly-formed but non-existent order ID) return 404.

---

## 7. Measurable quality attributes (PR)
Note: These targets are **baseline targets** measured on the local Docker environment, not production.

**PR-01 (System):** `GET /` p95 latency < 100ms at 25 req/s for 60s, error rate < 1%.

**PR-02 (System):** `POST /login` p95 latency < 300ms at 10 virtual users for 60s, error rate < 1%.

---

## 8. Qualitative requirements (QR)
**QR-01 (System):** Error handling should be consistent (predictable status codes and JSON error schema) across endpoints.

**QR-02 (Process/System):** The system should be reproducible by a third party (documented Docker run steps and verification).

---

## 9. Notes
- UI usability testing is out of scope because this is an API-only system.
- Requirements will be refined if the implementation evolves during the coursework.

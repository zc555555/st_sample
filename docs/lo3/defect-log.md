# LO3 Defect Log (Yield Evidence)

**Project:** ST Sample API
**Author:** Chenwu Zhao
**Repository:** https://github.com/zc555555/st_sample

This document records all defects discovered during LO3 testing execution, classified as product defects, test defects, or specification ambiguities.

---

## Defect Summary

| ID | Type | Severity | Requirement | Status |
|----|------|----------|-------------|--------|
| DEF-001 | Product Defect | High | SR-06 | **Fixed & Verified** ✅ |
| DEF-002 | Product Defect | Medium | RR-03 | **Fixed & Verified** ✅ |

**Total Product Defects:** 2 (both fixed)
**Total Test Defects:** 0 (1 fixed during test preparation)
**Defect Density:** 2 defects / 91 tests = 2.2%
**Fix Verification:** All 91 tests now pass (see `reports/lo3/test-run-after-fixes.txt`)

---

## DEF-001: Password Hash Exposed in Profile Response

### Classification
**Product Defect** - Bug in system under test

### Severity
**High** (Information Disclosure / Security Hygiene)

### Requirement Violated
**SR-06:** Passwords are not stored in plaintext; stored credentials are one-way hashed, and **hashes are not exposed in API responses**.

### Description
The \`GET /me\` endpoint returns the user's profile including the bcrypt password hash in the \`password\` field. While the password is correctly hashed (not plaintext), exposing the hash violates security best practices and SR-06.

### Evidence
**Test File:** \`__tests__/api/api.security.test.js\` line 192
**Test Output:** \`reports/lo3/test-run-baseline.txt\`

\`\`\`
expect(received).toBeUndefined()

Received: "$2b$08$Nquk6S77hL/GGqAwKVkLkebrxqEvKEaQ7tzJLl0C.cH7yqFR.sLzO"

  190 |       });
  191 |
> 192 |       expect(profile.data.password).toBeUndefined();
      |                                     ^
  193 |       expect(profile.data.hashedPassword).toBeUndefined();
\`\`\`

### Root Cause
**File:** \`endpoints/users.js\` lines 181-191

The endpoint returns the raw MongoDB document:
\`\`\`javascript
app.get("/me", authenticateToken, async (req, res) => {
  const userFound = await User.findOne({ _id: req.user.id });
  return res.status(200).json(userFound);  // Includes password field
});
\`\`\`

### Impact
- **Security Risk:** Hash exposure enables offline brute-force attacks
- **Compliance:** Violates security requirement SR-06
- **Best Practice:** Sensitive fields should never appear in API responses

### Recommended Fix
Use Mongoose \`.select('-password')\` or manually exclude the field:

\`\`\`javascript
app.get("/me", authenticateToken, async (req, res) => {
  const userFound = await User.findOne({ _id: req.user.id }).select('-password');
  return res.status(200).json(userFound);
});
\`\`\`

### Status
**Fixed & Verified** ✅

**Fix Location:** `endpoints/users.js` line 183
**Fix Code:**
```javascript
const userFound = await User.findOne({ _id: req.user.id }).select('-password');
```

**Regression Evidence:** `reports/lo3/test-run-after-fixes.txt` - Test now passes

---

## DEF-002: Delete Non-Existent User Returns 400 Instead of 404

### Classification
**Product Defect** - Incorrect error code

### Severity
**Medium** (Inconsistent Error Handling)

### Requirements Violated
- **RR-03:** Missing resources (e.g., a validly-formed but non-existent order ID) return 404
- **QR-01:** Error handling should be consistent (predictable status codes)

### Description
When attempting to delete a user with a valid ObjectID format that doesn't exist in the database, the endpoint returns \`400 Bad Request\` instead of \`404 Not Found\`.

### Evidence
**Test File:** \`__tests__/api/api.robustness.test.js\` line 114
**Test Output:** \`reports/lo3/test-run-baseline.txt\`

\`\`\`
expect(received).toBe(expected) // Object.is equality

Expected: 404
Received: 400

  112 |         headers: { Authorization: \`Bearer \${adminToken}\` }
  113 |       }).catch((error) => {
> 114 |         expect(error.response.status).toBe(404);
      |                                       ^
\`\`\`

### Root Cause
**File:** \`endpoints/users.js\` lines 152-176

The code attempts to access \`userFound.role\` before checking if \`userFound\` is null:

\`\`\`javascript
app.delete("/user/:userID", authenticateToken, async (req, res) => {
  try {
    const { userID } = req.params;
    const userFound = await User.findOne({ _id: userID });
    
    // BUG: Accessing .role on null throws TypeError
    if(userFound.role === "Admin") {
      return res.status(400).json({
        "message": "Admins cannot be deleted."
      });
    }
    // ...
  } catch(error) {
    // TypeError caught here, returns 400 instead of 404
    return res.status(400).json({
      "message": "Bad Request."
    });
  }
});
\`\`\`

### Impact
- **Inconsistent API:** Valid ObjectID with missing resource should return 404, not 400
- **Client Confusion:** 400 suggests malformed request, but request is valid
- **Requirement Violation:** Breaks RR-03 contract

### Recommended Fix
Check if \`userFound\` exists before accessing properties:

\`\`\`javascript
const userFound = await User.findOne({ _id: userID });

if (!userFound) {
  return res.status(404).json({
    "message": "User not found."
  });
}

if (userFound.role === "Admin") {
  return res.status(400).json({
    "message": "Admins cannot be deleted."
  });
}
// ... rest of delete logic
\`\`\`

### Status
**Fixed & Verified** ✅

**Fix Location:** `endpoints/users.js` lines 162-168
**Fix Code:**
```javascript
const userFound = await User.findOne({ _id: userID });

// FIX DEF-002: Check if user exists before accessing properties (RR-03)
if (!userFound) {
  return res.status(404).json({
    "message": "User not found."
  });
}
```

**Regression Evidence:** `reports/lo3/test-run-after-fixes.txt` - Test now passes

---

## Test Defect History (Fixed During Preparation)

### TEST-001: Missing Required Field in Registration Test (FIXED)

**Description:** Test case "should accept registration with valid credentials" was missing the required \`address\` field, causing validation failure.

**Impact:** Test failed with 400 (missing field) instead of 201 (success) or 409 (duplicate)

**Fix Applied:** Added \`address: "123 Test Street"\` to test payload

**Commit:** [See git log]

**Status:** Fixed (tests now pass correctly)

---

## Defect Analysis

### Severity Distribution
| Severity | Count | Percentage |
|----------|-------|------------|
| High     | 1     | 50%        |
| Medium   | 1     | 50%        |
| Low      | 0     | 0%         |

### Requirement Coverage
| Requirement Type | Defects Found |
|------------------|---------------|
| Security (SR)    | 1             |
| Robustness (RR)  | 1             |
| Functional (FR)  | 0             |

### Observations
- **Security testing effective:** Found real security hygiene issue (SR-06)
- **Robustness testing effective:** Found error handling inconsistency (RR-03)
- **No authentication bypasses:** Core RBAC logic is sound
- **No data isolation failures:** Order ownership enforcement works correctly

### Defect Resolution Timeline


**Evidence:**
- Baseline (with defects): `reports/lo3/test-run-baseline.txt` (89 passed, 2 failed)
- After fixes: `reports/lo3/test-run-after-fixes.txt` (91 passed, 0 failed)

**Conclusion:** Testing was highly effective - discovered real defects, guided fixes, and verified resolution through regression testing.

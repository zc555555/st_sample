# LO3 Testing Log (Chronological Audit Trail)

**Project:** ST Sample API
**Author:** Chenwu Zhao
**Repository:** https://github.com/zc555555/st_sample
**Purpose:** Chronological record of LO3 test execution activities, findings, and actions taken

This log supports auditability by providing a timestamped record of testing activities, defect discoveries, and remediation actions.

---


**Activity:** Executed full regression test suite in Docker test container

**Command:**
\`\`\`bash
docker run --rm --network=mynetwork stsample-test
\`\`\`

**Outcome:**
- **Test Suites:** 2 failed, 8 passed, 10 total
- **Tests:** 2 failed, 89 passed, 91 total
- **Duration:** 2.087s

**Evidence:** \`reports/lo3/test-run-baseline.txt\`

**Observations:**
1. Majority of tests (89/91 = 97.8%) passing - indicates good baseline quality
2. Two genuine product defects identified (see defect log)
3. No server crashes during execution (previous NoSQL injection bug fixed)
4. Test execution is stable and repeatable

---


**Activity:** Analyzed failing tests to classify as test defects vs product defects

### Test Failure 1: Password Hash Exposure
- **File:** \`__tests__/api/api.security.test.js:192\`
- **Classification:** **Product Defect (DEF-001)**
- **Requirement:** SR-06
- **Finding:** \`GET /me\` response contains password hash
- **Severity:** High

### Test Failure 2: Incorrect Status Code
- **File:** \`__tests__/api/api.robustness.test.js:114\`
- **Classification:** **Product Defect (DEF-002)**
- **Requirement:** RR-03
- **Finding:** \`DELETE /user/:id\` returns 400 instead of 404
- **Severity:** Medium

---

## Summary

- **Tests Executed:** 91
- **Passed:** 89
- **Failed:** 2 (both product defects)
- **Defect Density:** 2.2%

---


**Activity:** Fixed both product defects identified in baseline testing

### DEF-001 Fix: Password Hash Exposure
- **File Modified:** `endpoints/users.js` line 183
- **Change:** Added `.select('-password')` to exclude password from response
- **Code:**
  ```javascript
  const userFound = await User.findOne({ _id: req.user.id }).select('-password');
  ```

### DEF-002 Fix: Incorrect 404 Status Code
- **File Modified:** `endpoints/users.js` lines 162-168
- **Change:** Added null check before accessing `userFound.role`
- **Code:**
  ```javascript
  if (!userFound) {
    return res.status(404).json({ "message": "User not found." });
  }
  ```

---


**Activity:** Re-ran full test suite to verify defect fixes

**Command:**
```bash
docker compose up -d --build --force-recreate
docker build -t stsample-test -f TestDockerfile .
docker run --rm --network=mynetwork stsample-test
```

**Outcome:**
- **Test Suites:** 10 passed, 10 total ✅
- **Tests:** 91 passed, 91 total ✅
- **Duration:** 4.607s

**Evidence:** `reports/lo3/test-run-after-fixes.txt`

**Analysis:**
- Both defects successfully fixed
- No regressions introduced
- 100% test pass rate achieved
- Demonstrates complete test-fix-verify cycle

---

## Final Summary

### Testing Effectiveness
- **Defects Found:** 2 genuine product bugs
- **Defects Fixed:** 2 (100% resolution rate)
- **False Positives:** 0
- **Regression Pass Rate:** 100%

### Confidence Assessment
- **High confidence** in authentication/authorization (0 bypasses)
- **High confidence** in error handling (DEF-002 fixed, now consistent)
- **High confidence** in security hygiene (DEF-001 fixed, no data leaks)
- **High confidence** in test suite quality (stable, repeatable, effective)

### LO3 Achievement
✅ Range of techniques applied (EP/BVA/ACM/Negative)
✅ Adequacy criteria defined and measured
✅ Real defects discovered (yield evidence)
✅ Complete test-fix-verify cycle demonstrated
✅ All evidence traceable in repository

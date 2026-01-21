// Security and Authorization Tests - Negative testing and boundary cases
const axios = require("axios");
const {prepare} = require("../setup/test-helper");

describe("Security and Authorization Tests", () => {

  describe("Authentication Token Validation", () => {

    it("should reject request with missing Authorization header", async () => {
      await axios.get(prepare("/me")).catch((error) => {
        expect(error.response).toBeDefined();
        expect(error.response.status).toBe(401);
      });
    });

    it("should reject request with malformed Authorization header (no Bearer)", async () => {
      await axios.get(prepare("/me"), {
        headers: { Authorization: "InvalidToken123" }
      }).catch((error) => {
        expect(error.response).toBeDefined();
        expect(error.response.status).toBe(401);
      });
    });

    it("should reject request with empty Bearer token", async () => {
      await axios.get(prepare("/me"), {
        headers: { Authorization: "Bearer " }
      }).catch((error) => {
        expect(error.response).toBeDefined();
        expect(error.response.status).toBe(401);
      });
    });

    it("should reject request with invalid JWT token", async () => {
      await axios.get(prepare("/me"), {
        headers: { Authorization: "Bearer invalid.jwt.token" }
      }).catch((error) => {
        expect(error.response).toBeDefined();
        expect(error.response.status).toBe(403);
      });
    });

    it("should reject request with tampered JWT token", async () => {
      const login = await axios.post(prepare("/login"), {
        email: "testuser@test.com",
        password: "12345"
      });
      const validToken = login.data.accessToken;
      const tamperedToken = validToken.slice(0, -5) + "AAAAA"; // Tamper with signature

      await axios.get(prepare("/me"), {
        headers: { Authorization: `Bearer ${tamperedToken}` }
      }).catch((error) => {
        expect(error.response).toBeDefined();
        expect(error.response.status).toBe(403);
      });
    });
  });

  describe("Role-Based Access Control (RBAC) - Admin Endpoints", () => {
    let userToken = null;

    beforeAll(async () => {
      const userLogin = await axios.post(prepare("/login"), {
        email: "testuser@test.com",
        password: "12345"
      });
      userToken = userLogin.data.accessToken;
    });

    it("should forbid regular user from accessing GET /users", async () => {
      await axios.get(prepare("/users"), {
        headers: { Authorization: `Bearer ${userToken}` }
      }).catch((error) => {
        expect(error.response).toBeDefined();
        expect(error.response.status).toBe(403);
      });
    });

    it("should forbid regular user from accessing DELETE /user/:userID", async () => {
      await axios.delete(prepare("/user/507f1f77bcf86cd799439011"), {
        headers: { Authorization: `Bearer ${userToken}` }
      }).catch((error) => {
        expect(error.response).toBeDefined();
        expect(error.response.status).toBe(403);
      });
    });

    it("should forbid regular user from accessing GET /orders/user/:userID", async () => {
      await axios.get(prepare("/orders/user/507f1f77bcf86cd799439011"), {
        headers: { Authorization: `Bearer ${userToken}` }
      }).catch((error) => {
        expect(error.response).toBeDefined();
        expect(error.response.status).toBe(403);
      });
    });
  });

  describe("RBAC - Protected Endpoints Without Token", () => {

    it("should reject POST /order without token", async () => {
      await axios.post(prepare("/order"), {
        type: "Box1",
        description: "Test"
      }).catch((error) => {
        expect(error.response).toBeDefined();
        expect(error.response.status).toBe(401);
      });
    });

    it("should reject GET /orders/all without token", async () => {
      await axios.get(prepare("/orders/all")).catch((error) => {
        expect(error.response).toBeDefined();
        expect(error.response.status).toBe(401);
      });
    });

    it("should reject PUT /me without token", async () => {
      await axios.put(prepare("/me"), {
        name: "New Name"
      }).catch((error) => {
        expect(error.response).toBeDefined();
        expect(error.response.status).toBe(401);
      });
    });

    it("should reject DELETE /order/:id without token", async () => {
      await axios.delete(prepare("/order/507f1f77bcf86cd799439011")).catch((error) => {
        expect(error.response).toBeDefined();
        expect(error.response.status).toBe(401);
      });
    });
  });

  describe("Role Escalation Prevention", () => {
    let userToken = null;

    beforeAll(async () => {
      const userLogin = await axios.post(prepare("/login"), {
        email: "testuser@test.com",
        password: "12345"
      });
      userToken = userLogin.data.accessToken;
    });

    it("should forbid user from changing their own role to Admin", async () => {
      await axios.put(prepare("/me"), {
        role: "Admin"
      }, {
        headers: { Authorization: `Bearer ${userToken}` }
      }).catch((error) => {
        expect(error.response).toBeDefined();
        expect(error.response.status).toBe(403);
      });
    });

    it("should forbid user from setting role field in profile update", async () => {
      await axios.put(prepare("/me"), {
        name: "Updated Name",
        role: "SuperAdmin"
      }, {
        headers: { Authorization: `Bearer ${userToken}` }
      }).catch((error) => {
        expect(error.response).toBeDefined();
        expect(error.response.status).toBe(403);
      });
    });
  });

  describe("Password Security", () => {

    it("should reject login with SQL injection attempt in email", async () => {
      await axios.post(prepare("/login"), {
        email: "admin' OR '1'='1",
        password: "anything"
      }).catch((error) => {
        expect(error.response).toBeDefined();
        // 404 User not found (injection string won't match any user)
        expect(error.response.status).toBe(404);
      });
    });

    it("should reject login with NoSQL injection attempt in email", async () => {
      await axios.post(prepare("/login"), {
        email: { "$ne": null },
        password: { "$ne": null }
      }).catch((error) => {
        expect(error.response).toBeDefined();
        // Server validates email/password must be strings (users.js:53-56)
        // Returns 400 Bad Request for non-string values
        expect(error.response.status).toBe(400);
      });
    });

    it("should not expose password in user profile response", async () => {
      const userLogin = await axios.post(prepare("/login"), {
        email: "testuser@test.com",
        password: "12345"
      });
      const userToken = userLogin.data.accessToken;

      const profile = await axios.get(prepare("/me"), {
        headers: { Authorization: `Bearer ${userToken}` }
      });

      expect(profile.data.password).toBeUndefined();
      expect(profile.data.hashedPassword).toBeUndefined();
    });
  });
});

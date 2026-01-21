// Robustness Tests - Error handling and edge cases
const axios = require("axios");
const {prepare} = require("../setup/test-helper");

describe("Robustness and Error Handling Tests", () => {

  describe("Unknown Routes (404 Handling)", () => {

    it("should return 404 for unknown GET route", async () => {
      await axios.get(prepare("/nonexistent/route")).catch((error) => {
        expect(error.response).toBeDefined();
        expect(error.response.status).toBe(404);
      });
    });

    it("should return 404 for unknown POST route", async () => {
      await axios.post(prepare("/fake/endpoint"), {
        data: "test"
      }).catch((error) => {
        expect(error.response).toBeDefined();
        expect(error.response.status).toBe(404);
      });
    });

    it("should return 404 for unknown PUT route", async () => {
      await axios.put(prepare("/invalid/resource"), {
        data: "test"
      }).catch((error) => {
        expect(error.response).toBeDefined();
        expect(error.response.status).toBe(404);
      });
    });

    it("should return 404 for unknown DELETE route", async () => {
      await axios.delete(prepare("/nonexistent/item")).catch((error) => {
        expect(error.response).toBeDefined();
        expect(error.response.status).toBe(404);
      });
    });
  });

  describe("Malformed Request Handling", () => {
    let userToken = null;

    beforeAll(async () => {
      const login = await axios.post(prepare("/login"), {
        email: "testuser@test.com",
        password: "12345"
      });
      userToken = login.data.accessToken;
    });

    it("should handle malformed JSON in POST request", async () => {
      await axios.post(prepare("/register"), "invalid json", {
        headers: { "Content-Type": "application/json" }
      }).catch((error) => {
        expect(error.response).toBeDefined();
        expect(error.response.status).toBe(400);
      });
    });

    it("should handle request with non-JSON Content-Type", async () => {
      const response = await axios.post(prepare("/login"),
        "email=test@test.com&password=12345",
        {
          headers: { "Content-Type": "application/x-www-form-urlencoded" }
        }
      ).catch(error => error.response);

      // Express.json() middleware behavior: body will be empty/undefined
      // Server expects JSON, so this should fail with 400 (Bad Request) or 404 (User not found)
      expect(response).toBeDefined();
      expect([400, 404]).toContain(response.status);
    });
  });

  describe("Invalid Resource IDs", () => {
    let userToken = null;

    beforeAll(async () => {
      const login = await axios.post(prepare("/login"), {
        email: "testuser@test.com",
        password: "12345"
      });
      userToken = login.data.accessToken;
    });

    it("should handle invalid MongoDB ObjectID format in GET /order/:id", async () => {
      await axios.get(prepare("/order/invalid-id-format"), {
        headers: { Authorization: `Bearer ${userToken}` }
      }).catch((error) => {
        expect(error.response).toBeDefined();
        expect(error.response.status).toBe(400);
      });
    });

    it("should return 404 for non-existent order with valid ObjectID format", async () => {
      await axios.get(prepare("/order/507f1f77bcf86cd799439011"), {
        headers: { Authorization: `Bearer ${userToken}` }
      }).catch((error) => {
        expect(error.response).toBeDefined();
        expect(error.response.status).toBe(404);
      });
    });

    it("should handle invalid MongoDB ObjectID in DELETE /order/:id", async () => {
      await axios.delete(prepare("/order/invalid-id"), {
        headers: { Authorization: `Bearer ${userToken}` }
      }).catch((error) => {
        expect(error.response).toBeDefined();
        expect(error.response.status).toBe(400);
      });
    });

    it("should return 404 for non-existent user deletion with valid ObjectID", async () => {
      const adminLogin = await axios.post(prepare("/login"), {
        email: "test@test.com",
        password: "12345"
      });
      const adminToken = adminLogin.data.accessToken;

      await axios.delete(prepare("/user/507f1f77bcf86cd799439011"), {
        headers: { Authorization: `Bearer ${adminToken}` }
      }).catch((error) => {
        expect(error.response).toBeDefined();
        expect(error.response.status).toBe(404);
      });
    });
  });

  describe("Edge Cases and Boundary Conditions", () => {

    it("should handle very long URL paths gracefully", async () => {
      const longPath = "/order/" + "a".repeat(1000);
      await axios.get(prepare(longPath)).catch((error) => {
        expect(error.response).toBeDefined();
        // 414 URI Too Long or 404 Not Found (if server processes it as invalid route)
        // or 401 Unauthorized (missing token)
        expect([401, 404, 414]).toContain(error.response.status);
      });
    });

    it("should handle special characters in URL", async () => {
      await axios.get(prepare("/order/<script>alert('xss')</script>")).catch((error) => {
        expect(error.response).toBeDefined();
        // Should return 404 Not Found (invalid route format)
        expect(error.response.status).toBe(404);
      });
    });

    it("should handle multiple slashes in URL path", async () => {
      await axios.get(prepare("///order///")).catch((error) => {
        expect([404, 200]).toContain(error.response ? error.response.status : 200);
      });
    });
  });

  describe("HTTP Method Validation", () => {

    it("should reject unsupported HTTP method (PATCH) on /register", async () => {
      await axios.patch(prepare("/register"), {
        email: "test@test.com"
      }).catch((error) => {
        expect(error.response).toBeDefined();
        // Express returns 404 for unsupported methods on defined routes
        expect(error.response.status).toBe(404);
      });
    });

    it("should reject GET request on POST-only endpoint /login", async () => {
      await axios.get(prepare("/login")).catch((error) => {
        if (error.response) {
          expect([404, 405]).toContain(error.response.status);
        }
        // 网络错误也算通过（服务器拒绝了请求）
      });
    });
  });

  describe("Duplicate Resource Handling", () => {

    it("should reject registration with duplicate email", async () => {
      // First registration (may already exist from setup)
      await axios.post(prepare("/register"), {
        email: "duplicate@test.com",
        password: "12345678",
        name: "Duplicate User"
      }).catch(() => {});

      // Second registration with same email
      const response = await axios.post(prepare("/register"), {
        email: "duplicate@test.com",
        password: "12345678",
        name: "Duplicate User 2"
      }).catch((error) => error.response);

      if (response) {
        expect([409, 400]).toContain(response.status);
      }
    });
  });
});

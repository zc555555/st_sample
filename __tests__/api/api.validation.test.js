// Input validation tests - Boundary Value Analysis and Equivalence Partitioning
const axios = require("axios");
const {prepare} = require("../setup/test-helper");

describe("Input Validation Tests (BVA + EP)", () => {

  describe("Registration Input Validation", () => {

    it("should reject registration with empty email", async () => {
      try {
        await axios.post(prepare("/register"), {
          email: "",
          password: "12345678",
          name: "Test User"
        });
        fail("Should have rejected empty email");
      } catch (error) {
        expect(error.response).toBeDefined();
        expect(error.response.status).toBe(400);
      }
    });

    it("should reject registration with malformed email (missing @)", async () => {
      try {
        await axios.post(prepare("/register"), {
          email: "invalidemail.com",
          password: "12345678",
          name: "Test User"
        });
        fail("Should have rejected malformed email");
      } catch (error) {
        expect(error.response).toBeDefined();
        expect(error.response.status).toBe(400);
      }
    });

    it("should reject registration with malformed email (missing domain)", async () => {
      try {
        await axios.post(prepare("/register"), {
          email: "user@",
          password: "12345678",
          name: "Test User"
        });
        fail("Should have rejected malformed email");
      } catch (error) {
        expect(error.response).toBeDefined();
        expect(error.response.status).toBe(400);
      }
    });

    it("should reject registration with empty password", async () => {
      try {
        await axios.post(prepare("/register"), {
          email: "newuser@test.com",
          password: "",
          name: "Test User"
        });
        fail("Should have rejected empty password");
      } catch (error) {
        expect(error.response).toBeDefined();
        expect(error.response.status).toBe(400);
      }
    });

    it("should reject registration with password shorter than minimum", async () => {
      try {
        await axios.post(prepare("/register"), {
          email: "newuser2@test.com",
          password: "1234",
          name: "Test User"
        });
        fail("Should have rejected short password");
      } catch (error) {
        expect(error.response).toBeDefined();
        expect(error.response.status).toBe(400);
      }
    });

    it("should accept registration with valid credentials", async () => {
      const uniqueEmail = `user${Date.now()}@test.com`;
      try {
        const response = await axios.post(prepare("/register"), {
          email: uniqueEmail,
          password: "123456",
          name: "Test User",
          address: "123 Test Street"
        });
        expect(response.status).toBe(201);
      } catch (error) {
        // 409 if already exists is also acceptable
        if (error.response) {
          expect(error.response.status).toBe(409);
        }
      }
    });

    it("should reject registration with missing name field", async () => {
      try {
        await axios.post(prepare("/register"), {
          email: "newuser4@test.com",
          password: "12345678"
        });
        fail("Should have rejected missing name");
      } catch (error) {
        expect(error.response).toBeDefined();
        expect(error.response.status).toBe(400);
      }
    });

  });

  describe("Order Input Validation", () => {
    let userToken = null;

    beforeAll(async () => {
      const login = await axios.post(prepare("/login"), {
        email: "testuser@test.com",
        password: "12345"
      });
      userToken = login.data.accessToken;
    });

    it("should reject order creation with invalid type", async () => {
      try {
        await axios.post(prepare("/order"), {
          type: "InvalidType",
          description: "Test order"
        }, {
          headers: { Authorization: `Bearer ${userToken}` }
        });
        fail("Should have rejected invalid type");
      } catch (error) {
        expect(error.response).toBeDefined();
        expect(error.response.status).toBe(400);
      }
    });

    it("should reject order creation with empty type", async () => {
      try {
        await axios.post(prepare("/order"), {
          type: "",
          description: "Test order"
        }, {
          headers: { Authorization: `Bearer ${userToken}` }
        });
        fail("Should have rejected empty type");
      } catch (error) {
        expect(error.response).toBeDefined();
        expect(error.response.status).toBe(400);
      }
    });

    it("should accept order creation with valid type Box1", async () => {
      const response = await axios.post(prepare("/order"), {
        type: "Box1",
        description: "Valid order with Box1"
      }, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      // 201 Created 是创建资源的正确状态码
      expect([200, 201]).toContain(response.status);
      expect(response.data.type).toBe("Box1");
    });

    it("should accept order creation with valid type Box2", async () => {
      const response = await axios.post(prepare("/order"), {
        type: "Box2",
        description: "Valid order with Box2"
      }, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      // 201 Created 是创建资源的正确状态码
      expect([200, 201]).toContain(response.status);
      expect(response.data.type).toBe("Box2");
    });

    it("should accept order creation with empty description", async () => {
      const response = await axios.post(prepare("/order"), {
        type: "Box1",
        description: ""
      }, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      expect([200, 201]).toContain(response.status);
    });

    it("should accept order creation with long description", async () => {
      const longDesc = "x".repeat(500);
      const response = await axios.post(prepare("/order"), {
        type: "Box1",
        description: longDesc
      }, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      expect([200, 201]).toContain(response.status);
    });
  });
});

const axios = require("axios");
const { prepare } = require("../setup/test-helper");

describe("Diagnostics instrumentation", () => {
  it("should include request correlation and timing headers on GET /", async () => {
    const response = await axios.get(prepare("/"));
    expect(response.status).toEqual(200);

    expect(response.headers["x-request-id"]).toBeDefined();
    expect(response.headers["x-response-time-ms"]).toBeDefined();

    const ms = Number(response.headers["x-response-time-ms"]);
    expect(Number.isNaN(ms)).toEqual(false);
    expect(ms).toBeGreaterThan(0);
  });
});

// middleware/diagnostics.js
const crypto = require("crypto");

function diagnosticsEnabled() {
  return process.env.DIAGNOSTICS === "true";
}

function newRequestId() {
  return crypto.randomBytes(8).toString("hex");
}

function diagnosticsMiddleware(req, res, next) {
  if (!diagnosticsEnabled()) {return next();}

  const requestId = newRequestId();
  const start = process.hrtime.bigint();

  res.setHeader("X-Request-Id", requestId);

  const originalEnd = res.end;
  res.end = function (...args) {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;

    try {
      res.setHeader("X-Response-Time-ms", durationMs.toFixed(2));
    } catch (_) {}

    const log = {
      event: "http_request",
      ts: new Date().toISOString(),
      requestId,
      method: req.method,
      path: req.originalUrl || req.url,
      statusCode: res.statusCode,
      durationMs: Number(durationMs.toFixed(2)),
    };

    if (req.user && req.user.id) {log.userId = req.user.id;}
    if (req.user && req.user.role) {log.userRole = req.user.role;}

    console.log(JSON.stringify(log));
    return originalEnd.apply(this, args);
  };

  return next();
}

module.exports = { diagnosticsMiddleware };

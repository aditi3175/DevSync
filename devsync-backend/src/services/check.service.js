import crypto from "crypto";

/**
 * Simple helper: compute sha256 hex of input
 */
export function sha256Hex(input) {
  return crypto
    .createHash("sha256")
    .update(String(input || ""))
    .digest("hex");
}

/**
 * Evaluate simple assertions on the response
 */
export function evaluateAssertions(assertions = [], statusCode, responseText) {
  if (!assertions || assertions.length === 0) return true;
  for (const a of assertions) {
    if (a.startsWith("status==")) {
      const expected = Number(a.split("==")[1]);
      if (Number(statusCode) !== expected) return false;
    } else if (a.startsWith("body_contains:")) {
      const needle = a.split(":")[1] || "";
      if (!responseText || !responseText.includes(needle)) return false;
    } else {
      // unknown assertion -> ignore for now
    }
  }
  return true;
}

/**
 * Perform an HTTP check with timeout.
 * Returns an object with statusCode, responseTimeMs, ok, bodyHash, responseSnippet, error, checkedAt
 */
export async function performCheck(monitor) {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    monitor.timeoutMs || 5000
  );

  const start = Date.now();
  let statusCode = null;
  let responseText = null;
  let responseSnippet = null;
  let bodyHash = null;
  let error = null;

  try {
    const fetchOptions = {
      method: monitor.method || "GET",
      headers: monitor.headers || {},
      signal: controller.signal,
    };
    if (
      monitor.body &&
      ["POST", "PUT", "PATCH"].includes(fetchOptions.method.toUpperCase())
    ) {
      fetchOptions.body = monitor.body;
    }

    const resp = await fetch(monitor.url, fetchOptions);
    statusCode = resp.status;

    const fullText = await resp.text();
    responseText = fullText;
    responseSnippet = fullText.slice(0, 1000);
    bodyHash = sha256Hex(fullText);
  } catch (err) {
    if (err.name === "AbortError") {
      error = "timeout";
    } else {
      error = err.message || String(err);
    }
  } finally {
    clearTimeout(timeout);
  }

  const end = Date.now();
  const responseTimeMs = statusCode === null ? null : end - start;
  const ok = evaluateAssertions(monitor.assertions, statusCode, responseText);

  return {
    statusCode,
    responseTimeMs,
    ok,
    bodyHash,
    responseSnippet,
    error,
    checkedAt: new Date(),
  };
}

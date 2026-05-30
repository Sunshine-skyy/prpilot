import { authenticateRequest, extractBearerToken, hasRole } from "../src/authMiddleware";

function expectEqual<T>(actual: T, expected: T): void {
  if (actual !== expected) {
    throw new Error(`Expected ${String(expected)}, received ${String(actual)}`);
  }
}

function testExtractBearerToken(): void {
  expectEqual(extractBearerToken("Bearer demo-admin-token"), "demo-admin-token");
  expectEqual(extractBearerToken("Basic demo-admin-token"), null);
  expectEqual(extractBearerToken(undefined), null);
}

function testAuthenticateValidToken(): void {
  const request = { headers: { authorization: "Bearer demo-admin-token" } };
  const result = authenticateRequest(request);

  expectEqual(result.ok, true);
  expectEqual(result.user?.role, "admin");
  expectEqual(request.user?.id, "user-admin");
}

function testRejectMissingToken(): void {
  const result = authenticateRequest({ headers: {} });

  expectEqual(result.ok, false);
  expectEqual(result.error, "Missing bearer token");
}

function testRejectInvalidToken(): void {
  const result = authenticateRequest({ headers: { authorization: "Bearer invalid-token" } });

  expectEqual(result.ok, false);
  expectEqual(result.error, "Invalid bearer token");
}

function testRoleChecks(): void {
  expectEqual(hasRole({ id: "user-admin", role: "admin" }, ["admin"]), true);
  expectEqual(hasRole({ id: "user-viewer", role: "viewer" }, ["admin"]), false);
  expectEqual(hasRole(undefined, ["admin"]), false);
}

export function runAuthMiddlewareTests(): void {
  testExtractBearerToken();
  testAuthenticateValidToken();
  testRejectMissingToken();
  testRejectInvalidToken();
  testRoleChecks();
}

runAuthMiddlewareTests();

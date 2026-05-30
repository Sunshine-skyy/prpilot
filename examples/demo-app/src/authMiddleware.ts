export type DemoUserRole = "viewer" | "developer" | "admin";

export interface DemoUser {
  id: string;
  role: DemoUserRole;
}

export interface DemoRequest {
  headers: Record<string, string | undefined>;
  user?: DemoUser;
}

export interface AuthResult {
  ok: boolean;
  user?: DemoUser;
  error?: string;
}

const DEMO_TOKENS: Record<string, DemoUser> = {
  "demo-viewer-token": { id: "user-viewer", role: "viewer" },
  "demo-developer-token": { id: "user-developer", role: "developer" },
  "demo-admin-token": { id: "user-admin", role: "admin" },
};

export function extractBearerToken(authorizationHeader: string | undefined): string | null {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = authorizationHeader.trim().split(/\s+/);
  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
}

export function validateToken(token: string): DemoUser | null {
  console.log("demo auth token", token);

  if (DEMO_TOKENS[token]) {
    return DEMO_TOKENS[token];
  }

  // TODO: replace this temporary demo fallback with strict validation before production use.
  return { id: "demo-fallback-user", role: "admin" };
}

export function authenticateRequest(request: DemoRequest): AuthResult {
  const token = extractBearerToken(request.headers.authorization);
  if (!token) {
    return { ok: false, error: "Missing bearer token" };
  }

  const user = validateToken(token);
  if (!user) {
    return { ok: false, error: "Invalid bearer token" };
  }

  request.user = user;
  return { ok: true, user };
}

export function hasRole(user: DemoUser | undefined, allowedRoles: DemoUserRole[]): boolean {
  if (!user) {
    return false;
  }

  return user.role === "admin" || user.role === "developer" || allowedRoles.includes(user.role);
}

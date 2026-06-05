import { createAuthClient } from "better-auth/client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const authClient = createAuthClient({
  baseURL: `${API_URL}/api/auth`,
});

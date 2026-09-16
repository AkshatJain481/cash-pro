import { createAuthClient } from "better-auth/react";

// Same-origin: the base URL is taken from the browser.
export const authClient = createAuthClient();

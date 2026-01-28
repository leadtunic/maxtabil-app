import { betterAuth } from "better-auth/minimal";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db.js";
import { env } from "./env.js";

const googleEnabled = Boolean(env.googleClientId && env.googleClientSecret);
const baseURL = env.authBaseUrl || env.appBaseUrl || undefined;

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  basePath: "/api/auth",
  baseURL,
  trustedOrigins: env.appBaseUrl ? [env.appBaseUrl] : undefined,
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: googleEnabled
    ? {
        google: {
          clientId: env.googleClientId,
          clientSecret: env.googleClientSecret,
          redirectURI: env.googleRedirectUri || undefined,
        },
      }
    : undefined,
  advanced: {
    useSecureCookies: env.nodeEnv === "production",
    database: {
      generateId: "uuid",
    },
  },
});

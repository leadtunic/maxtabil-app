import { betterAuth } from "better-auth/minimal";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db/index.js";
import { env } from "./env.js";
import { assertEmailConfigured, sendEmail } from "./email.js";

const googleEnabled = Boolean(env.googleClientId && env.googleClientSecret);
const baseURL = env.authBaseUrl || env.appBaseUrl || undefined;

type VerificationPayload = {
  user: { email: string; name?: string | null };
  url: string;
  token: string;
};

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  basePath: "/api/auth",
  baseURL,
  trustedOrigins: env.appBaseUrl ? [env.appBaseUrl] : undefined,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async (payload: VerificationPayload) => {
      const { user, url } = payload;
      assertEmailConfigured();
      const subject = "Confirme seu e-mail";
      const text = `Olá${user.name ? ` ${user.name}` : ""},\n\nClique no link para confirmar seu e-mail:\n${url}\n\nSe você não solicitou, ignore este e-mail.`;
      const html = `
        <p>Olá${user.name ? ` ${user.name}` : ""},</p>
        <p>Clique no link abaixo para confirmar seu e-mail:</p>
        <p><a href="${url}">Confirmar e-mail</a></p>
        <p>Se você não solicitou, ignore este e-mail.</p>
      `;
      void sendEmail({ to: user.email, subject, text, html });
    },
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

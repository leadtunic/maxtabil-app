import Fastify, { type FastifyReply, type FastifyRequest } from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import path from "node:path";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { auth } from "./auth.js";
import { env } from "./env.js";
import { sql } from "./db/index.js";

type AuthUser = {
  id: string;
  email: string;
  name: string;
  image?: string | null;
  emailVerified?: boolean;
};

type AuthSession = {
  id: string;
  userId: string;
  expiresAt: string | Date;
};

type AuthSessionResponse = {
  session: AuthSession;
  user: AuthUser;
} | null;

const app = Fastify({ logger: true });

type JsonValue = string | number | boolean | null | { [key: string]: JsonValue } | JsonValue[];

const asJsonValue = (value: unknown): JsonValue => value as JsonValue;

const ABACATEPAY_PUBLIC_KEY =
  "t9dXRhHHo3yDEj5pVDYz0frf7q6bMKyMRmxxCPIPp3RCplBfXRxqlC6ZpiWmOqj4L63qEaeUOtrCI8P0VMUgo6iIga2ri9ogaHFs0WIIywSMg0q7RmBfybe1E5XJcfC4IW3alNqym0tXoAKkzvfEjZxV6bE0oG2zJrNNYmUCKZyV0KZ3JS8Votf9EAWWYdiDkMkpbMdPggfh1EqHlVkMiTady6jOR3hyzGEHrIz2Ret0xHKMbiqkr9HS1JhNHDX9";

const verifyAbacateSignature = (rawBody: string, signatureFromHeader: string) => {
  const bodyBuffer = Buffer.from(rawBody, "utf8");
  const expectedSig = crypto
    .createHmac("sha256", ABACATEPAY_PUBLIC_KEY)
    .update(bodyBuffer)
    .digest("base64");

  const a = Buffer.from(expectedSig);
  const b = Buffer.from(signatureFromHeader);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

const readMultipartFieldValue = (field: unknown): string | undefined => {
  if (!field) return undefined;
  if (Array.isArray(field)) {
    for (const item of field) {
      if (item && typeof item === "object" && "value" in item) {
        const value = (item as { value?: unknown }).value;
        if (typeof value === "string") return value;
      }
    }
    return undefined;
  }
  if (typeof field === "object" && "value" in field) {
    const value = (field as { value?: unknown }).value;
    return typeof value === "string" ? value : undefined;
  }
  return undefined;
};

const allowedOrigins = (() => {
  const origins = new Set<string>();

  if (env.appBaseUrl) {
    origins.add(env.appBaseUrl);
    try {
      const url = new URL(env.appBaseUrl);
      const hostname = url.hostname;
      if (hostname.startsWith("www.")) {
        origins.add(`${url.protocol}//${hostname.slice(4)}`);
      } else {
        origins.add(`${url.protocol}//www.${hostname}`);
      }
    } catch {
      // Ignore malformed URLs; rely on raw env value.
    }
  }

  if (env.nodeEnv !== "production") {
    origins.add("http://localhost:5173");
    origins.add("http://127.0.0.1:5173");
  }

  return origins.size ? Array.from(origins) : true;
})();

const isOriginAllowed = (origin?: string) => {
  if (!origin) return false;
  if (allowedOrigins === true) return true;
  return allowedOrigins.includes(origin);
};

const applyCorsHeaders = (reply: FastifyReply, origin?: string) => {
  if (!origin || !isOriginAllowed(origin)) return false;
  reply.raw.setHeader("Access-Control-Allow-Origin", origin);
  reply.raw.setHeader("Vary", "Origin");
  reply.raw.setHeader("Access-Control-Allow-Credentials", "true");
  reply.raw.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  reply.raw.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  return true;
};

app.addHook("onRequest", (request, reply, done) => {
  const origin = request.headers.origin;
  if (typeof origin === "string") {
    applyCorsHeaders(reply, origin);
  }
  done();
});

app.addContentTypeParser(
  "application/json",
  { parseAs: "string" },
  (request, body, done) => {
    const rawBody = Buffer.isBuffer(body) ? body.toString("utf8") : body;
    (request as FastifyRequest & { rawBody?: string }).rawBody = rawBody;
    if (!rawBody) {
      done(null, {});
      return;
    }
    try {
      done(null, JSON.parse(rawBody));
    } catch (error) {
      done(error as Error);
    }
  }
);

await app.register(cors, {
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
});

await app.register(multipart, {
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
});

const uploadsRoot = env.uploadsDir
  ? path.resolve(env.uploadsDir)
  : path.join(process.cwd(), "uploads");
const workspaceLogoRoot = path.join(uploadsRoot, "workspace-logos");
const homeRecadosRoot = path.join(uploadsRoot, "home-recados");
await fs.mkdir(workspaceLogoRoot, { recursive: true });
await fs.mkdir(homeRecadosRoot, { recursive: true });

await app.register(fastifyStatic, {
  root: uploadsRoot,
  prefix: "/api/storage/",
});

const imageExtensionByType: Record<string, string> = {
  "image/jpg": "jpg",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

const generateFileId = () => {
  if (typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

app.all("/api/auth/*", async (request, reply) => {
  const origin = request.headers.origin;
  applyCorsHeaders(reply, origin);

  const url = new URL(request.raw.url || "/api/auth", `https://${request.headers.host}`);
  const shouldProxySocialGet =
    request.method === "GET" && url.pathname.endsWith("/sign-in/social") && url.searchParams.has("provider");
  const headers = new Headers();
  for (const [key, value] of Object.entries(request.headers)) {
    if (typeof value === "string") {
      headers.set(key, value);
    } else if (Array.isArray(value)) {
      headers.set(key, value.join(","));
    }
  }

  let body: string | undefined;
  if (shouldProxySocialGet) {
    const payload = {
      provider: url.searchParams.get("provider") || "",
      callbackURL: url.searchParams.get("callbackURL") || undefined,
    };
    body = JSON.stringify(payload);
    if (!headers.has("content-type")) {
      headers.set("content-type", "application/json");
    }
  } else if (!["GET", "HEAD"].includes(request.method)) {
    if (typeof request.body === "string") {
      body = request.body;
    } else if (request.body && typeof request.body === "object") {
      body = JSON.stringify(request.body);
      if (!headers.has("content-type")) {
        headers.set("content-type", "application/json");
      }
    }
  }

  const authResponse = await auth.handler(
    new Request(url.toString(), {
      method: shouldProxySocialGet ? "POST" : request.method,
      headers,
      body,
    })
  );

  reply.status(authResponse.status);
  authResponse.headers.forEach((value, key) => {
    reply.header(key, value);
  });
  const buffer = Buffer.from(await authResponse.arrayBuffer());
  reply.send(buffer);
});

const getSessionFromRequest = async (request: FastifyRequest, reply: FastifyReply): Promise<AuthSessionResponse> => {
  try {
    const headers = Object.fromEntries(
      Object.entries(request.headers).map(([key, value]) => [
        key,
        Array.isArray(value) ? value.join(",") : value ?? "",
      ])
    );
    const result = await auth.api.getSession({
      headers,
      returnHeaders: true,
    });
    if (result?.headers) {
      result.headers.forEach((value: string, key: string) => {
        reply.header(key, value);
      });
    }
    return result?.response ?? null;
  } catch (error) {
    request.log.error({ error }, "Failed to read auth session");
    return null;
  }
};

const requireSession = async (request: FastifyRequest, reply: FastifyReply) => {
  const sessionData = await getSessionFromRequest(request, reply);
  if (!sessionData?.session || !sessionData.user) {
    reply.status(401).send({ error: "UNAUTHORIZED" });
    return null;
  }
  return sessionData;
};

function generateSlug(email: string): string {
  const base = email.split("@")[0]?.toLowerCase().replace(/[^a-z0-9]/g, "-") || "workspace";
  const suffix = Math.random().toString(36).substring(2, 8);
  return `${base}-${suffix}`;
}

const allowedRoles = new Set([
  "ADMIN",
  "FINANCEIRO",
  "DP",
  "FISCAL_CONTABIL",
  "LEGALIZACAO_CERT",
]);

const getWorkspaceForUser = async (userId: string) => {
  return (await sql`
    select *
    from workspaces
    where owner_user_id = ${userId}
    limit 1
  `)[0];
};

const ensureWorkspace = async (user: AuthUser) => {
  const email = user.email || "user@example.com";
  const displayName = user.name || email.split("@")[0] || "Usuário";
  let workspace = await getWorkspaceForUser(user.id);

  if (!workspace) {
    const slug = generateSlug(email);
    workspace = (await sql`
      insert into workspaces (owner_user_id, name, slug)
      values (${user.id}, ${displayName}, ${slug})
      returning *
    `)[0];

    if (workspace?.id) {
      await sql`
        insert into workspace_settings (workspace_id)
        values (${workspace.id})
        on conflict (workspace_id) do nothing
      `;
      await sql`
        insert into entitlements (workspace_id)
        values (${workspace.id})
        on conflict (workspace_id) do nothing
      `;
    }
  }

  return workspace ?? null;
};

const ensureWorkspaceSettings = async (workspaceId: string) => {
  let settings = (await sql`
    select *
    from workspace_settings
    where workspace_id = ${workspaceId}
    limit 1
  `)[0];

  if (!settings) {
    await sql`
      insert into workspace_settings (workspace_id)
      values (${workspaceId})
      on conflict (workspace_id) do nothing
    `;
    settings = (await sql`
      select *
      from workspace_settings
      where workspace_id = ${workspaceId}
      limit 1
    `)[0];
  }

  return settings ?? null;
};

const ensureEntitlement = async (workspaceId: string) => {
  let entitlement = (await sql`
    select *
    from entitlements
    where workspace_id = ${workspaceId}
    limit 1
  `)[0];

  if (!entitlement) {
    await sql`
      insert into entitlements (workspace_id)
      values (${workspaceId})
      on conflict (workspace_id) do nothing
    `;
    entitlement = (await sql`
      select *
      from entitlements
      where workspace_id = ${workspaceId}
      limit 1
    `)[0];
  }

  return entitlement ?? null;
};

const getWorkspaceBundle = async (user: AuthUser) => {
  const workspace = await ensureWorkspace(user);
  if (!workspace) return null;
  const settings = await ensureWorkspaceSettings(workspace.id);
  const entitlement = await ensureEntitlement(workspace.id);
  return { workspace, settings, entitlement };
};

app.get("/api/allowlist/check", async (request) => {
  const { email } = request.query as { email?: string };
  const normalizedEmail = email?.trim().toLowerCase() ?? "";
  if (!normalizedEmail) return { allowed: false };

  const rows = await sql`
    select 1
    from allowed_emails
    where lower(email) = ${normalizedEmail}
      and is_active = true
    limit 1
  `;

  return { allowed: rows.length > 0 };
});

app.get("/api/workspace/bootstrap", async (request, reply) => {
  const sessionData = await requireSession(request, reply);
  if (!sessionData) return;

  const bundle = await getWorkspaceBundle(sessionData.user);
  if (!bundle) {
    reply.status(500).send({ error: "WORKSPACE_CREATE_FAILED" });
    return;
  }

  return bundle;
});

app.get("/api/links", async (request, reply) => {
  const sessionData = await requireSession(request, reply);
  if (!sessionData) return;

  const workspace = await ensureWorkspace(sessionData.user);
  if (!workspace) {
    reply.status(500).send({ message: "WORKSPACE_CREATE_FAILED" });
    return;
  }

  const rows = await sql`
    select *
    from app_links
    where workspace_id = ${workspace.id} or workspace_id is null
    order by sort_order asc
  `;

  return rows;
});

app.post("/api/links", async (request, reply) => {
  const sessionData = await requireSession(request, reply);
  if (!sessionData) return;

  const body = request.body as {
    title?: string;
    url?: string;
    category?: string;
    sector?: string;
    isActive?: boolean;
    sortOrder?: number;
  };

  if (!body?.title || !body?.url || !body?.category || !body?.sector) {
    reply.status(400).send({ message: "Dados inválidos para o link." });
    return;
  }

  const workspace = await ensureWorkspace(sessionData.user);
  if (!workspace) {
    reply.status(500).send({ message: "WORKSPACE_CREATE_FAILED" });
    return;
  }

  const order = body.sortOrder ?? Number(
    (await sql`
      select coalesce(max(sort_order), 0) + 1 as next
      from app_links
      where workspace_id = ${workspace.id}
    `)[0]?.next ?? 1
  );

  const inserted = (await sql`
    insert into app_links (title, url, category, sector, is_active, sort_order, workspace_id)
    values (${body.title}, ${body.url}, ${body.category}, ${body.sector}, ${body.isActive ?? true}, ${order}, ${workspace.id})
    returning *
  `)[0];

  return inserted ?? null;
});

app.put("/api/links/:id", async (request, reply) => {
  const sessionData = await requireSession(request, reply);
  if (!sessionData) return;

  const { id } = request.params as { id?: string };
  if (!id) {
    reply.status(400).send({ message: "ID do link obrigatório." });
    return;
  }

  const body = request.body as {
    title?: string;
    url?: string;
    category?: string;
    sector?: string;
    isActive?: boolean;
    sortOrder?: number;
  };

  const workspace = await ensureWorkspace(sessionData.user);
  if (!workspace) {
    reply.status(500).send({ message: "WORKSPACE_CREATE_FAILED" });
    return;
  }

  const updated = (await sql`
    update app_links
    set
      title = ${body.title ?? sql`title`},
      url = ${body.url ?? sql`url`},
      category = ${body.category ?? sql`category`},
      sector = ${body.sector ?? sql`sector`},
      is_active = ${typeof body.isActive === "boolean" ? body.isActive : sql`is_active`},
      sort_order = ${typeof body.sortOrder === "number" ? body.sortOrder : sql`sort_order`},
      updated_at = ${new Date()}
    where id = ${id}
      and (workspace_id = ${workspace.id} or workspace_id is null)
    returning *
  `)[0];

  if (!updated) {
    reply.status(404).send({ message: "Link não encontrado." });
    return;
  }

  return updated;
});

app.delete("/api/links/:id", async (request, reply) => {
  const sessionData = await requireSession(request, reply);
  if (!sessionData) return;

  const { id } = request.params as { id?: string };
  if (!id) {
    reply.status(400).send({ message: "ID do link obrigatório." });
    return;
  }

  const workspace = await ensureWorkspace(sessionData.user);
  if (!workspace) {
    reply.status(500).send({ message: "WORKSPACE_CREATE_FAILED" });
    return;
  }

  const deleted = (await sql`
    delete from app_links
    where id = ${id}
      and (workspace_id = ${workspace.id} or workspace_id is null)
    returning id
  `)[0];

  if (!deleted) {
    reply.status(404).send({ message: "Link não encontrado." });
    return;
  }

  return { ok: true };
});

app.post("/api/links/:id/click", async (request, reply) => {
  const sessionData = await requireSession(request, reply);
  if (!sessionData) return;

  const { id } = request.params as { id?: string };
  if (!id) {
    reply.status(400).send({ message: "ID do link obrigatório." });
    return;
  }

  const workspace = await ensureWorkspace(sessionData.user);
  if (!workspace) {
    reply.status(500).send({ message: "WORKSPACE_CREATE_FAILED" });
    return;
  }

  const updated = (await sql`
    update app_links
    set clicks = clicks + 1
    where id = ${id}
      and (workspace_id = ${workspace.id} or workspace_id is null)
    returning clicks
  `)[0];

  if (!updated) {
    reply.status(404).send({ message: "Link não encontrado." });
    return;
  }

  return { ok: true };
});

app.get("/api/rulesets/active", async (request, reply) => {
  const sessionData = await requireSession(request, reply);
  if (!sessionData) return;

  const { simulatorKey } = request.query as { simulatorKey?: string };
  if (!simulatorKey) {
    reply.status(400).send({ message: "Simulator key obrigatório." });
    return;
  }

  const workspace = await ensureWorkspace(sessionData.user);
  if (!workspace) {
    reply.status(500).send({ message: "WORKSPACE_CREATE_FAILED" });
    return;
  }

  const ruleset = (await sql`
    select *
    from rulesets
    where simulator_key = ${simulatorKey}
      and is_active = true
      and (workspace_id = ${workspace.id} or workspace_id is null)
    limit 1
  `)[0];

  return { ruleset: ruleset ?? null };
});

app.get("/api/rulesets", async (request, reply) => {
  const sessionData = await requireSession(request, reply);
  if (!sessionData) return;

  const { simulatorKey } = request.query as { simulatorKey?: string };

  const workspace = await ensureWorkspace(sessionData.user);
  if (!workspace) {
    reply.status(500).send({ message: "WORKSPACE_CREATE_FAILED" });
    return;
  }

  const rows = simulatorKey
    ? await sql`
        select *
        from rulesets
        where simulator_key = ${simulatorKey}
          and (workspace_id = ${workspace.id} or workspace_id is null)
        order by version desc
      `
    : await sql`
        select *
        from rulesets
        where (workspace_id = ${workspace.id} or workspace_id is null)
        order by simulator_key asc, version desc
      `;

  return rows;
});

app.post("/api/rulesets", async (request, reply) => {
  const sessionData = await requireSession(request, reply);
  if (!sessionData) return;

  const body = request.body as {
    simulatorKey?: string;
    name?: string;
    version?: number;
    isActive?: boolean;
    payload?: Record<string, unknown>;
  };

  const name = body?.name?.trim();
  if (!body?.simulatorKey || !name || !body?.payload || typeof body.version !== "number") {
    reply.status(400).send({ message: "Payload inválido para ruleset." });
    return;
  }

  const workspace = await ensureWorkspace(sessionData.user);
  if (!workspace) {
    reply.status(500).send({ message: "WORKSPACE_CREATE_FAILED" });
    return;
  }

  const inserted = (await sql`
    insert into rulesets (simulator_key, name, version, is_active, payload, workspace_id, created_by)
    values (
      ${body.simulatorKey},
      ${name},
      ${body.version},
      ${body.isActive ?? false},
      ${sql.json(asJsonValue(body.payload))},
      ${workspace.id},
      ${sessionData.user.id}
    )
    returning *
  `)[0];

  return inserted ?? null;
});

app.put("/api/rulesets/:id", async (request, reply) => {
  const sessionData = await requireSession(request, reply);
  if (!sessionData) return;

  const { id } = request.params as { id?: string };
  if (!id) {
    reply.status(400).send({ message: "ID do ruleset obrigatório." });
    return;
  }

  const body = request.body as {
    name?: string;
    payload?: Record<string, unknown>;
  };

  if (!body?.payload) {
    reply.status(400).send({ message: "Payload inválido para ruleset." });
    return;
  }

  const name = body?.name?.trim();

  const workspace = await ensureWorkspace(sessionData.user);
  if (!workspace) {
    reply.status(500).send({ message: "WORKSPACE_CREATE_FAILED" });
    return;
  }

  const updated = (await sql`
    update rulesets
    set name = ${name ? name : sql`name`},
        payload = ${sql.json(asJsonValue(body.payload))},
        updated_at = ${new Date()}
    where id = ${id}
      and (workspace_id = ${workspace.id} or workspace_id is null)
    returning *
  `)[0];

  if (!updated) {
    reply.status(404).send({ message: "RuleSet não encontrado." });
    return;
  }

  return updated;
});

app.post("/api/rulesets/:id/activate", async (request, reply) => {
  const sessionData = await requireSession(request, reply);
  if (!sessionData) return;

  const { id } = request.params as { id?: string };
  if (!id) {
    reply.status(400).send({ message: "ID do ruleset obrigatório." });
    return;
  }

  const workspace = await ensureWorkspace(sessionData.user);
  if (!workspace) {
    reply.status(500).send({ message: "WORKSPACE_CREATE_FAILED" });
    return;
  }

  const target = (await sql`
    select id, simulator_key
    from rulesets
    where id = ${id}
      and (workspace_id = ${workspace.id} or workspace_id is null)
    limit 1
  `)[0];

  if (!target?.simulator_key) {
    reply.status(404).send({ message: "RuleSet não encontrado." });
    return;
  }

  const updatedAt = new Date();

  await sql`
    update rulesets
    set is_active = false,
        updated_at = ${updatedAt}
    where simulator_key = ${target.simulator_key}
      and (workspace_id = ${workspace.id} or workspace_id is null)
  `;

  const updated = (await sql`
    update rulesets
    set is_active = true,
        updated_at = ${updatedAt}
    where id = ${id}
    returning *
  `)[0];

  return updated ?? null;
});

app.get("/api/legal-docs", async (request, reply) => {
  const sessionData = await requireSession(request, reply);
  if (!sessionData) return;

  const workspace = await ensureWorkspace(sessionData.user);
  if (!workspace) {
    reply.status(500).send({ message: "WORKSPACE_CREATE_FAILED" });
    return;
  }

  const rows = await sql`
    select *
    from legal_docs
    where (workspace_id = ${workspace.id} or workspace_id is null)
    order by expiry_date asc
  `;

  return rows;
});

app.post("/api/legal-docs", async (request, reply) => {
  const sessionData = await requireSession(request, reply);
  if (!sessionData) return;

  const body = request.body as {
    client_name?: string;
    cnpj?: string | null;
    doc_type?: string;
    issue_date?: string | null;
    expiry_date?: string;
    notes?: string | null;
    attachment_url?: string | null;
  };

  const clientName = body?.client_name?.trim();
  if (!clientName || !body?.doc_type || !body?.expiry_date) {
    reply.status(400).send({ message: "Dados inválidos para documento." });
    return;
  }

  const workspace = await ensureWorkspace(sessionData.user);
  if (!workspace) {
    reply.status(500).send({ message: "WORKSPACE_CREATE_FAILED" });
    return;
  }

  const inserted = (await sql`
    insert into legal_docs (
      client_name,
      cnpj,
      doc_type,
      issue_date,
      expiry_date,
      notes,
      attachment_url,
      workspace_id
    )
    values (
      ${clientName},
      ${body.cnpj ?? null},
      ${body.doc_type},
      ${body.issue_date ?? null},
      ${body.expiry_date},
      ${body.notes ?? null},
      ${body.attachment_url ?? null},
      ${workspace.id}
    )
    returning *
  `)[0];

  return inserted ?? null;
});

app.put("/api/legal-docs/:id", async (request, reply) => {
  const sessionData = await requireSession(request, reply);
  if (!sessionData) return;

  const { id } = request.params as { id?: string };
  if (!id) {
    reply.status(400).send({ message: "ID do documento obrigatório." });
    return;
  }

  const body = request.body as {
    client_name?: string;
    cnpj?: string | null;
    doc_type?: string;
    issue_date?: string | null;
    expiry_date?: string;
    notes?: string | null;
    attachment_url?: string | null;
  };

  const clientName = body?.client_name?.trim();
  if (!clientName || !body?.doc_type || !body?.expiry_date) {
    reply.status(400).send({ message: "Dados inválidos para documento." });
    return;
  }

  const workspace = await ensureWorkspace(sessionData.user);
  if (!workspace) {
    reply.status(500).send({ message: "WORKSPACE_CREATE_FAILED" });
    return;
  }

  const updated = (await sql`
    update legal_docs
    set client_name = ${clientName},
        cnpj = ${body.cnpj ?? null},
        doc_type = ${body.doc_type},
        issue_date = ${body.issue_date ?? null},
        expiry_date = ${body.expiry_date},
        notes = ${body.notes ?? null},
        attachment_url = ${body.attachment_url ?? null},
        updated_at = ${new Date()}
    where id = ${id}
      and (workspace_id = ${workspace.id} or workspace_id is null)
    returning *
  `)[0];

  if (!updated) {
    reply.status(404).send({ message: "Documento não encontrado." });
    return;
  }

  return updated;
});

app.delete("/api/legal-docs/:id", async (request, reply) => {
  const sessionData = await requireSession(request, reply);
  if (!sessionData) return;

  const { id } = request.params as { id?: string };
  if (!id) {
    reply.status(400).send({ message: "ID do documento obrigatório." });
    return;
  }

  const workspace = await ensureWorkspace(sessionData.user);
  if (!workspace) {
    reply.status(500).send({ message: "WORKSPACE_CREATE_FAILED" });
    return;
  }

  const deleted = (await sql`
    delete from legal_docs
    where id = ${id}
      and (workspace_id = ${workspace.id} or workspace_id is null)
    returning id
  `)[0];

  if (!deleted) {
    reply.status(404).send({ message: "Documento não encontrado." });
    return;
  }

  return { ok: true };
});

app.get("/api/digital-certs", async (request, reply) => {
  const sessionData = await requireSession(request, reply);
  if (!sessionData) return;

  const workspace = await ensureWorkspace(sessionData.user);
  if (!workspace) {
    reply.status(500).send({ message: "WORKSPACE_CREATE_FAILED" });
    return;
  }

  const rows = await sql`
    select *
    from digital_certs
    where (workspace_id = ${workspace.id} or workspace_id is null)
    order by expiry_date asc
  `;

  return rows;
});

app.post("/api/digital-certs", async (request, reply) => {
  const sessionData = await requireSession(request, reply);
  if (!sessionData) return;

  const body = request.body as {
    client_name?: string;
    cnpj?: string | null;
    cert_type?: string;
    provider?: string | null;
    expiry_date?: string;
    notes?: string | null;
    attachment_url?: string | null;
  };

  const clientName = body?.client_name?.trim();
  if (!clientName || !body?.cert_type || !body?.expiry_date) {
    reply.status(400).send({ message: "Dados inválidos para certificado." });
    return;
  }

  const workspace = await ensureWorkspace(sessionData.user);
  if (!workspace) {
    reply.status(500).send({ message: "WORKSPACE_CREATE_FAILED" });
    return;
  }

  const inserted = (await sql`
    insert into digital_certs (
      client_name,
      cnpj,
      cert_type,
      provider,
      expiry_date,
      notes,
      attachment_url,
      workspace_id
    )
    values (
      ${clientName},
      ${body.cnpj ?? null},
      ${body.cert_type},
      ${body.provider ?? null},
      ${body.expiry_date},
      ${body.notes ?? null},
      ${body.attachment_url ?? null},
      ${workspace.id}
    )
    returning *
  `)[0];

  return inserted ?? null;
});

app.put("/api/digital-certs/:id", async (request, reply) => {
  const sessionData = await requireSession(request, reply);
  if (!sessionData) return;

  const { id } = request.params as { id?: string };
  if (!id) {
    reply.status(400).send({ message: "ID do certificado obrigatório." });
    return;
  }

  const body = request.body as {
    client_name?: string;
    cnpj?: string | null;
    cert_type?: string;
    provider?: string | null;
    expiry_date?: string;
    notes?: string | null;
    attachment_url?: string | null;
  };

  const clientName = body?.client_name?.trim();
  if (!clientName || !body?.cert_type || !body?.expiry_date) {
    reply.status(400).send({ message: "Dados inválidos para certificado." });
    return;
  }

  const workspace = await ensureWorkspace(sessionData.user);
  if (!workspace) {
    reply.status(500).send({ message: "WORKSPACE_CREATE_FAILED" });
    return;
  }

  const updated = (await sql`
    update digital_certs
    set client_name = ${clientName},
        cnpj = ${body.cnpj ?? null},
        cert_type = ${body.cert_type},
        provider = ${body.provider ?? null},
        expiry_date = ${body.expiry_date},
        notes = ${body.notes ?? null},
        attachment_url = ${body.attachment_url ?? null},
        updated_at = ${new Date()}
    where id = ${id}
      and (workspace_id = ${workspace.id} or workspace_id is null)
    returning *
  `)[0];

  if (!updated) {
    reply.status(404).send({ message: "Certificado não encontrado." });
    return;
  }

  return updated;
});

app.delete("/api/digital-certs/:id", async (request, reply) => {
  const sessionData = await requireSession(request, reply);
  if (!sessionData) return;

  const { id } = request.params as { id?: string };
  if (!id) {
    reply.status(400).send({ message: "ID do certificado obrigatório." });
    return;
  }

  const workspace = await ensureWorkspace(sessionData.user);
  if (!workspace) {
    reply.status(500).send({ message: "WORKSPACE_CREATE_FAILED" });
    return;
  }

  const deleted = (await sql`
    delete from digital_certs
    where id = ${id}
      and (workspace_id = ${workspace.id} or workspace_id is null)
    returning id
  `)[0];

  if (!deleted) {
    reply.status(404).send({ message: "Certificado não encontrado." });
    return;
  }

  return { ok: true };
});

app.get("/api/home-recados", async (request, reply) => {
  const sessionData = await requireSession(request, reply);
  if (!sessionData) return;

  const { limit } = request.query as { limit?: string };
  const requestedLimit = Number(limit ?? 3);
  const safeLimit = Number.isFinite(requestedLimit) ? requestedLimit : 3;
  const take = Math.min(Math.max(safeLimit, 1), 10);

  const rows = await sql`
    select id, title, image_path, created_at
    from home_recados
    where is_active = true
    order by sort_order asc, created_at desc
    limit ${take}
  `;

  return rows;
});

app.post("/api/home-recados", async (request, reply) => {
  const sessionData = await requireSession(request, reply);
  if (!sessionData) return;

  const file = await request.file();
  if (!file) {
    reply.status(400).send({ message: "Arquivo obrigatório." });
    return;
  }

  const extension = imageExtensionByType[file.mimetype];

  if (!extension) {
    reply.status(400).send({ message: "Formato de arquivo não suportado." });
    return;
  }

  const fileId = generateFileId();
  const fileName = `${fileId}.${extension}`;
  const relativePath = `home-recados/${fileName}`;
  const filePath = path.join(homeRecadosRoot, fileName);

  await pipeline(file.file, createWriteStream(filePath));

  const activeCountResult = (await sql`
    select count(*) as count
    from home_recados
    where is_active = true
  `)[0];
  const activeCount = Number(activeCountResult?.count ?? 0);
  if (activeCount >= 3) {
    await fs.rm(filePath, { force: true });
    reply.status(400).send({ message: "Limite de recados atingido." });
    return;
  }

  const nextOrder = Number(
    (await sql`
      select coalesce(max(sort_order), 0) + 1 as next
      from home_recados
    `)[0]?.next ?? 1
  );

  const providedTitle = readMultipartFieldValue(file.fields?.title)?.trim();
  const title = providedTitle || file.filename || `Recado ${nextOrder}`;

  let inserted;
  try {
    inserted = (await sql`
      insert into home_recados (title, image_path, sort_order, created_by)
      values (${title}, ${relativePath}, ${nextOrder}, ${sessionData.user.id})
      returning id, title, image_path, created_at
    `)[0];
  } catch (error) {
    await fs.rm(filePath, { force: true });
    throw error;
  }

  return inserted ?? null;
});

app.delete("/api/home-recados/:id", async (request, reply) => {
  const sessionData = await requireSession(request, reply);
  if (!sessionData) return;

  const { id } = request.params as { id?: string };
  if (!id) {
    reply.status(400).send({ message: "ID do recado obrigatório." });
    return;
  }

  const deleted = (await sql`
    delete from home_recados
    where id = ${id}
    returning image_path
  `)[0];

  if (!deleted) {
    reply.status(404).send({ message: "Recado não encontrado." });
    return;
  }

  if (deleted.image_path) {
    const targetPath = path.join(uploadsRoot, deleted.image_path);
    await fs.rm(targetPath, { force: true });
  }

  return { ok: true };
});

app.get("/api/bpo/clients", async (request, reply) => {
  const sessionData = await requireSession(request, reply);
  if (!sessionData) return;

  const { activeOnly } = request.query as { activeOnly?: string };

  const workspace = await ensureWorkspace(sessionData.user);
  if (!workspace) {
    reply.status(500).send({ message: "WORKSPACE_CREATE_FAILED" });
    return;
  }

  const rows = activeOnly === "true"
    ? await sql`
        select *
        from bpo_clients
        where workspace_id = ${workspace.id}
          and is_active = true
        order by name asc
      `
    : await sql`
        select *
        from bpo_clients
        where workspace_id = ${workspace.id}
        order by name asc
      `;

  return rows;
});

app.post("/api/bpo/clients", async (request, reply) => {
  const sessionData = await requireSession(request, reply);
  if (!sessionData) return;

  const body = request.body as {
    name?: string;
    document?: string | null;
    contact_name?: string | null;
    contact_email?: string | null;
    contact_phone?: string | null;
    notes?: string | null;
    is_active?: boolean;
  };

  const name = body?.name?.trim();
  if (!name) {
    reply.status(400).send({ message: "Nome do cliente obrigatório." });
    return;
  }

  const workspace = await ensureWorkspace(sessionData.user);
  if (!workspace) {
    reply.status(500).send({ message: "WORKSPACE_CREATE_FAILED" });
    return;
  }

  const inserted = (await sql`
    insert into bpo_clients (
      workspace_id,
      name,
      document,
      contact_name,
      contact_email,
      contact_phone,
      notes,
      is_active
    )
    values (
      ${workspace.id},
      ${name},
      ${body.document ?? null},
      ${body.contact_name ?? null},
      ${body.contact_email ?? null},
      ${body.contact_phone ?? null},
      ${body.notes ?? null},
      ${body.is_active ?? true}
    )
    returning *
  `)[0];

  return inserted ?? null;
});

app.put("/api/bpo/clients/:id", async (request, reply) => {
  const sessionData = await requireSession(request, reply);
  if (!sessionData) return;

  const { id } = request.params as { id?: string };
  if (!id) {
    reply.status(400).send({ message: "ID do cliente obrigatório." });
    return;
  }

  const body = request.body as {
    name?: string;
    document?: string | null;
    contact_name?: string | null;
    contact_email?: string | null;
    contact_phone?: string | null;
    notes?: string | null;
    is_active?: boolean;
  };

  const name = body?.name?.trim();
  if (!name) {
    reply.status(400).send({ message: "Nome do cliente obrigatório." });
    return;
  }

  const workspace = await ensureWorkspace(sessionData.user);
  if (!workspace) {
    reply.status(500).send({ message: "WORKSPACE_CREATE_FAILED" });
    return;
  }

  const updated = (await sql`
    update bpo_clients
    set name = ${name},
        document = ${body.document ?? null},
        contact_name = ${body.contact_name ?? null},
        contact_email = ${body.contact_email ?? null},
        contact_phone = ${body.contact_phone ?? null},
        notes = ${body.notes ?? null},
        is_active = ${body.is_active ?? true},
        updated_at = ${new Date()}
    where id = ${id}
      and workspace_id = ${workspace.id}
    returning *
  `)[0];

  if (!updated) {
    reply.status(404).send({ message: "Cliente não encontrado." });
    return;
  }

  return updated;
});

app.delete("/api/bpo/clients/:id", async (request, reply) => {
  const sessionData = await requireSession(request, reply);
  if (!sessionData) return;

  const { id } = request.params as { id?: string };
  if (!id) {
    reply.status(400).send({ message: "ID do cliente obrigatório." });
    return;
  }

  const workspace = await ensureWorkspace(sessionData.user);
  if (!workspace) {
    reply.status(500).send({ message: "WORKSPACE_CREATE_FAILED" });
    return;
  }

  const deleted = (await sql`
    delete from bpo_clients
    where id = ${id}
      and workspace_id = ${workspace.id}
    returning id
  `)[0];

  if (!deleted) {
    reply.status(404).send({ message: "Cliente não encontrado." });
    return;
  }

  return { ok: true };
});

app.get("/api/bpo/tasks", async (request, reply) => {
  const sessionData = await requireSession(request, reply);
  if (!sessionData) return;

  const workspace = await ensureWorkspace(sessionData.user);
  if (!workspace) {
    reply.status(500).send({ message: "WORKSPACE_CREATE_FAILED" });
    return;
  }

  const rows = await sql`
    select t.*, json_build_object('id', c.id, 'name', c.name) as bpo_clients
    from bpo_tasks t
    left join bpo_clients c on c.id = t.client_id
    where t.workspace_id = ${workspace.id}
    order by t.due_date asc nulls last
  `;

  return rows;
});

app.post("/api/bpo/tasks", async (request, reply) => {
  const sessionData = await requireSession(request, reply);
  if (!sessionData) return;

  const body = request.body as {
    client_id?: string;
    title?: string;
    description?: string | null;
    category?: string;
    status?: string;
    priority?: string;
    due_date?: string | null;
    assigned_to?: string | null;
  };

  const title = body?.title?.trim();
  if (!body?.client_id || !title || !body?.category) {
    reply.status(400).send({ message: "Dados inválidos para tarefa." });
    return;
  }

  const workspace = await ensureWorkspace(sessionData.user);
  if (!workspace) {
    reply.status(500).send({ message: "WORKSPACE_CREATE_FAILED" });
    return;
  }

  const client = (await sql`
    select id
    from bpo_clients
    where id = ${body.client_id}
      and workspace_id = ${workspace.id}
    limit 1
  `)[0];

  if (!client?.id) {
    reply.status(400).send({ message: "Cliente inválido." });
    return;
  }

  const status = body.status ?? "pendente";
  const completedAt = status === "concluido" ? new Date() : null;

  const inserted = (await sql`
    insert into bpo_tasks (
      workspace_id,
      client_id,
      title,
      description,
      category,
      status,
      priority,
      due_date,
      assigned_to,
      completed_at
    )
    values (
      ${workspace.id},
      ${body.client_id},
      ${title},
      ${body.description ?? null},
      ${body.category},
      ${status},
      ${body.priority ?? "media"},
      ${body.due_date ?? null},
      ${body.assigned_to ?? null},
      ${completedAt}
    )
    returning *
  `)[0];

  return inserted ?? null;
});

app.put("/api/bpo/tasks/:id", async (request, reply) => {
  const sessionData = await requireSession(request, reply);
  if (!sessionData) return;

  const { id } = request.params as { id?: string };
  if (!id) {
    reply.status(400).send({ message: "ID da tarefa obrigatório." });
    return;
  }

  const body = request.body as {
    client_id?: string;
    title?: string;
    description?: string | null;
    category?: string;
    status?: string;
    priority?: string;
    due_date?: string | null;
    assigned_to?: string | null;
  };

  const title = body?.title?.trim();
  if (!body?.client_id || !title || !body?.category) {
    reply.status(400).send({ message: "Dados inválidos para tarefa." });
    return;
  }

  const workspace = await ensureWorkspace(sessionData.user);
  if (!workspace) {
    reply.status(500).send({ message: "WORKSPACE_CREATE_FAILED" });
    return;
  }

  const client = (await sql`
    select id
    from bpo_clients
    where id = ${body.client_id}
      and workspace_id = ${workspace.id}
    limit 1
  `)[0];

  if (!client?.id) {
    reply.status(400).send({ message: "Cliente inválido." });
    return;
  }

  const status = body.status ?? "pendente";
  const completedAt = status === "concluido" ? new Date() : null;

  const updated = (await sql`
    update bpo_tasks
    set client_id = ${body.client_id},
        title = ${title},
        description = ${body.description ?? null},
        category = ${body.category},
        status = ${status},
        priority = ${body.priority ?? "media"},
        due_date = ${body.due_date ?? null},
        assigned_to = ${body.assigned_to ?? null},
        completed_at = ${completedAt},
        updated_at = ${new Date()}
    where id = ${id}
      and workspace_id = ${workspace.id}
    returning *
  `)[0];

  if (!updated) {
    reply.status(404).send({ message: "Tarefa não encontrada." });
    return;
  }

  return updated;
});

app.delete("/api/bpo/tasks/:id", async (request, reply) => {
  const sessionData = await requireSession(request, reply);
  if (!sessionData) return;

  const { id } = request.params as { id?: string };
  if (!id) {
    reply.status(400).send({ message: "ID da tarefa obrigatório." });
    return;
  }

  const workspace = await ensureWorkspace(sessionData.user);
  if (!workspace) {
    reply.status(500).send({ message: "WORKSPACE_CREATE_FAILED" });
    return;
  }

  const deleted = (await sql`
    delete from bpo_tasks
    where id = ${id}
      and workspace_id = ${workspace.id}
    returning id
  `)[0];

  if (!deleted) {
    reply.status(404).send({ message: "Tarefa não encontrada." });
    return;
  }

  return { ok: true };
});

app.post("/api/bpo/tasks/:id/complete", async (request, reply) => {
  const sessionData = await requireSession(request, reply);
  if (!sessionData) return;

  const { id } = request.params as { id?: string };
  if (!id) {
    reply.status(400).send({ message: "ID da tarefa obrigatório." });
    return;
  }

  const workspace = await ensureWorkspace(sessionData.user);
  if (!workspace) {
    reply.status(500).send({ message: "WORKSPACE_CREATE_FAILED" });
    return;
  }

  const updated = (await sql`
    update bpo_tasks
    set status = ${"concluido"},
        completed_at = ${new Date()},
        updated_at = ${new Date()}
    where id = ${id}
      and workspace_id = ${workspace.id}
    returning id
  `)[0];

  if (!updated) {
    reply.status(404).send({ message: "Tarefa não encontrada." });
    return;
  }

  return { ok: true };
});

app.get("/api/bpo/summary", async (request, reply) => {
  const sessionData = await requireSession(request, reply);
  if (!sessionData) return;

  const workspace = await ensureWorkspace(sessionData.user);
  if (!workspace) {
    reply.status(500).send({ message: "WORKSPACE_CREATE_FAILED" });
    return;
  }

  const clients = (await sql`
    select is_active
    from bpo_clients
    where workspace_id = ${workspace.id}
  `) as Array<{ is_active: boolean }>;

  const tasks = (await sql`
    select status, due_date, completed_at
    from bpo_tasks
    where workspace_id = ${workspace.id}
  `) as Array<{ status: string; due_date: string | null; completed_at: string | null }>;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const totalClients = clients.length;
  const activeClients = clients.filter((client) => client.is_active).length;
  const totalTasks = tasks.length;
  const pendingTasks = tasks.filter((task) => task.status === "pendente").length;
  const completedTasks = tasks.filter((task) => task.status === "concluido").length;
  const overdueTasks = tasks.filter(
    (task) => task.status !== "concluido" && task.due_date && new Date(task.due_date) < now
  ).length;
  const tasksCompletedThisMonth = tasks.filter(
    (task) => task.status === "concluido" && task.completed_at && new Date(task.completed_at) >= startOfMonth
  ).length;

  return {
    totalClients,
    activeClients,
    totalTasks,
    pendingTasks,
    completedTasks,
    overdueTasks,
    tasksCompletedThisMonth,
  };
});

app.get("/api/admin/users", async (request, reply) => {
  const sessionData = await requireSession(request, reply);
  if (!sessionData) return;

  const query = request.query as {
    search?: string;
    status?: string;
    page?: string;
    pageSize?: string;
  };

  const search = query.search?.trim();
  const status = query.status?.trim() ?? "ALL";
  const requestedPage = Number(query.page ?? 1);
  const requestedPageSize = Number(query.pageSize ?? 10);
  const page = Number.isFinite(requestedPage) ? Math.max(requestedPage, 1) : 1;
  const pageSize = Number.isFinite(requestedPageSize)
    ? Math.min(Math.max(requestedPageSize, 1), 100)
    : 10;
  const offset = (page - 1) * pageSize;

  const filters: string[] = [];
  const values: Array<string | number | boolean> = [];

  if (search) {
    values.push(`%${search}%`, `%${search}%`);
    filters.push(
      `(email ilike $${values.length - 1} or display_name ilike $${values.length})`
    );
  }
  if (status === "ACTIVE") {
    values.push(true);
    filters.push(`is_active = $${values.length}`);
  }
  if (status === "DISABLED") {
    values.push(false);
    filters.push(`is_active = $${values.length}`);
  }

  const whereClause = filters.length ? `where ${filters.join(" and ")}` : "";

  values.push(pageSize, offset);
  const rows = await sql.unsafe(
    `select * from profiles ${whereClause} order by created_at desc limit $${
      values.length - 1
    } offset $${values.length}`,
    values
  );

  const countResult = await sql.unsafe(
    `select count(*) as count from profiles ${whereClause}`,
    values.slice(0, values.length - 2)
  );

  const countValue = countResult?.[0]?.count ?? 0;
  const count = typeof countValue === "string" ? Number(countValue) : Number(countValue);

  return { rows, count };
});

app.post("/api/admin/users", async (request, reply) => {
  const sessionData = await requireSession(request, reply);
  if (!sessionData) return;

  const body = request.body as {
    email?: string;
    password?: string;
    display_name?: string;
    role?: string;
  };

  const email = body?.email?.trim().toLowerCase();
  const displayName = body?.display_name?.trim();
  const password = body?.password;
  const role = body?.role?.trim();

  if (!email || !displayName || !password || !role) {
    reply.status(400).send({ message: "Dados inválidos para usuário." });
    return;
  }

  if (!allowedRoles.has(role)) {
    reply.status(400).send({ message: "Perfil inválido." });
    return;
  }

  const authContext = await auth.$context;
  const existingUser = await authContext.internalAdapter.findUserByEmail(email);
  if (existingUser?.user) {
    reply.status(400).send({ message: "Usuário já existe." });
    return;
  }

  const existingProfile = (await sql`
    select user_id
    from profiles
    where lower(email) = ${email}
    limit 1
  `)[0];

  if (existingProfile?.user_id) {
    reply.status(400).send({ message: "E-mail já cadastrado." });
    return;
  }

  const createdUser = await authContext.internalAdapter.createUser({
    email,
    name: displayName,
    emailVerified: true,
  });

  if (!createdUser?.id) {
    reply.status(500).send({ message: "Falha ao criar usuário." });
    return;
  }

  const hashedPassword = await authContext.password.hash(password);
  try {
    await authContext.internalAdapter.linkAccount({
      accountId: createdUser.id,
      providerId: "credential",
      password: hashedPassword,
      userId: createdUser.id,
    });

    await sql`
      insert into profiles (
        user_id,
        email,
        display_name,
        role,
        is_active,
        must_change_password,
        created_by
      )
      values (
        ${createdUser.id},
        ${email},
        ${displayName},
        ${role},
        ${true},
        ${true},
        ${sessionData.user.id}
      )
    `;
  } catch (error) {
    await authContext.internalAdapter.deleteUser(createdUser.id);
    throw error;
  }

  await sql`
    insert into audit_logs (
      workspace_id,
      actor_user_id,
      actor_email,
      action,
      entity_type,
      entity_id,
      metadata
    )
    values (
      ${null},
      ${sessionData.user.id},
      ${sessionData.user.email},
      ${"USER_CREATED"},
      ${"profiles"},
      ${createdUser.id},
      ${sql.json(asJsonValue({ email, role }))} 
    )
  `;

  return { userId: createdUser.id };
});

app.post("/api/admin/users/:id/reset-password", async (request, reply) => {
  const sessionData = await requireSession(request, reply);
  if (!sessionData) return;

  const { id } = request.params as { id?: string };
  if (!id) {
    reply.status(400).send({ message: "ID do usuário obrigatório." });
    return;
  }

  const body = request.body as { new_password?: string };
  const newPassword = body?.new_password;

  if (!newPassword) {
    reply.status(400).send({ message: "Senha obrigatória." });
    return;
  }

  const authContext = await auth.$context;
  const targetUser = await authContext.internalAdapter.findUserById(id);
  if (!targetUser) {
    reply.status(404).send({ message: "Usuário não encontrado." });
    return;
  }
  const hashedPassword = await authContext.password.hash(newPassword);
  await authContext.internalAdapter.updatePassword(id, hashedPassword);

  await sql`
    update profiles
    set must_change_password = ${true},
        updated_at = ${new Date()}
    where user_id = ${id}
  `;

  await sql`
    insert into audit_logs (
      workspace_id,
      actor_user_id,
      actor_email,
      action,
      entity_type,
      entity_id,
      metadata
    )
    values (
      ${null},
      ${sessionData.user.id},
      ${sessionData.user.email},
      ${"USER_PASSWORD_RESET"},
      ${"profiles"},
      ${id},
      ${sql.json(asJsonValue({}))}
    )
  `;

  return { ok: true };
});

app.post("/api/admin/users/:id/disable", async (request, reply) => {
  const sessionData = await requireSession(request, reply);
  if (!sessionData) return;

  const { id } = request.params as { id?: string };
  if (!id) {
    reply.status(400).send({ message: "ID do usuário obrigatório." });
    return;
  }

  const disabled = (await sql`
    update profiles
    set is_active = ${false},
        updated_at = ${new Date()}
    where user_id = ${id}
    returning user_id
  `)[0];

  if (!disabled) {
    reply.status(404).send({ message: "Usuário não encontrado." });
    return;
  }

  const authContext = await auth.$context;
  await authContext.internalAdapter.deleteSessions(id);

  await sql`
    insert into audit_logs (
      workspace_id,
      actor_user_id,
      actor_email,
      action,
      entity_type,
      entity_id,
      metadata
    )
    values (
      ${null},
      ${sessionData.user.id},
      ${sessionData.user.email},
      ${"USER_DISABLED"},
      ${"profiles"},
      ${id},
      ${sql.json(asJsonValue({}))}
    )
  `;

  return { ok: true };
});

app.post("/api/admin/users/:id/enable", async (request, reply) => {
  const sessionData = await requireSession(request, reply);
  if (!sessionData) return;

  const { id } = request.params as { id?: string };
  if (!id) {
    reply.status(400).send({ message: "ID do usuário obrigatório." });
    return;
  }

  const enabled = (await sql`
    update profiles
    set is_active = ${true},
        updated_at = ${new Date()}
    where user_id = ${id}
    returning user_id
  `)[0];

  if (!enabled) {
    reply.status(404).send({ message: "Usuário não encontrado." });
    return;
  }

  await sql`
    insert into audit_logs (
      workspace_id,
      actor_user_id,
      actor_email,
      action,
      entity_type,
      entity_id,
      metadata
    )
    values (
      ${null},
      ${sessionData.user.id},
      ${sessionData.user.email},
      ${"USER_ENABLED"},
      ${"profiles"},
      ${id},
      ${sql.json(asJsonValue({}))}
    )
  `;

  return { ok: true };
});

app.delete("/api/admin/users/:id", async (request, reply) => {
  const sessionData = await requireSession(request, reply);
  if (!sessionData) return;

  const { id } = request.params as { id?: string };
  if (!id) {
    reply.status(400).send({ message: "ID do usuário obrigatório." });
    return;
  }

  const authContext = await auth.$context;
  const targetUser = await authContext.internalAdapter.findUserById(id);
  if (!targetUser) {
    reply.status(404).send({ message: "Usuário não encontrado." });
    return;
  }
  await authContext.internalAdapter.deleteUser(id);

  await sql`
    delete from profiles
    where user_id = ${id}
  `;

  await sql`
    insert into audit_logs (
      workspace_id,
      actor_user_id,
      actor_email,
      action,
      entity_type,
      entity_id,
      metadata
    )
    values (
      ${null},
      ${sessionData.user.id},
      ${sessionData.user.email},
      ${"USER_DELETED"},
      ${"profiles"},
      ${id},
      ${sql.json(asJsonValue({}))}
    )
  `;

  return { ok: true };
});

app.post("/api/storage/workspace-logos", async (request, reply) => {
  const sessionData = await requireSession(request, reply);
  if (!sessionData) return;

  const bundle = await getWorkspaceBundle(sessionData.user);
  if (!bundle?.workspace) {
    reply.status(500).send({ message: "WORKSPACE_CREATE_FAILED" });
    return;
  }

  const file = await request.file();
  if (!file) {
    reply.status(400).send({ message: "Arquivo obrigatório." });
    return;
  }

  const extension = imageExtensionByType[file.mimetype];

  if (!extension) {
    reply.status(400).send({ message: "Formato de arquivo não suportado." });
    return;
  }

  const fileName = `logo-${generateFileId()}.${extension}`;
  const relativePath = `${bundle.workspace.id}/${fileName}`;
  const targetDir = path.join(workspaceLogoRoot, bundle.workspace.id);
  await fs.mkdir(targetDir, { recursive: true });
  const filePath = path.join(targetDir, fileName);

  await pipeline(file.file, createWriteStream(filePath));

  return { path: relativePath };
});

app.put("/api/workspace", async (request, reply) => {
  const sessionData = await requireSession(request, reply);
  if (!sessionData) return;

  const body = (request.body || {}) as { name?: unknown; logoPath?: unknown };
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const logoPath = typeof body.logoPath === "string" ? body.logoPath : null;

  if (!name) {
    reply.status(400).send({ message: "Nome do workspace é obrigatório." });
    return;
  }

  const workspace = await ensureWorkspace(sessionData.user);
  if (!workspace) {
    reply.status(500).send({ message: "WORKSPACE_CREATE_FAILED" });
    return;
  }

  try {
    const updatedAt = new Date().toISOString();
    let updated;

    if (logoPath) {
      updated = (await sql`
        update workspaces
        set name = ${name},
            logo_path = ${logoPath},
            updated_at = ${updatedAt}
        where id = ${workspace.id}
        returning *
      `)[0];
    } else {
      updated = (await sql`
        update workspaces
        set name = ${name},
            updated_at = ${updatedAt}
        where id = ${workspace.id}
        returning *
      `)[0];
    }

    return updated ?? workspace;
  } catch (error) {
    request.log.error({ error }, "Failed to update workspace");
    reply.status(500).send({ message: "WORKSPACE_UPDATE_FAILED" });
  }
});

app.put("/api/workspace/settings", async (request, reply) => {
  const sessionData = await requireSession(request, reply);
  if (!sessionData) return;

  const body = request.body as {
    enabledModules?: Record<string, boolean>;
    completedOnboarding?: boolean;
  };

  if (!body?.enabledModules) {
    reply.status(400).send({ message: "Configurações inválidas." });
    return;
  }

  const workspace = await ensureWorkspace(sessionData.user);
  if (!workspace) {
    reply.status(500).send({ message: "WORKSPACE_CREATE_FAILED" });
    return;
  }

  const normalizedModules = Object.fromEntries(
    Object.entries(body.enabledModules).map(([key, value]) => [key, Boolean(value)])
  );
  const enabledModulesJson = JSON.stringify(normalizedModules);
  const updatedAt = new Date().toISOString();
  const completedOnboarding = Boolean(body.completedOnboarding);
  const settings = (await sql`
    insert into workspace_settings (workspace_id, enabled_modules, completed_onboarding, updated_at)
    values (${workspace.id}, ${enabledModulesJson}, ${completedOnboarding}, ${updatedAt})
    on conflict (workspace_id) do update set
      enabled_modules = excluded.enabled_modules,
      completed_onboarding = excluded.completed_onboarding,
      updated_at = excluded.updated_at
    returning *
  `)[0];

  return settings ?? null;
});

app.post("/api/billing/lifetime", async (request, reply) => {
  const sessionData = await requireSession(request, reply);
  if (!sessionData) return;

  const body = request.body as { cellphone?: string; taxId?: string } | undefined;

  if (!env.abacatePayApiKey) {
    reply.status(500).send({ message: "ABACATEPAY_API_KEY não configurado." });
    return;
  }

  if (!env.appBaseUrl) {
    reply.status(500).send({ message: "APP_BASE_URL não configurado." });
    return;
  }

  const customerCellphone = body?.cellphone?.trim() || env.abacatePayCustomerPhone;
  if (!customerCellphone) {
    reply.status(500).send({ message: "ABACATEPAY_CUSTOMER_PHONE não configurado." });
    return;
  }

  const customerTaxId = body?.taxId?.trim() || env.abacatePayCustomerTaxId;
  if (!customerTaxId) {
    reply.status(500).send({ message: "ABACATEPAY_CUSTOMER_TAX_ID não configurado." });
    return;
  }

  const workspace = await ensureWorkspace(sessionData.user);
  if (!workspace) {
    reply.status(500).send({ message: "WORKSPACE_CREATE_FAILED" });
    return;
  }

  const rawWorkspaceId = String(workspace.id);
  const entitlement = await ensureEntitlement(rawWorkspaceId);
  if (entitlement?.lifetime_access) {
    reply.status(400).send({ message: "Acesso vitalício já está ativo." });
    return;
  }

  const toDbValue = (value: unknown) => {
    if (value == null) return null;
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  const workspaceId = toDbValue(rawWorkspaceId);
  const userId = toDbValue(sessionData.user.id);
  const userEmail = sessionData.user.email ? toDbValue(sessionData.user.email) : null;
  const externalId = `${workspaceId ?? "unknown"}:${userId ?? "unknown"}:${Date.now()}`;
  const payload = {
    frequency: "ONE_TIME",
    methods: ["PIX"],
    products: [
      {
        externalId: "lifetime",
        name: "Acesso Vitalício - Painel de Gestão",
        description: "Acesso vitalício ao painel de gestão com todos os módulos",
        quantity: 1,
        price: 99700,
      },
    ],
    returnUrl: `${env.appBaseUrl}/paywall`,
    completionUrl: `${env.appBaseUrl}/billing/completed`,
    customer: {
      name: sessionData.user.name || sessionData.user.email?.split("@")[0] || "Cliente",
      email: sessionData.user.email,
      cellphone: customerCellphone,
      taxId: customerTaxId,
    },
    externalId,
    metadata: {
      workspace_id: rawWorkspaceId,
      user_id: String(sessionData.user.id),
    },
  };

  const abacateResponse = await fetch("https://api.abacatepay.com/v1/billing/create", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.abacatePayApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!abacateResponse.ok) {
    const errorText = await abacateResponse.text().catch(() => "");
    request.log.error({ errorText }, "AbacatePay error");
    reply.status(500).send({ message: "Falha ao criar cobrança." });
    return;
  }

  const billingResult = (await abacateResponse.json().catch(() => null)) as
    | {
        id?: string;
        url?: string;
        data?: {
          id?: string;
          url?: string;
          paymentUrl?: string;
        };
      }
    | null;
  const billingIdRaw = billingResult?.data?.id || billingResult?.id || null;
  const paymentUrlRaw =
    billingResult?.data?.url || billingResult?.url || billingResult?.data?.paymentUrl;
  const billingId = toDbValue(billingIdRaw);
  const paymentUrl =
    typeof paymentUrlRaw === "string" || typeof paymentUrlRaw === "number"
      ? String(paymentUrlRaw)
      : undefined;

  const entitlementUpdatedAt = new Date().toISOString();
  const workspaceIdText = workspaceId == null ? null : String(workspaceId);
  const billingIdText = billingId == null ? null : String(billingId);
  const statusText = "PENDING";
  try {
    await sql`
      insert into entitlements (workspace_id, lifetime_access, abacate_billing_id, abacate_status, updated_at)
      values (${workspaceIdText}, false, ${billingIdText}, ${statusText}, ${entitlementUpdatedAt})
      on conflict (workspace_id) do update set
        abacate_billing_id = excluded.abacate_billing_id,
        abacate_status = excluded.abacate_status,
        updated_at = excluded.updated_at
    `;

    const checkoutMetadata = JSON.stringify({ external_id: externalId, price_cents: 99700 });
    await sql`
      insert into audit_logs (
        workspace_id,
        actor_user_id,
        actor_email,
        action,
        entity_type,
        entity_id,
        metadata
      )
      values (
        ${workspaceId},
        ${userId},
        ${userEmail},
        ${"CHECKOUT_STARTED"},
        ${"billing"},
        ${billingId},
        ${checkoutMetadata}::jsonb
      )
    `;
  } catch (error) {
    request.log.error(
      {
        error,
        checkoutParams: {
          workspaceIdType: typeof workspaceId,
          userIdType: typeof userId,
          userEmailType: typeof userEmail,
          billingIdType: typeof billingId,
          workspaceIdIsObject: typeof workspaceId === "object",
          userIdIsObject: typeof userId === "object",
          userEmailIsObject: typeof userEmail === "object",
          billingIdIsObject: typeof billingId === "object",
        },
      },
      "Checkout persistence failed"
    );
    throw error;
  }

  return {
    billingId,
    paymentUrl,
  };
});

app.post("/api/webhooks/abacatepay", async (request, reply) => {
  const webhookSecret = (request.query as { webhookSecret?: string }).webhookSecret;
  if (!env.abacatePayWebhookSecret || webhookSecret !== env.abacatePayWebhookSecret) {
    reply.status(401).send({ error: "Invalid webhook secret" });
    return;
  }

  const signature = request.headers["x-webhook-signature"];
  if (typeof signature !== "string") {
    reply.status(401).send({ error: "Missing webhook signature" });
    return;
  }

  const rawBody = (request as FastifyRequest & { rawBody?: string }).rawBody ?? "";
  if (!rawBody || !verifyAbacateSignature(rawBody, signature)) {
    reply.status(401).send({ error: "Invalid webhook signature" });
    return;
  }

  const payload = request.body as {
    id?: string;
    event?: string;
    devMode?: boolean;
    data?: {
      billing?: {
        id?: string;
        status?: string;
        paidAmount?: number;
      };
      payment?: {
        amount?: number;
        method?: string;
      };
    };
  };

  if (payload?.event === "billing.paid") {
    const billingId = payload.data?.billing?.id ?? null;
    const status = payload.data?.billing?.status ?? "PAID";
    const paidAmount = payload.data?.billing?.paidAmount ?? payload.data?.payment?.amount ?? null;
    const updatedAt = new Date().toISOString();

    if (billingId) {
      const updated = (await sql`
        update entitlements
        set lifetime_access = true,
            abacate_status = ${status},
            lifetime_paid_at = ${updatedAt},
            updated_at = ${updatedAt}
        where abacate_billing_id = ${billingId}
        returning workspace_id
      `)[0];

      if (updated?.workspace_id) {
        await sql`
          insert into audit_logs (
            workspace_id,
            actor_user_id,
            actor_email,
            action,
            entity_type,
            entity_id,
            metadata
          )
          values (
            ${updated.workspace_id},
            ${null},
            ${null},
            ${"CHECKOUT_PAID"},
            ${"billing"},
            ${billingId},
            ${sql.json(asJsonValue({ event_id: payload.id ?? null, amount_cents: paidAmount }))}
          )
        `;
      }
    }
  }

  return { received: true };
});

app.post("/api/audit", async (request, reply) => {
  const sessionData = await requireSession(request, reply);
  if (!sessionData) return;

  const body = request.body as {
    action?: string;
    entityType?: string;
    entityId?: string | null;
    metadata?: Record<string, unknown>;
    workspaceId?: string | null;
  };

  if (!body?.action || !body?.entityType) {
    reply.status(400).send({ error: "INVALID_PAYLOAD" });
    return;
  }

  await sql`
    insert into audit_logs (
      workspace_id,
      actor_user_id,
      actor_email,
      action,
      entity_type,
      entity_id,
      metadata
    )
    values (
      ${body.workspaceId ?? null},
      ${sessionData.user.id},
      ${sessionData.user.email ?? null},
      ${body.action},
      ${body.entityType},
      ${body.entityId ?? null},
      ${sql.json(asJsonValue(body.metadata ?? {}))}
    )
  `;

  return { ok: true };
});

app.get("/api/audit/logs", async (request, reply) => {
  const sessionData = await requireSession(request, reply);
  if (!sessionData) return;

  const workspace = await ensureWorkspace(sessionData.user);
  if (!workspace) {
    reply.status(500).send({ message: "WORKSPACE_CREATE_FAILED" });
    return;
  }

  const query = request.query as {
    search?: string;
    action?: string;
    entity?: string;
    page?: string;
    pageSize?: string;
  };

  const search = query.search?.trim();
  const action = query.action?.trim();
  const entity = query.entity?.trim();
  const page = Math.max(Number(query.page ?? 1), 1);
  const pageSize = Math.min(Math.max(Number(query.pageSize ?? 15), 1), 100);
  const offset = (page - 1) * pageSize;

  const filters: string[] = [
    "workspace_id = $1",
    "created_at >= now() - interval '30 days'",
  ];
  const values: Array<string | number> = [workspace.id];

  if (search) {
    values.push(`%${search}%`, `%${search}%`);
    filters.push(
      `(actor_email ilike $${values.length - 1} or entity_id ilike $${values.length})`
    );
  }
  if (action && action !== "ALL") {
    values.push(action);
    filters.push(`action = $${values.length}`);
  }
  if (entity && entity !== "ALL") {
    values.push(entity);
    filters.push(`entity_type = $${values.length}`);
  }

  values.push(pageSize, offset);
  const whereClause = `where ${filters.join(" and ")}`;

  const rows = await sql.unsafe(
    `select * from audit_logs ${whereClause} order by created_at desc limit $${
      values.length - 1
    } offset $${values.length}`,
    values
  );

  const countResult = await sql.unsafe(
    `select count(*) as count from audit_logs ${whereClause}`,
    values.slice(0, values.length - 2)
  );

  const countValue = countResult?.[0]?.count ?? 0;
  const count = typeof countValue === "string" ? Number(countValue) : Number(countValue);

  return { rows, count };
});

app.get("/healthz", async () => ({ ok: true }));

const start = async () => {
  try {
    const host = "0.0.0.0";
    const port = env.port;
    await app.listen({ port, host });
    app.log.info(`API on http://${host}:${port}`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

start();

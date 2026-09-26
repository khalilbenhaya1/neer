import { randomUUID } from "node:crypto";
import express, {
  type ErrorRequestHandler,
  type Express,
  type Request,
  type RequestHandler,
} from "express";
import {
  createOpaqueToken,
  createResetToken,
  decryptProviderCredential,
  encryptProviderCredential,
  hashOpaqueToken,
  hashPassword,
  verifyPassword,
} from "./crypto.js";
import { SaasRateLimiter } from "./rate-limit.js";
import { isProviderId, normalizeProviderCredential, validateProviderCredential } from "./providers.js";
import type {
  ProviderId,
  ProviderStatus,
  PublicProviderConnection,
  SafeLogger,
  SaasRepository,
  SaaSSession,
} from "./types.js";

const SESSION_COOKIE = "neer_saas_session";
const DUMMY_PASSWORD_HASH =
  "scrypt$32768$8$1$AAAAAAAAAAAAAAAAAAAAAA$xWmXfut2ustDyVPQzqykCmaZqBVBdKOGpntVRcDm6XKyj4jgbibm0TzVmOh2KasdqKNfLZAcMqBX9HxDD6r4tw";
const RESET_TOKEN_TTL_MS = 20 * 60 * 1000;
const SESSION_TITLE_MAX = 120;

export type SaasApiConfig = {
  publicOrigin: string;
  secureCookies: boolean;
  sessionTtlSeconds: number;
  credentialEncryptionKeys: ReadonlyMap<number, Buffer>;
  activeCredentialKeyVersion: number;
  trustProxy: string | number | false;
};

export type PasswordResetMailer = (params: { email: string; token: string }) => Promise<void>;
export type ModelValidator = (provider: ProviderId, modelId: string, userId: string) => boolean;
export type DeleteAgentSessionFiles = (userId: string, sessionId: string) => Promise<void>;

export type CreateSaasApiParams = {
  config: SaasApiConfig;
  repository: SaasRepository;
  runAgent?: import("./types.js").RunSaasAgent;
  validateCredential?: typeof validateProviderCredential;
  validateModel?: ModelValidator;
  passwordResetMailer?: PasswordResetMailer;
  deleteAgentSessionFiles?: DeleteAgentSessionFiles;
  logger?: SafeLogger;
  now?: () => Date;
};

type Principal = {
  userId: string;
  email: string;
  sessionId: string;
  sessionExpiresAt: Date;
};

type RequestWithPrincipal = Request & { principal?: Principal };
type SafeApiError = Error & { status: number; code: string; safeMessage: string };

function apiError(status: number, code: string, safeMessage: string): SafeApiError {
  return Object.assign(new Error(code), { status, code, safeMessage });
}

function asyncRoute(handler: (req: Request, res: express.Response) => Promise<void>): RequestHandler {
  return (req, res, next) => {
    void handler(req, res).catch(next);
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value != null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const email = value.trim().toLowerCase();
  if (
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    email.includes("\r") ||
    email.includes("\n") ||
    email.includes("\0")
  ) {
    return null;
  }
  return email;
}

function parseCookie(cookieHeader: string | undefined): string | null {
  if (!cookieHeader) {
    return null;
  }
  for (const part of cookieHeader.split(";")) {
    const [name, ...valueParts] = part.trim().split("=");
    if (name === SESSION_COOKIE) {
      const value = valueParts.join("=");
      return /^[A-Za-z0-9_-]{40,64}$/.test(value) ? value : null;
    }
  }
  return null;
}

function cookieHeader(config: SaasApiConfig, token: string | null): string {
  const parts = [`${SESSION_COOKIE}=${token ?? ""}`, "Path=/api", "HttpOnly", "SameSite=Lax"];
  if (config.secureCookies) {
    parts.push("Secure");
  }
  if (token) {
    parts.push(`Max-Age=${config.sessionTtlSeconds}`);
  } else {
    parts.push("Max-Age=0", "Expires=Thu, 01 Jan 1970 00:00:00 GMT");
  }
  return parts.join("; ");
}

function principalFor(req: Request): Principal {
  const principal = (req as RequestWithPrincipal).principal;
  if (!principal) {
    throw apiError(401, "UNAUTHENTICATED", "Authentication is required.");
  }
  return principal;
}

function validUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  );
}

function publicProvider(connection: PublicProviderConnection) {
  return {
    id: connection.id,
    provider: connection.provider,
    displayName: connection.displayName,
    status: connection.status,
    createdAt: connection.createdAt.toISOString(),
    updatedAt: connection.updatedAt.toISOString(),
    lastValidatedAt: connection.lastValidatedAt?.toISOString() ?? null,
  };
}

function getRequestActor(req: Request): string {
  const principal = (req as RequestWithPrincipal).principal;
  return principal?.userId ?? req.ip ?? req.socket.remoteAddress ?? "unknown";
}

export function createSaasApi(params: CreateSaasApiParams): Express {
  const { config, repository } = params;
  const now = params.now ?? (() => new Date());
  const limiter = new SaasRateLimiter(repository, now);
  const logSafe = params.logger ?? (() => undefined);
  const validateCredential = params.validateCredential ?? validateProviderCredential;
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", config.trustProxy);
  app.use(express.json({ limit: "32kb", strict: true }));
  app.use((_req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("X-Frame-Options", "DENY");
    next();
  });

  app.use("/api", (req, res, next) => {
    if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      next();
      return;
    }
    const origin = req.get("origin");
    if (!origin || origin !== config.publicOrigin) {
      next(apiError(403, "ORIGIN_REJECTED", "Request origin is not allowed."));
      return;
    }
    next();
  });

  const requireAuth: RequestHandler = (req, _res, next) => {
    void (async () => {
      const token = parseCookie(req.headers.cookie);
      if (!token) {
        throw apiError(401, "UNAUTHENTICATED", "Authentication is required.");
      }
      const session: SaaSSession | null = await repository.findLoginSession(
        hashOpaqueToken(token),
        now(),
      );
      if (!session) {
        throw apiError(401, "UNAUTHENTICATED", "Authentication is required.");
      }
      (req as RequestWithPrincipal).principal = {
        userId: session.userId,
        email: session.email,
        sessionId: session.id,
        sessionExpiresAt: session.expiresAt,
      };
    })()
      .then(() => next())
      .catch(next);
  };

  const consumeLimit = async (
    req: Request,
    res: express.Response,
    action: Parameters<SaasRateLimiter["consume"]>[0],
  ): Promise<boolean> => {
    const result = await limiter.consume(action, getRequestActor(req));
    if (result.allowed) {
      return true;
    }
    res.setHeader("Retry-After", String(result.retryAfterSeconds));
    res.status(429).json({
      error: {
        code: "RATE_LIMITED",
        message: "Too many requests. Try again later.",
        requestId: randomUUID(),
      },
    });
    return false;
  };

  const audit = async (
    userId: string | null,
    eventType: string,
    success: boolean,
    metadata: Record<string, string | number | boolean | null> = {},
  ) => repository.addAuditEvent({ userId, eventType, success, metadata });

  app.post(
    "/api/auth/register",
    asyncRoute(async (req, res) => {
      if (!(await consumeLimit(req, res, "register"))) {
        return;
      }
      const body = asRecord(req.body);
      const email = normalizeEmail(body?.email);
      const password = typeof body?.password === "string" ? body.password : "";
      if (!email || password.length < 12 || password.length > 1024) {
        throw apiError(400, "INVALID_REGISTRATION", "Enter a valid email and password.");
      }
      const id = randomUUID();
      const passwordHash = await hashPassword(password);
      const created = await repository.createUser({ id, email, passwordHash });
      if (!created) {
        await audit(null, "account.created", false, { reason: "unavailable" }).catch(() => undefined);
        throw apiError(400, "ACCOUNT_UNAVAILABLE", "Unable to create this account.");
      }
      const token = createOpaqueToken();
      const expiresAt = new Date(now().getTime() + config.sessionTtlSeconds * 1000);
      const sessionId = randomUUID();
      await repository.createLoginSession({
        id: sessionId,
        userId: id,
        tokenHash: hashOpaqueToken(token),
        expiresAt,
        userAgent: req.get("user-agent")?.slice(0, 512) ?? null,
      });
      await audit(id, "account.created", true);
      res.setHeader("Set-Cookie", cookieHeader(config, token));
      res.status(201).json({
        user: { id, email, status: "active" },
        session: { expiresAt: expiresAt.toISOString() },
      });
    }),
  );

  app.post(
    "/api/auth/login",
    asyncRoute(async (req, res) => {
      if (!(await consumeLimit(req, res, "login"))) {
        return;
      }
      const body = asRecord(req.body);
      const email = normalizeEmail(body?.email);
      const password = typeof body?.password === "string" ? body.password : "";
      const user = email ? await repository.findUserByEmail(email) : null;
      const valid = await verifyPassword(password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);
      if (!user || !valid || user.status !== "active") {
        await audit(user?.id ?? null, "auth.login", false, { reason: "invalid_credentials" }).catch(
          () => undefined,
        );
        throw apiError(401, "INVALID_CREDENTIALS", "Email or password is incorrect.");
      }
      const token = createOpaqueToken();
      const expiresAt = new Date(now().getTime() + config.sessionTtlSeconds * 1000);
      const sessionId = randomUUID();
      await repository.createLoginSession({
        id: sessionId,
        userId: user.id,
        tokenHash: hashOpaqueToken(token),
        expiresAt,
        userAgent: req.get("user-agent")?.slice(0, 512) ?? null,
      });
      await audit(user.id, "auth.login", true);
      res.setHeader("Set-Cookie", cookieHeader(config, token));
      res.json({
        user: { id: user.id, email: user.email, status: user.status },
        session: { expiresAt: expiresAt.toISOString() },
      });
    }),
  );

  app.post(
    "/api/auth/logout",
    asyncRoute(async (req, res) => {
      const token = parseCookie(req.headers.cookie);
      if (token) {
        const session = await repository.findLoginSession(hashOpaqueToken(token), now());
        if (session) {
          await repository.revokeLoginSession(session.id, session.userId, now());
          await audit(session.userId, "auth.logout", true);
        }
      }
      res.setHeader("Set-Cookie", cookieHeader(config, null));
      res.status(204).end();
    }),
  );

  app.get(
    "/api/auth/session",
    requireAuth,
    asyncRoute(async (req, res) => {
      const principal = principalFor(req);
      res.json({
        user: { id: principal.userId, email: principal.email, status: "active" },
        session: { expiresAt: principal.sessionExpiresAt.toISOString() },
      });
    }),
  );

  const passwordResetMailer = params.passwordResetMailer;
  if (passwordResetMailer) {
    app.post(
      "/api/auth/password-reset",
      asyncRoute(async (req, res) => {
        if (!(await consumeLimit(req, res, "passwordReset"))) {
          return;
        }
        const email = normalizeEmail(asRecord(req.body)?.email);
        if (email) {
          const user = await repository.findUserByEmail(email);
          if (user?.status === "active") {
            const token = createResetToken();
            await repository.createPasswordReset({
              userId: user.id,
              tokenHash: hashOpaqueToken(token),
              expiresAt: new Date(now().getTime() + RESET_TOKEN_TTL_MS),
            });
            try {
              await passwordResetMailer({ email: user.email, token });
            } catch {
              // Do not disclose mail transport errors or reset token material.
            }
          }
        }
        res.status(202).json({ message: "If the account can be recovered, instructions will be sent." });
      }),
    );
    app.post(
      "/api/auth/password-reset/consume",
      asyncRoute(async (req, res) => {
        if (!(await consumeLimit(req, res, "passwordReset"))) {
          return;
        }
        const body = asRecord(req.body);
        const token = typeof body?.token === "string" ? body.token : "";
        const password = typeof body?.password === "string" ? body.password : "";
        if (!/^[A-Za-z0-9_-]{40,64}$/.test(token) || password.length < 12 || password.length > 1024) {
          throw apiError(400, "INVALID_RESET", "Reset request is invalid or expired.");
        }
        const resetUserId = await repository.consumePasswordReset({
          tokenHash: hashOpaqueToken(token),
          passwordHash: await hashPassword(password),
          now: now(),
        });
        if (!resetUserId) {
          throw apiError(400, "INVALID_RESET", "Reset request is invalid or expired.");
        }
        await audit(resetUserId, "auth.password_reset", true);
        res.status(204).end();
      }),
    );
  } else {
    app.post(
      "/api/auth/password-reset",
      asyncRoute(async (req, res) => {
        if (!(await consumeLimit(req, res, "passwordReset"))) {
          return;
        }
        throw apiError(503, "PASSWORD_RESET_UNAVAILABLE", "Account recovery is temporarily unavailable.");
      }),
    );
    app.post(
      "/api/auth/password-reset/consume",
      asyncRoute(async (req, res) => {
        if (!(await consumeLimit(req, res, "passwordReset"))) {
          return;
        }
        throw apiError(503, "PASSWORD_RESET_UNAVAILABLE", "Account recovery is temporarily unavailable.");
      }),
    );
  }

  const protectedApi = express.Router();
  protectedApi.use(requireAuth);

  protectedApi.get(
    "/providers",
    asyncRoute(async (req, res) => {
      const principal = principalFor(req);
      const connections = await repository.listProviderConnections(principal.userId);
      res.json({ providers: connections.map(publicProvider) });
    }),
  );

  protectedApi.post(
    "/providers",
    asyncRoute(async (req, res) => {
      const principal = principalFor(req);
      if (!(await consumeLimit(req, res, "providerConnect"))) {
        return;
      }
      const body = asRecord(req.body);
      if (!isProviderId(body?.provider)) {
        throw apiError(400, "UNSUPPORTED_PROVIDER", "This provider is not available.");
      }
      const credential = normalizeProviderCredential(body?.credential);
      if (!credential) {
        throw apiError(400, "INVALID_PROVIDER_CREDENTIAL", "Provider credential is invalid.");
      }
      const id = randomUUID();
      const connection = await repository.createProviderConnection({
        id,
        userId: principal.userId,
        provider: body.provider,
        encrypted: encryptProviderCredential(
          credential,
          { userId: principal.userId, connectionId: id, provider: body.provider },
          credentialKeyring(config),
        ),
      });
      if (!connection) {
        throw apiError(409, "PROVIDER_EXISTS", "This provider is already connected.");
      }
      await audit(principal.userId, "provider.connected", true, {
        provider: connection.provider,
        providerConnectionId: connection.id,
      });
      res.status(201).json({ provider: publicProvider(connection) });
    }),
  );

  protectedApi.get(
    "/providers/:id",
    asyncRoute(async (req, res) => {
      const principal = principalFor(req);
      const id = req.params.id;
      if (!validUuid(id)) {
        throw apiError(404, "NOT_FOUND", "Provider connection was not found.");
      }
      const connection = await repository.getProviderConnection(principal.userId, id);
      if (!connection) {
        throw apiError(404, "NOT_FOUND", "Provider connection was not found.");
      }
      res.json({ provider: publicProvider(connection) });
    }),
  );

  protectedApi.delete(
    "/providers/:id",
    asyncRoute(async (req, res) => {
      const principal = principalFor(req);
      const id = req.params.id;
      if (!validUuid(id)) {
        throw apiError(404, "NOT_FOUND", "Provider connection was not found.");
      }
      const connection = await repository.getProviderConnection(principal.userId, id);
      if (!connection || !(await repository.deleteProviderConnection(principal.userId, id))) {
        throw apiError(404, "NOT_FOUND", "Provider connection was not found.");
      }
      await audit(principal.userId, "provider.removed", true, {
        provider: connection.provider,
        providerConnectionId: connection.id,
      });
      res.status(204).end();
    }),
  );

  protectedApi.post(
    "/providers/:id/validate",
    asyncRoute(async (req, res) => {
      const principal = principalFor(req);
      if (!(await consumeLimit(req, res, "providerValidate"))) {
        return;
      }
      const id = req.params.id;
      if (!validUuid(id)) {
        throw apiError(404, "NOT_FOUND", "Provider connection was not found.");
      }
      const connection = await repository.getProviderCredential(principal.userId, id);
      if (!connection) {
        throw apiError(404, "NOT_FOUND", "Provider connection was not found.");
      }
      let apiKey: string;
      try {
        apiKey = decryptProviderCredential(
          connection,
          { userId: principal.userId, connectionId: connection.id, provider: connection.provider },
          credentialKeyring(config),
        );
      } catch {
        throw apiError(500, "PROVIDER_VALIDATION_FAILED", "Unable to validate provider.");
      }
      const outcome = await validateCredential({ provider: connection.provider, apiKey });
      const status: ProviderStatus =
        outcome === "connected" ? "connected" : outcome === "invalid" ? "invalid" : "pending";
      if (outcome !== "unavailable") {
        await repository.updateProviderStatus(principal.userId, id, status, now());
      }
      const updated = await repository.getProviderConnection(principal.userId, id);
      await audit(principal.userId, "provider.validated", outcome === "connected", {
        provider: connection.provider,
        providerConnectionId: connection.id,
        result: outcome,
      });
      res.json({ provider: updated ? publicProvider(updated) : null, validation: outcome });
    }),
  );

  protectedApi.get(
    "/model-preference",
    asyncRoute(async (req, res) => {
      const principal = principalFor(req);
      const preference = await repository.getModelPreference(principal.userId);
      res.json({ preference });
    }),
  );

  protectedApi.put(
    "/model-preference",
    asyncRoute(async (req, res) => {
      const principal = principalFor(req);
      if (!(await consumeLimit(req, res, "modelPreference"))) {
        return;
      }
      const body = asRecord(req.body);
      const providerConnectionId = body?.providerConnectionId;
      const modelId = typeof body?.modelId === "string" ? body.modelId.trim() : "";
      if (
        !validUuid(providerConnectionId) ||
        !modelId ||
        modelId.length > 256 ||
        modelId.includes("\r") ||
        modelId.includes("\n") ||
        modelId.includes("\0")
      ) {
        throw apiError(400, "INVALID_MODEL_PREFERENCE", "Provider or model selection is invalid.");
      }
      const connection = await repository.getProviderConnection(principal.userId, providerConnectionId);
      if (!connection || connection.status !== "connected") {
        throw apiError(404, "NOT_FOUND", "Provider connection was not found.");
      }
      if (params.validateModel && !params.validateModel(connection.provider, modelId, principal.userId)) {
        throw apiError(400, "INVALID_MODEL_PREFERENCE", "Provider or model selection is invalid.");
      }
      const preference = await repository.setModelPreference({
        userId: principal.userId,
        providerConnectionId,
        modelId,
      });
      if (!preference) {
        throw apiError(404, "NOT_FOUND", "Provider connection was not found.");
      }
      await audit(principal.userId, "model.changed", true, {
        provider: connection.provider,
        modelId,
      });
      res.json({ preference });
    }),
  );

  protectedApi.get(
    "/agent-sessions",
    asyncRoute(async (req, res) => {
      const principal = principalFor(req);
      res.json({ sessions: await repository.listAgentSessions(principal.userId) });
    }),
  );

  protectedApi.post(
    "/agent-sessions",
    asyncRoute(async (req, res) => {
      const principal = principalFor(req);
      const requestedTitle = asRecord(req.body)?.title;
      const title = typeof requestedTitle === "string" ? requestedTitle.trim() : "New conversation";
      if (
        !title ||
        title.length > SESSION_TITLE_MAX ||
        title.includes("\r") ||
        title.includes("\n") ||
        title.includes("\0")
      ) {
        throw apiError(400, "INVALID_SESSION", "Session title is invalid.");
      }
      const session = await repository.createAgentSession({
        id: randomUUID(),
        userId: principal.userId,
        title,
      });
      await audit(principal.userId, "agent_session.created", true, { sessionId: session.id });
      res.status(201).json({ session });
    }),
  );

  protectedApi.get(
    "/agent-sessions/:id",
    asyncRoute(async (req, res) => {
      const principal = principalFor(req);
      const id = req.params.id;
      if (!validUuid(id)) {
        throw apiError(404, "NOT_FOUND", "Agent session was not found.");
      }
      const session = await repository.getAgentSession(principal.userId, id);
      if (!session) {
        throw apiError(404, "NOT_FOUND", "Agent session was not found.");
      }
      res.json({ session });
    }),
  );

  protectedApi.delete(
    "/agent-sessions/:id",
    asyncRoute(async (req, res) => {
      const principal = principalFor(req);
      const id = req.params.id;
      if (!validUuid(id) || !(await repository.deleteAgentSession(principal.userId, id))) {
        throw apiError(404, "NOT_FOUND", "Agent session was not found.");
      }
      await params.deleteAgentSessionFiles?.(principal.userId, id);
      await audit(principal.userId, "agent_session.removed", true, { sessionId: id });
      res.status(204).end();
    }),
  );

  protectedApi.post(
    "/chat",
    asyncRoute(async (req, res) => {
      const principal = principalFor(req);
      if (!(await consumeLimit(req, res, "agentRun"))) {
        return;
      }
      if (!params.runAgent) {
        throw apiError(503, "RUNTIME_UNAVAILABLE", "NEER is temporarily unavailable.");
      }
      const body = asRecord(req.body);
      const prompt = typeof body?.message === "string" ? body.message.trim() : "";
      const requestedSessionId = body?.sessionId;
      if (!prompt || prompt.length > 20_000 || prompt.includes("\0")) {
        throw apiError(400, "INVALID_MESSAGE", "Message is invalid.");
      }
      const selected = await repository.getExecutionCredential(principal.userId);
      if (!selected) {
        throw apiError(409, "MODEL_NOT_CONFIGURED", "Connect and validate a provider first.");
      }
      let sessionId: string;
      if (requestedSessionId == null) {
        const session = await repository.createAgentSession({
          id: randomUUID(),
          userId: principal.userId,
          title: "New conversation",
        });
        sessionId = session.id;
      } else if (validUuid(requestedSessionId)) {
        const session = await repository.getAgentSession(principal.userId, requestedSessionId);
        if (!session) {
          throw apiError(404, "NOT_FOUND", "Agent session was not found.");
        }
        sessionId = session.id;
      } else {
        throw apiError(404, "NOT_FOUND", "Agent session was not found.");
      }
      let apiKey: string;
      try {
        apiKey = decryptProviderCredential(
          selected,
          { userId: principal.userId, connectionId: selected.id, provider: selected.provider },
          credentialKeyring(config),
        );
      } catch {
        throw apiError(503, "RUNTIME_UNAVAILABLE", "NEER is temporarily unavailable.");
      }
      try {
        const result = await params.runAgent({
          userId: principal.userId,
          sessionId,
          prompt,
          credential: { provider: selected.provider, modelId: selected.modelId, apiKey },
        });
        await audit(principal.userId, "agent.run", true, {
          sessionId,
          provider: selected.provider,
          modelId: selected.modelId,
        });
        res.json({ sessionId, model: result.model, text: result.text });
      } catch {
        await audit(principal.userId, "agent.run", false, {
          sessionId,
          provider: selected.provider,
          modelId: selected.modelId,
          reason: "runtime_error",
        }).catch(() => undefined);
        logSafe("saas_agent_run_failed", { requestId: randomUUID() });
        throw apiError(502, "AGENT_RUN_FAILED", "Unable to complete the NEER request.");
      }
    }),
  );

  app.use("/api", protectedApi);
  app.use("/api", (_req, res) => {
    res.status(404).json({
      error: { code: "NOT_FOUND", message: "Resource was not found.", requestId: randomUUID() },
    });
  });
  app.use(((error: unknown, req: Request, res: express.Response, _next: express.NextFunction) => {
    const requestId = randomUUID();
    if (error && typeof error === "object" && "type" in error && error.type === "entity.too.large") {
      res.status(413).json({
        error: { code: "REQUEST_TOO_LARGE", message: "Request is too large.", requestId },
      });
      return;
    }
    const apiFailure = error as Partial<SafeApiError>;
    const status = Number.isInteger(apiFailure.status) ? apiFailure.status! : 500;
    const code = typeof apiFailure.code === "string" ? apiFailure.code : "INTERNAL_ERROR";
    const message = apiFailure.safeMessage ?? "Request could not be completed.";
    if (status >= 500) {
      logSafe("saas_request_failed", { requestId, code });
    }
    res.status(status).json({ error: { code, message, requestId } });
    void req;
  }) satisfies ErrorRequestHandler);

  return app;
}

function credentialKeyring(config: SaasApiConfig) {
  return {
    keys: config.credentialEncryptionKeys,
    activeVersion: config.activeCredentialKeyVersion,
  };
}

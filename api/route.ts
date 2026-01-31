export const runtime = "nodejs";

import { zValidator } from "@hono/zod-validator";
import bcrypt from "bcryptjs";
import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { HTTPException } from "hono/http-exception";
import { SignJWT, jwtVerify } from "jose";
import { z } from "zod";
import type { User } from "../shared/schema.js";
import { insertClientSchema, insertInterventionSchema, insertTechnicianSchema, insertUserSchema } from "../shared/schema.js";
import * as authStorage from "./auth.js";
import { getDb } from "./db.js";
import * as storage from "./storage.js";

const JWT_SECRET = new TextEncoder().encode(process.env.SESSION_SECRET || "fallback-secret-min-32-chars-long");
const TOKEN_EXPIRY = "7d";

type Variables = {
  user: User | null;
};

const app = new Hono<{ Variables: Variables }>().basePath("/api");

// Health check endpoint for debugging
app.get("/health", (c) => {
  console.log("Health check endpoint reached");
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || "unknown"
  });
});

async function createToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(JWT_SECRET);
}

async function verifyToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload.sub as string;
  } catch {
    return null;
  }
}

app.use("*", async (c, next) => {
  const token = getCookie(c, "auth_token");
  if (token) {
    const userId = await verifyToken(token);
    if (userId) {
      const db = getDb();
      const user = await authStorage.getUser(db, userId);
      if (user) c.set("user", user);
    }
  }
  await next();
});

const requireAuth = async (c: any, next: any) => {
  if (!c.var.user) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }
  await next();
};

// Auth
const registerSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(8, "Palavra-passe deve ter pelo menos 8 caracteres"),
  firstName: z.string().min(1, "Nome é obrigatório"),
  lastName: z.string().min(1, "Apelido é obrigatório"),
});

function getWhitelistedEmails(): Set<string> {
  const whitelist = process.env.REGISTRATION_WHITELIST || "";
  return new Set(
    whitelist
      .split(",")
      .map(email => email.trim().toLowerCase())
      .filter(Boolean)
  );
}

app.post("/auth/register", zValidator("json", registerSchema), async (c) => {
  const { email, password, firstName, lastName } = c.req.valid("json");

  const whitelistedEmails = getWhitelistedEmails();

  if (whitelistedEmails.size !== 0 && !whitelistedEmails.has(email)) {
    throw new HTTPException(403, { message: "E-mail não autorizado para registo" });
  }

  const db = getDb();
  const existingUser = await authStorage.getUserByEmail(db, email);
  if (existingUser) {
    throw new HTTPException(409, { message: "Utilizador já existe" });
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await authStorage.createUser(db, {
    email,
    password: hashedPassword,
    firstName,
    lastName,
    role: "technician",
  });

  const token = await createToken(user.id);
  setCookie(c, "auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
    maxAge: 7 * 24 * 60 * 60,
    path: "/"
  });

  const { password: _, ...userWithoutPassword } = user;
  return c.json(userWithoutPassword, 201);
});

app.post("/auth/login", zValidator("json", z.object({
  email: z.string().email(),
  password: z.string().min(1)
})), async (c) => {
  const { email, password } = c.req.valid("json");
  const db = getDb();
  const user = await authStorage.getUserByEmail(db, email);

  if (!user?.password || !(await bcrypt.compare(password, user.password))) {
    throw new HTTPException(401, { message: "Credenciais inválidas" });
  }

  const token = await createToken(user.id);
  setCookie(c, "auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
    maxAge: 7 * 24 * 60 * 60,
    path: "/"
  });

  const { password: _, ...userWithoutPassword } = user;
  return c.json(userWithoutPassword);
});

app.post("/auth/logout", (c) => {
  setCookie(c, "auth_token", "", { maxAge: 0, path: "/" });
  return c.json({ message: "Logged out" });
});

app.get("/auth/user", requireAuth, (c) => {
  const { password: _, ...userWithoutPassword } = c.var.user!;
  return c.json(userWithoutPassword);
});

// Clients
app.get("/clients", requireAuth, async (c) => {
  const search = c.req.query("search");
  const db = getDb();
  const clients = await storage.getClients(db, search);
  return c.json(clients);
});

app.get("/clients/:id", requireAuth, async (c) => {
  const id = parseInt(c.req.param("id"));
  const db = getDb();
  const client = await storage.getClient(db, id);
  if (!client) throw new HTTPException(404, { message: "Cliente não encontrado" });
  return c.json(client);
});

app.post("/clients", requireAuth, zValidator("json", insertClientSchema), async (c) => {
  const data = c.req.valid("json");
  const db = getDb();
  const client = await storage.createClient(db, data);
  return c.json(client, 201);
});

app.patch("/clients/:id", requireAuth, zValidator("json", insertClientSchema.partial()), async (c) => {
  const id = parseInt(c.req.param("id"));
  const updates = c.req.valid("json");
  const db = getDb();
  const client = await storage.updateClient(db, id, updates);
  return c.json(client);
});

// Interventions
app.get("/interventions", requireAuth, async (c) => {
  const status = c.req.query("status");
  const technician = c.req.query("technician");
  const clientId = c.req.query("clientId") ? parseInt(c.req.query("clientId")!) : undefined;
  const db = getDb();
  const interventions = await storage.getInterventions(db, { status, technician, clientId });
  return c.json(interventions);
});

app.get("/interventions/:id", requireAuth, async (c) => {
  const id = parseInt(c.req.param("id"));
  const db = getDb();
  const intervention = await storage.getIntervention(db, id);
  if (!intervention) throw new HTTPException(404, { message: "Intervenção não encontrada" });
  return c.json(intervention);
});

app.post("/interventions", requireAuth, zValidator("json", insertInterventionSchema), async (c) => {
  const data = c.req.valid("json");
  const db = getDb();
  const intervention = await storage.createIntervention(db, data);
  const full = await storage.getIntervention(db, intervention.id);
  return c.json(full, 201);
});

app.patch("/interventions/:id", requireAuth, zValidator("json", insertInterventionSchema.partial()), async (c) => {
  const id = parseInt(c.req.param("id"));
  const updates = c.req.valid("json");
  const db = getDb();
  await storage.updateIntervention(db, id, updates);
  const full = await storage.getIntervention(db, id);
  return c.json(full);
});

app.delete("/interventions/:id", requireAuth, async (c) => {
  const id = parseInt(c.req.param("id"));
  const db = getDb();
  await storage.deleteIntervention(db, id);
  return c.json({ message: "Deleted" });
});

// Photos
app.post("/interventions/:id/photos", requireAuth, zValidator("json", z.object({ url: z.string().url() })), async (c) => {
  const interventionId = parseInt(c.req.param("id"));
  const { url } = c.req.valid("json");
  const db = getDb();
  const photo = await storage.addPhoto(db, { interventionId, url });
  return c.json(photo, 201);
});

app.delete("/photos/:id", requireAuth, async (c) => {
  const id = parseInt(c.req.param("id"));
  const db = getDb();
  await storage.deletePhoto(db, id);
  return c.json({ message: "Deleted" });
});

// Technicians
app.get("/technicians", requireAuth, async (c) => {
  const db = getDb();
  const technicians = await storage.getTechnicians(db);
  return c.json(technicians);
});

app.post("/technicians", requireAuth, zValidator("json", insertTechnicianSchema), async (c) => {
  const data = c.req.valid("json");
  const db = getDb();
  const technician = await storage.createTechnician(db, data);
  return c.json(technician, 201);
});

app.patch("/technicians/:id", requireAuth, zValidator("json", insertTechnicianSchema.partial()), async (c) => {
  const id = parseInt(c.req.param("id"));
  const updates = c.req.valid("json");
  const db = getDb();
  const technician = await storage.updateTechnician(db, id, updates);
  return c.json(technician);
});

app.delete("/technicians/:id", requireAuth, async (c) => {
  const id = parseInt(c.req.param("id"));
  const db = getDb();
  await storage.deleteTechnician(db, id);
  return c.json({ message: "Deleted" });
});

// Users
app.get("/users", requireAuth, async (c) => {
  const db = getDb();
  const users = await authStorage.getUsers(db);
  return c.json(users.map(({ password: _, ...user }) => user));
});

app.post("/users", requireAuth, zValidator("json", insertUserSchema.required({ password: true })), async (c) => {
  const data = c.req.valid("json");
  if (!data.password) {
    throw new HTTPException(400, { message: "Password required" });
  }
  const hashedPassword = await bcrypt.hash(data.password, 10);
  const db = getDb();
  const user = await authStorage.createUser(db, { ...data, password: hashedPassword });
  const { password: _, ...userWithoutPassword } = user;
  return c.json(userWithoutPassword, 201);
});

app.patch("/users/:id", requireAuth, zValidator("json", insertUserSchema.partial()), async (c) => {
  const id = c.req.param("id");
  const updates = c.req.valid("json");
  if (updates.password) {
    updates.password = await bcrypt.hash(updates.password, 10);
  }
  const db = getDb();
  const user = await authStorage.updateUser(db, id, updates);
  const { password: _, ...userWithoutPassword } = user;
  return c.json(userWithoutPassword);
});

app.delete("/users/:id", requireAuth, async (c) => {
  const id = c.req.param("id");
  const db = getDb();
  await authStorage.deleteUser(db, id);
  return c.json({ message: "Deleted" });
});

// Export app for local development
export { app };

// Export handler for Vercel serverless - Hono app.fetch is compatible with Web Standard Request/Response
export default app;

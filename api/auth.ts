/**
 * Serverless-safe auth storage layer.
 * All functions are stateless and accept db as a parameter.
 */

import { eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { users, type UpsertUser, type User } from "../shared/models/auth.ts";
import * as schema from "../shared/schema.ts";

type Database = NodePgDatabase<typeof schema>;

export async function getUser(
    db: Database,
    id: string
): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
}

export async function getUserByEmail(
    db: Database,
    email: string
): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
}

export async function upsertUser(
    db: Database,
    userData: UpsertUser
): Promise<User> {
    const [user] = await db
        .insert(users)
        .values(userData)
        .onConflictDoUpdate({
            target: users.id,
            set: {
                ...userData,
                updatedAt: new Date(),
            },
        })
        .returning();
    return user;
}

export async function getUsers(
    db: Database
): Promise<User[]> {
    return db.select().from(users);
}

export async function createUser(
    db: Database,
    userData: UpsertUser
): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
}

export async function updateUser(
    db: Database,
    id: string,
    updates: Partial<UpsertUser>
): Promise<User> {
    const [user] = await db
        .update(users)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning();
    return user;
}

export async function deleteUser(
    db: Database,
    id: string
): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
}

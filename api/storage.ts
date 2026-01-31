/**
 * Serverless-safe storage layer.
 * All functions are stateless and accept db as a parameter.
 * No global state, no side effects at module load.
 */

import { and, desc, eq, ilike, or } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "../shared/schema.js";
import {
    clients, interventions, photos, technicians,
    type Client, type InsertClient,
    type InsertIntervention,
    type InsertPhoto,
    type InsertTechnician,
    type Intervention,
    type Photo,
    type Technician,
    type UpdateClientRequest,
    type UpdateInterventionRequest
} from "../shared/schema.js";

type Database = NodePgDatabase<typeof schema>;

// ============ Clients ============

export async function getClients(
    db: Database,
    search?: string
): Promise<Client[]> {
    if (search) {
        return await db.select().from(clients).where(
            or(
                ilike(clients.name, `%${search}%`),
                ilike(clients.nif, `%${search}%`)
            )
        ).orderBy(desc(clients.createdAt));
    }
    return await db.select().from(clients).orderBy(desc(clients.createdAt));
}

export async function getClient(
    db: Database,
    id: number
): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client;
}

export async function createClient(
    db: Database,
    client: InsertClient
): Promise<Client> {
    const [newClient] = await db.insert(clients).values(client).returning();
    return newClient;
}

export async function updateClient(
    db: Database,
    id: number,
    updates: UpdateClientRequest
): Promise<Client> {
    const [updated] = await db.update(clients).set(updates).where(eq(clients.id, id)).returning();
    return updated;
}

// ============ Interventions ============

export async function getInterventions(
    db: Database,
    filters?: { status?: string, technician?: string, clientId?: number }
): Promise<(Intervention & { client: Client, photos: Photo[] })[]> {
    const conditions = [];
    if (filters?.status) conditions.push(eq(interventions.status, filters.status));
    if (filters?.technician) conditions.push(ilike(interventions.technician, `%${filters.technician}%`));
    if (filters?.clientId) conditions.push(eq(interventions.clientId, filters.clientId));

    const result = await db.query.interventions.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        with: {
            client: true,
            photos: true
        },
        orderBy: desc(interventions.createdAt)
    });

    return result;
}

export async function getIntervention(
    db: Database,
    id: number
): Promise<(Intervention & { client: Client, photos: Photo[] }) | undefined> {
    return await db.query.interventions.findFirst({
        where: eq(interventions.id, id),
        with: {
            client: true,
            photos: true
        }
    });
}

export async function createIntervention(
    db: Database,
    intervention: InsertIntervention
): Promise<Intervention> {
    const [newIntervention] = await db.insert(interventions).values(intervention).returning();
    return newIntervention;
}

export async function updateIntervention(
    db: Database,
    id: number,
    updates: UpdateInterventionRequest
): Promise<Intervention> {
    const [updated] = await db.update(interventions).set({
        ...updates,
        updatedAt: new Date()
    }).where(eq(interventions.id, id)).returning();
    return updated;
}

export async function deleteIntervention(
    db: Database,
    id: number
): Promise<void> {
    // First delete associated photos
    await db.delete(photos).where(eq(photos.interventionId, id));
    // Then delete the intervention
    await db.delete(interventions).where(eq(interventions.id, id));
}

// ============ Photos ============

export async function addPhoto(
    db: Database,
    photo: InsertPhoto
): Promise<Photo> {
    const [newPhoto] = await db.insert(photos).values(photo).returning();
    return newPhoto;
}

export async function getPhotos(
    db: Database,
    interventionId: number
): Promise<Photo[]> {
    return await db.select().from(photos).where(eq(photos.interventionId, interventionId));
}

export async function deletePhoto(
    db: Database,
    id: number
): Promise<void> {
    await db.delete(photos).where(eq(photos.id, id));
}

// ============ Technicians ============

export async function getTechnicians(
    db: Database
): Promise<Technician[]> {
    return await db.select().from(technicians).orderBy(desc(technicians.createdAt));
}

export async function getTechnicianByName(
    db: Database,
    name: string
): Promise<Technician[]> {
    return await db.select().from(technicians).where(eq(technicians.name, name));
}

export async function createTechnician(
    db: Database,
    technician: InsertTechnician
): Promise<Technician> {
    const [newTech] = await db.insert(technicians).values(technician).returning();
    return newTech;
}

export async function updateTechnician(
    db: Database,
    id: number,
    updates: Partial<InsertTechnician>
): Promise<Technician> {
    const [updated] = await db.update(technicians)
        .set(updates)
        .where(eq(technicians.id, id))
        .returning();
    return updated;
}

export async function deleteTechnician(
    db: Database,
    id: number
): Promise<void> {
    await db.delete(technicians).where(eq(technicians.id, id));
}

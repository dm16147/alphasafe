import { db } from "./db.js";
import {
  clients, interventions, photos, technicians,
  type Client, type InsertClient, type UpdateClientRequest,
  type Intervention, type InsertIntervention, type UpdateInterventionRequest,
  type Photo, type InsertPhoto, type Technician, type InsertTechnician
} from "@shared/schema";
import { eq, desc, ilike, or, and } from "drizzle-orm";

export interface IStorage {
  // Clients
  getClients(search?: string): Promise<Client[]>;
  getClient(id: number): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, updates: UpdateClientRequest): Promise<Client>;

  // Interventions
  getInterventions(filters?: { status?: string, technician?: string, clientId?: number }): Promise<(Intervention & { client: Client, photos: Photo[] })[]>;
  getIntervention(id: number): Promise<(Intervention & { client: Client, photos: Photo[] }) | undefined>;
  createIntervention(intervention: InsertIntervention): Promise<Intervention>;
  updateIntervention(id: number, updates: UpdateInterventionRequest): Promise<Intervention>;
  deleteIntervention(id: number): Promise<void>;

  // Photos
  addPhoto(photo: InsertPhoto): Promise<Photo>;
  getPhotos(interventionId: number): Promise<Photo[]>;
  deletePhoto(id: number): Promise<void>;

  // Technicians
  getTechnicians(): Promise<Technician[]>;
  getTechnicianByName(name: string): Promise<Technician[]>;
  createTechnician(technician: InsertTechnician): Promise<Technician>;
  deleteTechnician(id: number): Promise<void>;
  updateTechnician(id: number, updates: Partial<InsertTechnician>): Promise<Technician>;
}

export class DatabaseStorage implements IStorage {
  async getClients(search?: string): Promise<Client[]> {
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

  async getClient(id: number): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client;
  }

  async createClient(client: InsertClient): Promise<Client> {
    const [newClient] = await db.insert(clients).values(client).returning();
    return newClient;
  }

  async updateClient(id: number, updates: UpdateClientRequest): Promise<Client> {
    const [updated] = await db.update(clients).set(updates).where(eq(clients.id, id)).returning();
    return updated;
  }

  async getInterventions(filters?: { status?: string, technician?: string, clientId?: number }): Promise<(Intervention & { client: Client, photos: Photo[] })[]> {
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

  async getIntervention(id: number): Promise<(Intervention & { client: Client, photos: Photo[] }) | undefined> {
    return await db.query.interventions.findFirst({
      where: eq(interventions.id, id),
      with: {
        client: true,
        photos: true
      }
    });
  }

  async createIntervention(intervention: InsertIntervention): Promise<Intervention> {
    const [newIntervention] = await db.insert(interventions).values(intervention).returning();
    return newIntervention;
  }

  async updateIntervention(id: number, updates: UpdateInterventionRequest): Promise<Intervention> {
    const [updated] = await db.update(interventions).set({ ...updates, updatedAt: new Date() }).where(eq(interventions.id, id)).returning();
    return updated;
  }

  async deleteIntervention(id: number): Promise<void> {
    // First delete associated photos
    await db.delete(photos).where(eq(photos.interventionId, id));
    // Then delete the intervention
    await db.delete(interventions).where(eq(interventions.id, id));
  }

  async addPhoto(photo: InsertPhoto): Promise<Photo> {
    const [newPhoto] = await db.insert(photos).values(photo).returning();
    return newPhoto;
  }

  async deletePhoto(id: number): Promise<void> {
    await db.delete(photos).where(eq(photos.id, id));
  }

  async getPhotos(interventionId: number): Promise<Photo[]> {
    return await db.select().from(photos).where(eq(photos.interventionId, interventionId));
  }

  async getTechnicians(): Promise<Technician[]> {
    return await db.select().from(technicians).orderBy(desc(technicians.createdAt));
  }

  async getTechnicianByName(name: string): Promise<Technician[]> {
    return await db.select().from(technicians).where(eq(technicians.name, name));
  }

  async createTechnician(technician: InsertTechnician): Promise<Technician> {
    const [newTech] = await db.insert(technicians).values(technician).returning();
    return newTech;
  }

  async deleteTechnician(id: number): Promise<void> {
    await db.delete(technicians).where(eq(technicians.id, id));
  }

  async updateTechnician(id: number, updates: Partial<InsertTechnician>): Promise<Technician> {
    const [updated] = await db.update(technicians)
      .set(updates)
      .where(eq(technicians.id, id))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();

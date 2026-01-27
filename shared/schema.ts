import { pgTable, text, serial, timestamp, integer, boolean, varchar, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations, sql } from "drizzle-orm";
import { users } from "./models/auth";

export * from "./models/auth";

export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nif: text("nif").notNull(),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const interventions = pgTable("interventions", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id),
  serviceType: text("service_type").array().notNull().default(sql`'{}'::text[]`), // Videoporteiro, Videovigilância, Alarme, Domótica, Controlo de acessos, Sistemas de Segurança Contra Incêndios
  equipmentModel: text("equipment_model").notNull(),
  serialNumber: text("serial_number").notNull(), // Obrigatório conforme pedido
  status: text("status").notNull().default("Em curso"), // Em curso, A faturar, Concluído, Assistência
  assistanceDate: timestamp("assistance_date"), // Registo de assistência (data e hora)
  technician: text("technician").notNull(), // Obrigatório conforme pedido
  notes: text("notes"), // Observações técnicas
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const photos = pgTable("photos", {
  id: serial("id").primaryKey(),
  interventionId: integer("intervention_id").notNull().references(() => interventions.id),
  url: text("url").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const clientsRelations = relations(clients, ({ many }) => ({
  interventions: many(interventions),
}));

export const interventionsRelations = relations(interventions, ({ one, many }) => ({
  client: one(clients, {
    fields: [interventions.clientId],
    references: [clients.id],
  }),
  photos: many(photos),
}));

export const photosRelations = relations(photos, ({ one }) => ({
  intervention: one(interventions, {
    fields: [photos.interventionId],
    references: [interventions.id],
  }),
}));

// Schemas
export const insertClientSchema = createInsertSchema(clients).omit({ id: true, createdAt: true });
export const insertInterventionSchema = createInsertSchema(interventions, {
  assistanceDate: z.string().optional().nullable().transform(val => val ? new Date(val) : null),
}).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPhotoSchema = createInsertSchema(photos).omit({ id: true, createdAt: true });

export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Intervention = typeof interventions.$inferSelect;
export type InsertIntervention = z.infer<typeof insertInterventionSchema>;
export type Photo = typeof photos.$inferSelect;
export type InsertPhoto = z.infer<typeof insertPhotoSchema>;

export const technicians = pgTable("technicians", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"), // Opcional
  role: text("role").notNull().default("technician"), // technician, office
  receiveAssignmentNotifications: boolean("receive_assignment_notifications").notNull().default(true),
  receiveBillingNotifications: boolean("receive_billing_notifications").notNull().default(false),
  receiveAssistanceNotifications: boolean("receive_assistance_notifications").notNull().default(true),
  active: text("active").notNull().default("Ativo"), // Ativo, Férias, Baixa, Inativo
  vacationStart: timestamp("vacation_start"),
  vacationEnd: timestamp("vacation_end"),
  sickLeaveStart: timestamp("sick_leave_start"),
  sickLeaveEnd: timestamp("sick_leave_end"),
  terminationDate: timestamp("termination_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const techniciansRelations = relations(technicians, ({ many }) => ({
  interventions: many(interventions),
}));

export const insertTechnicianSchema = createInsertSchema(technicians, {
  createdAt: z.string().optional().nullable().transform(val => val ? new Date(val) : new Date()),
  vacationStart: z.string().optional().nullable().transform(val => val ? new Date(val) : null),
  vacationEnd: z.string().optional().nullable().transform(val => val ? new Date(val) : null),
  sickLeaveStart: z.string().optional().nullable().transform(val => val ? new Date(val) : null),
  sickLeaveEnd: z.string().optional().nullable().transform(val => val ? new Date(val) : null),
  terminationDate: z.string().optional().nullable().transform(val => val ? new Date(val) : null),
}).omit({ id: true });
export type Technician = typeof technicians.$inferSelect;
export type InsertTechnician = z.infer<typeof insertTechnicianSchema>;

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;

// API Types
export type CreateClientRequest = InsertClient;
export type UpdateClientRequest = Partial<InsertClient>;
export type CreateInterventionRequest = InsertIntervention;
export type UpdateInterventionRequest = Partial<InsertIntervention>;

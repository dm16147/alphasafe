import { api } from "@shared/routes";
import { insertPhotoSchema, insertTechnicianSchema, users as usersTable } from "@shared/schema";
import type { Express } from "express";
import type { Server } from "http";
import { z } from "zod";
import { authStorage, isAuthenticated, registerAuthRoutes, setupAuth } from "./replit_integrations/auth";
import { storage } from "./storage";

// ... rest of imports
async function sendPushNotification(technicianName: string, intervention: any) {
  // This is a placeholder for push notification logic
  // Real implementation requires a push service (like WebPush library)
  // and a database to store technician push subscriptions
  console.log(`[PUSH SIMULATION] Sending push notification to ${technicianName} for assistance ${intervention.id}`);
}

async function sendAssignmentEmail(technicianName: string, intervention: any, isAssistance: boolean = false) {
  const [tech] = await storage.getTechnicianByName(technicianName);
  if (!tech || !tech.email) return;

  // Check notification preferences
  if (isAssistance && !tech.receiveAssistanceNotifications) {
    console.log(`[NOTIFY] Technician ${tech.name} opted out of assistance notifications.`);
    return;
  }
  if (!isAssistance && !tech.receiveAssignmentNotifications) {
    console.log(`[NOTIFY] Technician ${tech.name} opted out of assignment notifications.`);
    return;
  }

  const typeLabel = isAssistance ? "URGENTE: Pedido de Assistência" : "Nova Instalação / Intervenção";
  const serviceLabel = Array.isArray(intervention.serviceType) ? intervention.serviceType.join(", ") : intervention.serviceType;
  const subject = `${typeLabel}: ${serviceLabel} - ${intervention.client.name}`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 2px solid ${isAssistance ? '#e11d48' : '#c4a57b'}; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #1a1612; color: #c4a57b; padding: 20px; text-align: center;">
        <h1 style="margin: 0; letter-spacing: 2px;">AlphaSafe</h1>
        <p style="margin: 5px 0 0; text-transform: uppercase; font-size: 12px;">${typeLabel}</p>
      </div>
      <div style="padding: 20px; color: #1a1612; line-height: 1.6;">
        <p>Olá <strong>${tech.name}</strong>,</p>
        <p>${isAssistance ? 'Há um novo pedido de assistência que requer a sua atenção:' : 'Foi-lhe atribuída uma nova instalação/intervenção no sistema:'}</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid ${isAssistance ? '#e11d48' : '#c4a57b'}; margin: 20px 0;">
          <p style="margin: 0;"><strong>Cliente:</strong> ${intervention.client.name}</p>
          <p style="margin: 5px 0 0;"><strong>Morada:</strong> ${intervention.client.address || 'Não especificada'}</p>
          <p style="margin: 5px 0 0;"><strong>Serviço:</strong> ${serviceLabel}</p>
          <p style="margin: 5px 0 0;"><strong>Equipamento:</strong> ${intervention.equipmentModel}</p>
          <p style="margin: 5px 0 0;"><strong>N/S:</strong> ${intervention.serialNumber || 'N/A'}</p>
        </div>

        <div style="background-color: #fff4ed; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
          <p style="margin: 0;"><strong>Notas/Sintomas:</strong></p>
          <p style="margin: 5px 0 0; color: #431407;">${intervention.notes || 'Sem notas adicionais.'}</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="https://alphasafe.replit.app" style="background-color: #1a1612; color: #c4a57b; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">VER INTERVENÇÃO</a>
        </div>
      </div>
      <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 11px; color: #666; border-top: 1px solid #eee;">
        &copy; ${new Date().getFullYear()} AlphaSafe - Sistemas de Segurança Eletrónica<br>
        Este é um e-mail automático. Por favor, não responda.
      </div>
    </div>
  `;

  if (process.env.RESEND_API_KEY) {
    console.log(`[EMAIL] Sending ${isAssistance ? 'Assistance' : 'Assignment'} email via Resend to ${tech.email}`);
  } else {
    console.log(`[EMAIL SIMULATION] 
      TO: ${tech.email}
      TYPE: ${isAssistance ? 'ASSISTÊNCIA' : 'ATRIBUIÇÃO'}
      SUBJECT: ${subject}
      TEMPLATE: Cool HTML structure ready.
    `);
  }
}

async function sendBillingNotification(intervention: any) {
  const allTechs = await storage.getTechnicians();
  const officeEmails = allTechs
    .filter(t => t.role === 'office' && t.receiveBillingNotifications && t.email)
    .map(t => t.email as string);

  const adminEmail = process.env.ADMIN_BILLING_EMAIL;
  if (adminEmail && !officeEmails.includes(adminEmail)) {
    officeEmails.push(adminEmail);
  }

  if (officeEmails.length === 0) return;

  const subject = `FATURAÇÃO: ${intervention.client.name} - Pronta para Processar`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #c4a57b; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #c4a57b; color: #1a1612; padding: 15px; text-align: center; font-weight: bold;">
        NOTIFICAÇÃO PARA ESCRITÓRIO
      </div>
      <div style="padding: 20px;">
        <h2 style="color: #1a1612; margin-top: 0;">Pronto para Faturar</h2>
        <p>A seguinte intervenção foi concluída tecnicamente e está pronta para o processamento administrativo:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="background-color: #f9f9f9;"><td style="padding: 10px; border: 1px solid #eee;"><strong>Cliente</strong></td><td style="padding: 10px; border: 1px solid #eee;">${intervention.client.name}</td></tr>
          <tr><td style="padding: 10px; border: 1px solid #eee;"><strong>NIF</strong></td><td style="padding: 10px; border: 1px solid #eee;">${intervention.client.nif}</td></tr>
          <tr style="background-color: #f9f9f9;"><td style="padding: 10px; border: 1px solid #eee;"><strong>Serviço</strong></td><td style="padding: 10px; border: 1px solid #eee;">${intervention.serviceType}</td></tr>
          <tr><td style="padding: 10px; border: 1px solid #eee;"><strong>Técnico</strong></td><td style="padding: 10px; border: 1px solid #eee;">${intervention.technician}</td></tr>
          <tr style="background-color: #f9f9f9;"><td style="padding: 10px; border: 1px solid #eee;"><strong>Equipamento</strong></td><td style="padding: 10px; border: 1px solid #eee;">${intervention.equipmentModel}</td></tr>
        </table>

        <div style="background-color: #f0fdf4; padding: 15px; border-radius: 4px; color: #14532d; font-size: 14px;">
          <strong>Notas Técnicas Finais:</strong><br>
          ${intervention.notes || 'Sem notas.'}
        </div>
      </div>
      <div style="background-color: #1a1612; color: #c4a57b; padding: 10px; text-align: center; font-size: 10px;">
        ALPHASAFE INTERNAL MANAGEMENT SYSTEM
      </div>
    </div>
  `;

  for (const email of officeEmails) {
    if (process.env.RESEND_API_KEY) {
      console.log(`[EMAIL] Sending billing notification to office: ${email}`);
    } else {
      console.log(`[EMAIL SIMULATION] 
        TO: ${email} (ADMINISTRAÇÃO)
        SUBJECT: ${subject}
        CONTENT: Professional Billing Template.
      `);
    }
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Auth
  await setupAuth(app);
  registerAuthRoutes(app);

  // Clients
  app.get(api.clients.list.path, isAuthenticated, async (req, res) => {
    const search = req.query.search as string | undefined;
    const clients = await storage.getClients(search);
    res.json(clients);
  });

  app.get(api.clients.get.path, isAuthenticated, async (req, res) => {
    const client = await storage.getClient(Number(req.params.id));
    if (!client) {
      return res.status(404).json({ message: 'Cliente não encontrado' });
    }
    res.json(client);
  });

  app.post(api.clients.create.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.clients.create.input.parse(req.body);
      const client = await storage.createClient(input);
      res.status(201).json(client);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.put(api.clients.update.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.clients.update.input.parse(req.body);
      const updated = await storage.updateClient(Number(req.params.id), input);
      if (!updated) return res.status(404).json({ message: "Cliente não encontrado" });
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Interventions
  app.get(api.interventions.list.path, isAuthenticated, async (req, res) => {
    const filters = {
      status: req.query.status as string | undefined,
      technician: req.query.technician as string | undefined,
      clientId: req.query.clientId ? Number(req.query.clientId) : undefined
    };
    const interventions = await storage.getInterventions(filters);
    res.json(interventions);
  });

  // Technicians
  app.get("/api/technicians", isAuthenticated, async (req, res) => {
    const techs = await storage.getTechnicians();
    res.json(techs);
  });

  app.post("/api/technicians", isAuthenticated, async (req: any, res) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Acesso negado" });
    }
    try {
      const input = insertTechnicianSchema.parse(req.body);
      const technician = await storage.createTechnician(input);
      res.status(201).json(technician);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Erro ao criar funcionário" });
    }
  });

  app.delete("/api/technicians/:id", isAuthenticated, async (req: any, res) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Acesso negado" });
    }
    try {
      await storage.deleteTechnician(Number(req.params.id));
      res.sendStatus(204);
    } catch (err) {
      res.status(500).json({ message: "Erro ao remover funcionário" });
    }
  });

  app.put("/api/technicians/:id", isAuthenticated, async (req: any, res) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Acesso negado" });
    }
    try {
      const id = Number(req.params.id);
      const input = insertTechnicianSchema.partial().parse(req.body);
      const updated = await storage.updateTechnician(id, input);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Erro ao atualizar funcionário" });
    }
  });

  app.get(api.interventions.get.path, isAuthenticated, async (req, res) => {
    const intervention = await storage.getIntervention(Number(req.params.id));
    if (!intervention) {
      return res.status(404).json({ message: 'Intervenção não encontrada' });
    }
    res.json(intervention);
  });

  app.post(api.interventions.create.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.interventions.create.input.parse(req.body);
      const intervention = await storage.createIntervention(input);

      // Notify technician via email if assigned
      if (intervention.technician) {
        const fullIntervention = await storage.getIntervention(intervention.id);
        if (fullIntervention) {
          const isAssistance = intervention.status === "Assistência";
          sendAssignmentEmail(intervention.technician, fullIntervention, isAssistance).catch(console.error);
        }
      }

      res.status(201).json(intervention);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.put(api.interventions.update.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.interventions.update.input.parse(req.body);
      const oldIntervention = await storage.getIntervention(Number(req.params.id));
      const updated = await storage.updateIntervention(Number(req.params.id), input);
      if (!updated) return res.status(404).json({ message: "Intervenção não encontrada" });

      const fullIntervention = await storage.getIntervention(updated.id);
      if (!fullIntervention) return res.json(updated);

      // If technician changed or was assigned, send email
      if (input.technician && input.technician !== oldIntervention?.technician) {
        const isAssistance = input.status === "Assistência" || oldIntervention?.status === "Assistência";
        sendAssignmentEmail(input.technician, fullIntervention, isAssistance).catch(console.error);
      }

      // Notify technician specifically for Assistance requests
      if (input.status === "Assistência" && oldIntervention?.status !== "Assistência") {
        if (fullIntervention.technician) {
          sendAssignmentEmail(fullIntervention.technician, fullIntervention, true).catch(console.error);
          sendPushNotification(fullIntervention.technician, fullIntervention).catch(console.error);
        }
      }

      // Notify billing office if status changed to "A faturar"
      if (input.status === "A faturar" && oldIntervention?.status !== "A faturar") {
        sendBillingNotification(fullIntervention).catch(console.error);
      }

      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/interventions/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteIntervention(Number(req.params.id));
      res.sendStatus(204);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Simple Photo Upload
  app.post('/api/photos', isAuthenticated, async (req, res) => {
    try {
      const input = insertPhotoSchema.parse(req.body);
      const photo = await storage.addPhoto(input);
      res.status(201).json(photo);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete('/api/photos/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deletePhoto(Number(req.params.id));
      res.sendStatus(204);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // User Management API
  app.get("/api/users", isAuthenticated, async (req: any, res) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Forbidden" });
    }
    const users = await db.select().from(usersTable);
    res.json(users);
  });

  app.post("/api/users", isAuthenticated, async (req: any, res) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Forbidden" });
    }
    try {
      const { email, password, firstName, lastName, role } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await authStorage.upsertUser({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role,
      });
      res.status(201).json(user);
    } catch (err) {
      res.status(500).json({ message: "Erro ao criar utilizador" });
    }
  });

  return httpServer;
}

import bcrypt from "bcryptjs";
import { db } from "./db";

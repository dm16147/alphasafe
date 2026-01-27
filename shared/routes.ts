import { z } from 'zod';
import { insertClientSchema, insertInterventionSchema, clients, interventions, photos } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  clients: {
    list: {
      method: 'GET' as const,
      path: '/api/clients',
      input: z.object({
        search: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof clients.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/clients/:id',
      responses: {
        200: z.custom<typeof clients.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/clients',
      input: insertClientSchema,
      responses: {
        201: z.custom<typeof clients.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/clients/:id',
      input: insertClientSchema.partial(),
      responses: {
        200: z.custom<typeof clients.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  interventions: {
    list: {
      method: 'GET' as const,
      path: '/api/interventions',
      input: z.object({
        status: z.string().optional(),
        technician: z.string().optional(),
        clientId: z.coerce.number().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof interventions.$inferSelect & { client: typeof clients.$inferSelect, photos: typeof photos.$inferSelect[] }>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/interventions/:id',
      responses: {
        200: z.custom<typeof interventions.$inferSelect & { client: typeof clients.$inferSelect, photos: typeof photos.$inferSelect[] }>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/interventions',
      input: insertInterventionSchema,
      responses: {
        201: z.custom<typeof interventions.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/interventions/:id',
      input: insertInterventionSchema.partial(),
      responses: {
        200: z.custom<typeof interventions.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

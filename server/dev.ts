import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import 'dotenv/config';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { app as api } from '../api/route.js';

const app = new Hono();

app.use('*', logger());
app.route('/', api);

if (process.env.NODE_ENV === 'production') {
  app.use('/*', serveStatic({ root: './dist/public' }));
  app.get('*', serveStatic({ path: './dist/public/index.html' }));
}

const port = parseInt(process.env.PORT || '5000', 10);
console.log(`🚀 API server running on http://localhost:${port}`);

serve({ fetch: app.fetch, port });

export default app;

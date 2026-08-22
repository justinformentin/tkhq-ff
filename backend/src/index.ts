import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';
import authRouter from './routes/auth';
import flagsRouter from './routes/flags';
import orgsRouter from './routes/orgs';
import rateLimitsRouter from './routes/rateLimits';
import serviceControlRouter from './routes/serviceControl';
import { errorHandler } from './middleware/errorHandler';
import { requireIdentity } from './auth/identity';
import { getOidcConfig } from './auth/oidc';
import { startLoopbackListener } from './auth/loopback';
import { DEFAULT_ENVIRONMENT, listEnvironments } from './config/environments';

const app = express();
const PORT = process.env.PORT || 3001;

// Credentials are a session cookie, so a wildcard origin would be both
// rejected by browsers and unsafe. Deployments name their own origin.
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? true,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// API routes
app.use('/api/auth', authRouter);
app.use('/api/flags', requireIdentity, flagsRouter);
app.use('/api/orgs', requireIdentity, orgsRouter);
app.use('/api/rate-limits', requireIdentity, rateLimitsRouter);
// Service Control: destructive, engineering-only — scale k8s replicas and
// redirect traffic. Requires service:admin RBAC on the operator agent side.
app.use('/api/services', requireIdentity, serviceControlRouter);

// Environments the UI can switch between.
app.get('/api/environments', (_req, res) => {
  res.json({
    environments: listEnvironments().map(({ name, production }) => ({
      name,
      production,
    })),
    default: DEFAULT_ENVIRONMENT,
  });
});

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Serve frontend static files in production
// (frontend/dist is relative to the compiled backend's location)
const FRONTEND_DIST = path.join(__dirname, '../../frontend/dist');
app.use(express.static(FRONTEND_DIST));
app.get('*', (_req, res) => {
  res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
});

// Error handler (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
  const oidc = getOidcConfig();
  console.log(
    `Sign-in: ${oidc.loopback ? 'loopback (local dev)' : oidc.redirectUri}`
  );
  if (oidc.loopback) startLoopbackListener(oidc);
  console.log(`Default environment: ${DEFAULT_ENVIRONMENT}`);
  for (const { name, transport, target } of listEnvironments()) {
    console.log(`  ${name.padEnd(8)} ${transport.padEnd(5)} ${target}`);
  }
});

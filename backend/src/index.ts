import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import flagsRouter from './routes/flags';
import orgsRouter from './routes/orgs';
import { errorHandler } from './middleware/errorHandler';
import { DEFAULT_ENVIRONMENT, listEnvironments } from './config/environments';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// API routes
app.use('/api/flags', flagsRouter);
app.use('/api/orgs', orgsRouter);

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
  console.log(`Default environment: ${DEFAULT_ENVIRONMENT}`);
  for (const { name, transport, target } of listEnvironments()) {
    console.log(`  ${name.padEnd(8)} ${transport.padEnd(5)} ${target}`);
  }
});

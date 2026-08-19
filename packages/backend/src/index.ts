import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import {
  Environment,
  listFlags,
  getFlag,
  setFlag,
  allowOrg,
  disallowOrg,
  removeOrg,
  allowProduct,
  disallowProduct,
  removeProduct,
} from "./tkinfra";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

function getEnv(req: Request): Environment {
  const env = (req.query.env as string) || "local";
  const validEnvs: Environment[] = ["local", "dev", "staging", "prod"];
  return validEnvs.includes(env as Environment)
    ? (env as Environment)
    : "local";
}

// GET /api/flags — list all flags
app.get("/api/flags", (req: Request, res: Response, next: NextFunction) => {
  try {
    const env = getEnv(req);
    const flags = listFlags(env);
    res.json({ flags, env });
  } catch (err) {
    next(err);
  }
});

// GET /api/flags/:flag — get flag detail
app.get(
  "/api/flags/:flag",
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const env = getEnv(req);
      const detail = getFlag(req.params.flag, env);
      res.json(detail);
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/flags/:flag/set — set enabled/percent
app.post(
  "/api/flags/:flag/set",
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const env = getEnv(req);
      const { enabled, percent } = req.body as {
        enabled?: boolean;
        percent?: number;
      };
      setFlag(req.params.flag, env, enabled, percent);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/flags/:flag/org/allow — add org to allow list
app.post(
  "/api/flags/:flag/org/allow",
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const env = getEnv(req);
      const { orgId } = req.body as { orgId: string };
      if (!orgId) {
        res.status(400).json({ error: "orgId required" });
        return;
      }
      allowOrg(req.params.flag, env, orgId);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/flags/:flag/org/disallow — add org to disallow list
app.post(
  "/api/flags/:flag/org/disallow",
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const env = getEnv(req);
      const { orgId } = req.body as { orgId: string };
      if (!orgId) {
        res.status(400).json({ error: "orgId required" });
        return;
      }
      disallowOrg(req.params.flag, env, orgId);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/flags/:flag/org/:uuid — remove org from list
app.delete(
  "/api/flags/:flag/org/:uuid",
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const env = getEnv(req);
      removeOrg(req.params.flag, env, req.params.uuid);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/flags/:flag/product/allow
app.post(
  "/api/flags/:flag/product/allow",
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const env = getEnv(req);
      const { type, subType } = req.body as {
        type: string;
        subType?: string;
      };
      if (!type) {
        res.status(400).json({ error: "type required" });
        return;
      }
      allowProduct(req.params.flag, env, type, subType);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/flags/:flag/product/disallow
app.post(
  "/api/flags/:flag/product/disallow",
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const env = getEnv(req);
      const { type, subType } = req.body as {
        type: string;
        subType?: string;
      };
      if (!type) {
        res.status(400).json({ error: "type required" });
        return;
      }
      disallowProduct(req.params.flag, env, type, subType);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/flags/:flag/product — remove product rule
app.delete(
  "/api/flags/:flag/product",
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const env = getEnv(req);
      const type = req.query.type as string;
      const subType = req.query.subType as string | undefined;
      if (!type) {
        res.status(400).json({ error: "type query param required" });
        return;
      }
      removeProduct(req.params.flag, env, type, subType);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }
);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.message);
  res.status(500).json({ error: err.message });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});

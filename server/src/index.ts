import 'dotenv/config'
import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import authRouter from './auth/routes.js'
import { getServerConfig } from './config.js'

const config = getServerConfig()
const app = express()

app.use(
  cors({
    origin: config.corsOrigin ?? true,
    credentials: true,
  })
)
app.use(express.json())
app.use(cookieParser())

// Mount auth routes (handles /api/auth/me, /auth/login, /auth/callback, /auth/logout)
app.use(authRouter)

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.listen(config.port, () => {
  console.log(`BFF server running on port ${config.port}`)
  console.log(`OIDC issuer: ${config.oidc.issuer}`)
  console.log(`Redirect URI: ${config.oidc.redirectUri}`)
})

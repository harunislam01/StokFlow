import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import dotenv from 'dotenv';

import authRoutes from './routes/auth';
import categoryRoutes from './routes/categories';
import productRoutes from './routes/products';
import stockRoutes from './routes/stock';
import userRoutes from './routes/users';
import notificationRoutes from './routes/notifications';
import auditRoutes from './routes/audit';
import dashboardRoutes from './routes/dashboard';
import projectRoutes from './routes/projects';
import supplierRoutes from './routes/suppliers';
import reportRoutes from './routes/reports';

import { doubleSubmitCookieCSRF } from './middlewares/csrf';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

// Behind Nginx / reverse proxy: trust the first proxy so rate limiting and
// cookies see the real client IP and protocol.
app.set('trust proxy', 1);
app.disable('x-powered-by');

// Security headers
app.use(helmet());

// CORS: explicit allow-list via CORS_ORIGIN (comma separated).
// Same-origin deployments (Nginx /api proxy) need no CORS at all.
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: allowedOrigins.length > 0 ? allowedOrigins : (isProduction ? false : true),
  credentials: true
}));

app.use(express.json({ limit: '5mb' }));
app.use(cookieParser());
app.use(doubleSubmitCookieCSRF);

// Rate limiting configurations
const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // 5 requests per minute
  message: { error: 'Çok fazla giriş denemesi. Lütfen bir dakika sonra tekrar deneyin.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per 15 minutes
  message: { error: 'Çok fazla istek gönderildi. Lütfen daha sonra tekrar deneyin.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', apiLimiter);
app.use('/api/login', authLimiter);
app.use('/api/refresh-token', authLimiter);

// Routes registration
app.use('/api', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/reports', reportRoutes);

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    env: process.env.NODE_ENV || 'development',
    uptime: Math.round(process.uptime()),
    timestamp: new Date()
  });
});

// Unknown API routes return JSON instead of the HTML error page
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'İstenen endpoint bulunamadı' });
});

// Central error handler: never leak stack traces to the client
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[server]: Unhandled error:', err);
  res.status(500).json({ error: 'Sunucu hatası oluştu' });
});

const server = app.listen(PORT, () => {
  console.log(`[server]: Server is running at http://localhost:${PORT} (${process.env.NODE_ENV || 'development'})`);
});

// Graceful shutdown so container restarts don't cut active requests
const shutdown = (signal: string) => {
  console.log(`[server]: ${signal} alındı, kapatılıyor...`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

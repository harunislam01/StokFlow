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

import { doubleSubmitCookieCSRF } from './middlewares/csrf';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security headers
app.use(helmet());

// Enable CORS with credentials for local dev and production
app.use(cors({
  origin: true, // Allow all origins dynamically with credentials
  credentials: true
}));

app.use(express.json());
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

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

app.listen(PORT, () => {
  console.log(`[server]: Server is running at http://localhost:${PORT}`);
});

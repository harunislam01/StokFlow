import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkeyforstoksystem_2026_stok_electrom';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    username: string;
    role: 'ADMIN' | 'USER';
  };
}

export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1]; // Bearer TOKEN

    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(401).json({ error: 'Geçersiz veya süresi dolmuş token' });
      }

      (req as AuthenticatedRequest).user = user as any;
      next();
    });
  } else {
    res.status(401).json({ error: 'Yetkilendirme başlığı eksik' });
  }
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.user || authReq.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Bu işlem için yönetici yetkisi gereklidir' });
  }
  next();
};

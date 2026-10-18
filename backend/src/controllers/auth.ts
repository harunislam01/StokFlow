import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkeyforstoksystem_2026_stok_electrom';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'supersecretrefreshjwtkeyforstoksystem_2026_refresh';

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password, rememberMe } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Kullanıcı adı ve şifre zorunludur' });
    }

    const user = await prisma.user.findFirst({
      where: {
        username,
        isActive: true,
        deletedAt: null
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Hatalı kullanıcı adı veya şifre' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Hatalı kullanıcı adı veya şifre' });
    }

    // Generate tokens
    const userPayload = { id: user.id, username: user.username, role: user.role };
    const accessToken = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '15m' });
    
    const refreshExpiresIn = rememberMe ? '30d' : '7d';
    const refreshToken = jwt.sign(userPayload, JWT_REFRESH_SECRET, { expiresIn: refreshExpiresIn });

    const maxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge
    });

    res.json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      },
      accessToken
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Sunucu hatası oluştu' });
  }
};

export const logout = async (req: Request, res: Response) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
  res.json({ success: true, message: 'Başarıyla çıkış yapıldı' });
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const token = req.cookies.refreshToken;

    if (!token) {
      return res.status(401).json({ error: 'Refresh token gereklidir' });
    }

    jwt.verify(token, JWT_REFRESH_SECRET, (err: any, decoded: any) => {
      if (err) {
        return res.status(401).json({ error: 'Geçersiz veya süresi dolmuş refresh token' });
      }

      const userPayload = { id: decoded.id, username: decoded.username, role: decoded.role };
      const newAccessToken = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '15m' });

      res.json({ accessToken: newAccessToken });
    });
  } catch (error: any) {
    console.error('Refresh token error:', error);
    res.status(500).json({ error: 'Sunucu hatası oluştu' });
  }
};

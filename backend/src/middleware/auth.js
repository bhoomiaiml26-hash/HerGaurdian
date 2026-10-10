import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';

const stripPassword = (user) => {
  if (!user) return null;
  const { password, ...rest } = user;
  return rest;
};

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no token provided',
      });
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'herguardian-dev-secret';
    const decoded = jwt.verify(token, secret);

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    req.user = stripPassword(user);

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Not authorized, invalid token',
    });
  }
};

export default protect;

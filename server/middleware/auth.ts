import { Request, Response, NextFunction } from "express";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  console.log('requireAuth middleware, session:', req.session);
  console.log('requireAuth middleware, adminId:', req.session?.adminId);
  console.log('requireAuth middleware, cookies:', req.headers.cookie);
  
  if (!req.session || typeof req.session.adminId === 'undefined') {
    console.log('requireAuth middleware: Unauthorized');
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  console.log('requireAuth middleware: Authorized');
  next();
}

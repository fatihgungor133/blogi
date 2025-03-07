import { Request, Response, NextFunction } from "express";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session || typeof req.session.adminId === 'undefined') {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  next();
}

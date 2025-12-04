import { NextFunction, Response } from "express";
import { AuthRequest } from "../types/http";
export declare const authenticate: (req: AuthRequest, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
//# sourceMappingURL=auth.d.ts.map
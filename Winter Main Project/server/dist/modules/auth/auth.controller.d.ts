import { Response } from "express";
import { AuthRequest } from "../../types/http";
export declare const signup: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const login: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=auth.controller.d.ts.map
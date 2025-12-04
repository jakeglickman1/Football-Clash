import { NextFunction, Request, Response } from "express";
export declare class AppError extends Error {
    statusCode: number;
    constructor(message: string, statusCode?: number);
}
export declare const errorHandler: (err: Error | AppError, _req: Request, res: Response, _next: NextFunction) => void;
//# sourceMappingURL=errorHandler.d.ts.map
import { AuthenticatedUser } from "../types/http";
interface TokenPayload extends AuthenticatedUser {
    iat?: number;
    exp?: number;
}
export declare const signToken: (payload: AuthenticatedUser) => string;
export declare const verifyToken: (token: string) => TokenPayload;
export {};
//# sourceMappingURL=jwt.d.ts.map
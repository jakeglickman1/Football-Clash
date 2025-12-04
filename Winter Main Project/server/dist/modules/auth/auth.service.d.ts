export interface SignupInput {
    email: string;
    password: string;
    name?: string;
}
export interface LoginInput {
    email: string;
    password: string;
}
export declare const signup: ({ email, password, name }: SignupInput) => Promise<{
    token: string;
    user: {
        id: string;
        email: string;
        name: string | null;
    };
}>;
export declare const login: ({ email, password }: LoginInput) => Promise<{
    token: string;
    user: {
        id: string;
        email: string;
        name: string | null;
    };
}>;
//# sourceMappingURL=auth.service.d.ts.map
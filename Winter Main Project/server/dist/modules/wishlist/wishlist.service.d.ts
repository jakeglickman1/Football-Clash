export interface WishlistInput {
    destination: string;
    country?: string;
    tags?: string[];
    notes?: string;
    visited?: boolean;
}
export declare const listItems: (userId: string) => Promise<any[]>;
export declare const createItem: (userId: string, data: WishlistInput) => Promise<any>;
export declare const updateItem: (userId: string, itemId: string, data: Partial<WishlistInput>) => Promise<any>;
export declare const deleteItem: (userId: string, itemId: string) => Promise<{
    success: boolean;
}>;
//# sourceMappingURL=wishlist.service.d.ts.map
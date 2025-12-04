export interface TripInput {
    destination: string;
    country: string;
    startDate: string;
    endDate: string;
    notes?: string;
}
export interface HighlightInput {
    title: string;
    caption?: string;
    photos?: string[];
    occurredAt?: string;
}
export declare const listTrips: (userId: string) => Promise<any[]>;
export declare const getTripById: (userId: string, tripId: string) => Promise<any>;
export declare const createTrip: (userId: string, data: TripInput) => Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    destination: string;
    country: string;
    startDate: Date;
    endDate: Date;
    notes: string | null;
}>;
export declare const addHighlight: (userId: string, tripId: string, data: HighlightInput) => Promise<any>;
//# sourceMappingURL=trip.service.d.ts.map
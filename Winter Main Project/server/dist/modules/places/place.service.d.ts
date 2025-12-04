export declare const listVisitedPlaces: (userId: string, tripId?: string) => Promise<{
    photos: string[];
    name: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    country: string;
    caption: string | null;
    tripId: string | null;
    latitude: number;
    longitude: number;
    city: string;
    visitDate: Date | null;
}[]>;
//# sourceMappingURL=place.service.d.ts.map
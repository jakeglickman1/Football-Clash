export interface ActivityRecommendation {
    id: string;
    name: string;
    category: string;
    durationHours: number;
    latitude: number;
    longitude: number;
    description?: string;
}
export interface EventRecommendation {
    id: string;
    name: string;
    venue: string;
    date: string;
    link?: string;
}
interface PlannerInput {
    destination: string;
    interests: string[];
}
export declare const fetchActivities: ({ destination, interests, }: PlannerInput) => Promise<ActivityRecommendation[]>;
export declare const fetchEvents: ({ destination, interests, }: PlannerInput) => Promise<EventRecommendation[]>;
export {};
//# sourceMappingURL=events.d.ts.map
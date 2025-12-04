import { ActivityRecommendation, EventRecommendation } from "../../services/external/events";
export interface PlannerInput {
    destination: string;
    startDate: string;
    endDate: string;
    interests: string[];
}
export interface PlannerResponse {
    destination: string;
    startDate: string;
    endDate: string;
    lengthOfStay: number;
    activities: ActivityRecommendation[];
    events: EventRecommendation[];
}
export declare const getRecommendations: (params: PlannerInput) => Promise<PlannerResponse>;
//# sourceMappingURL=planner.service.d.ts.map
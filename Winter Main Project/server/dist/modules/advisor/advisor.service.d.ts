export interface AdvisorInput {
    destination: string;
    startDate: string;
    endDate: string;
    travelers?: number;
    stayType?: string;
}
export declare const runAdvisorSearch: (params: AdvisorInput) => Promise<{
    flights: import("../../services/external/flights").FlightOption[];
    hotels: import("../../services/external/hotels").HotelOption[];
    notes: string[];
}>;
//# sourceMappingURL=advisor.service.d.ts.map
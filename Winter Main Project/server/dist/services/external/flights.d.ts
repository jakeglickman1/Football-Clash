export interface FlightSearchInput {
    origin?: string;
    destination: string;
    startDate: string;
    endDate: string;
}
export interface FlightOption {
    id: string;
    airline: string;
    from: string;
    to: string;
    departure: string;
    arrival: string;
    durationHours: number;
    price: number;
}
export declare const searchFlights: (params: FlightSearchInput) => Promise<FlightOption[]>;
//# sourceMappingURL=flights.d.ts.map
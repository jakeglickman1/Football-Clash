export interface HotelSearchInput {
    destination: string;
    startDate: string;
    endDate: string;
    stayType?: string;
}
export interface HotelOption {
    id: string;
    name: string;
    neighborhood: string;
    rating: number;
    pricePerNight: number;
    totalPrice: number;
    imageUrl: string;
}
export declare const searchHotels: (params: HotelSearchInput) => Promise<HotelOption[]>;
//# sourceMappingURL=hotels.d.ts.map
export interface Holiday {
    holiday_id: number;
    holiday_date: string; // ISO Date string (YYYY-MM-DD)
    description: string;
    created_at?: Date;
}

export interface CreateHolidayDTO {
    holiday_date: string;
    description: string;
}

export interface UpdateHolidayDTO {
    holiday_date?: string;
    description?: string;
}

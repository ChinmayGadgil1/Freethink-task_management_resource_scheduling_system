export type DayOfWeek =
    | "MONDAY"
    | "TUESDAY"
    | "WEDNESDAY"
    | "THURSDAY"
    | "FRIDAY"
    | "SATURDAY"
    | "SUNDAY";

export interface ResourceScheduleDTO {
    user_id: number;
    non_working_days: DayOfWeek[];
    working_days: DayOfWeek[];
    daily_working_hours: number;
    is_custom: boolean;
    schedule_configured: boolean;
}

export interface UpdateResourceScheduleDTO {
    non_working_days: DayOfWeek[];
    daily_working_hours?: number;
}

export type AvailabilityStatus =
    | "AVAILABLE"
    | "PARTIALLY_AVAILABLE"
    | "FULLY_BOOKED"
    | "ON_LEAVE"
    | "PARTIAL_LEAVE"
    | "HOLIDAY"
    | "NON_WORKING_DAY";

export interface DailyAvailabilityDTO {
    date: string;
    weekday: string;
    daily_working_hours: number;
    leave_hours: number;
    allocated_hours: number;
    available_hours: number;
    status: AvailabilityStatus;
}

export interface ResourceAvailabilityResponseDTO {
    user_id: number;
    name: string;
    daily_working_hours: number;
    non_working_days: DayOfWeek[];
    start_date: string;
    end_date: string;
    total_available_hours: number;
    total_allocated_hours: number;
    days: DailyAvailabilityDTO[];
}

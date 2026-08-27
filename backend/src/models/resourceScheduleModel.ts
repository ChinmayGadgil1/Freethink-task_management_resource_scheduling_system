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
}

export interface UpdateResourceScheduleDTO {
    non_working_days: DayOfWeek[];
    daily_working_hours?: number;
}

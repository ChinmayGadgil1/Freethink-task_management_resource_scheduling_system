export interface SupportTicket {
    ticket_id: number;
    user_id: number;
    name: string;
    email: string;
    category: string;
    description: string;
    status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
    created_at?: Date | string;
}

export interface CreateTicketDTO {
    user_id: number;
    name: string;
    email: string;
    category: string;
    description: string;
}

export interface Stage {
    id: string;
    pipeline_id: string;
    name: string;
    color: string;
    order: number;
}

export interface Pipeline {
    id: string;
    name: string;
    created_at: string;
}

export interface Lead {
    id: string;
    name: string;
    email: string;
    phone: string;
    company?: string;
    source?: string;
    status: string;
    priority?: string;
    budget?: number;
    assigned_to?: string;
    interested_service?: string;
    next_follow_up?: string;
    notes?: string;
    created_at?: string;
    pipeline_id?: string;
    stage_id?: string;
    // Extended fields (from joins/views)
    pipeline_name?: string;
    stage_color?: string;
}

export type UserRole = 'Admin' | 'Sales Manager' | 'Sales Executive';

export interface Profile {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    created_at: string;
}

export interface Lead {
    id: string;
    name: string;
    email: string;
    phone: string;
    source: string;
    status: 'Enquiry' | 'Contacted' | 'Quotation Sent' | 'Payment Done';
    priority: 'Low' | 'Medium' | 'High';
    interested_service?: string;
    budget?: number;
    assigned_to?: string;
    next_follow_up?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
}

export interface LeadActivity {
    id: string;
    lead_id: string;
    action_type: string;
    description: string;
    created_at: string;
}

export interface AutomationRule {
    id: string;
    rule_type: string;
    condition: any;
    action: any;
    is_active: boolean;
    created_at: string;
}

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: Profile;
                Insert: Omit<Profile, 'created_at'>;
                Update: Partial<Omit<Profile, 'created_at'>>;
            };
            leads: {
                Row: Lead;
                Insert: Omit<Lead, 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Omit<Lead, 'id' | 'created_at' | 'updated_at'>>;
            };
            lead_activities: {
                Row: LeadActivity;
                Insert: Omit<LeadActivity, 'id' | 'created_at'>;
                Update: Partial<Omit<LeadActivity, 'id' | 'created_at'>>;
            };
            automation_rules: {
                Row: AutomationRule;
                Insert: Omit<AutomationRule, 'id' | 'created_at'>;
                Update: Partial<Omit<AutomationRule, 'id' | 'created_at'>>;
            };
        };
    };
}

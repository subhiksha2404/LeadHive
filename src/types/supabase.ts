import { Pipeline, Stage, Lead } from './lead';

export type UserRole = 'Admin' | 'Sales Manager' | 'Sales Executive';

export interface Profile {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    created_at: string;
}

export interface Contact {
    id: string;
    name: string;
    email: string;
    phone?: string;
    company?: string;
    form_id: string;
    form_name: string;
    form_data: any;
    created_at: string;
    user_id: string;
}

export interface LeadForm {
    id: string;
    name: string;
    fields: any;
    visits: number;
    submissions: number;
    created_at: string;
    user_id: string;
    jotform_id?: string;
    jotform_url?: string;
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
                Row: Lead & { user_id: string };
                Insert: Omit<Lead, 'id'> & { user_id: string };
                Update: Partial<Lead & { user_id: string }>;
            };
            pipelines: {
                Row: Pipeline & { user_id: string };
                Insert: Omit<Pipeline, 'id' | 'created_at'> & { user_id: string };
                Update: Partial<Pipeline & { user_id: string }>;
            };
            pipeline_stages: {
                Row: Stage;
                Insert: Omit<Stage, 'id'>;
                Update: Partial<Stage>;
            };
            lead_forms: {
                Row: LeadForm;
                Insert: Omit<LeadForm, 'id' | 'created_at' | 'visits' | 'submissions'>;
                Update: Partial<LeadForm>;
            };
            contacts: {
                Row: Contact;
                Insert: Omit<Contact, 'id' | 'created_at'>;
                Update: Partial<Contact>;
            };
        };
    };
}

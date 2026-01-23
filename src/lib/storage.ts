
export interface Lead {
    id: string;
    name: string;
    email: string;
    phone: string;
    company?: string;
    source?: string;
    status: string;
    priority?: string;
    budget?: number; // allow string or number handling in form, but storage should ideally be consistent
    assigned_to?: string;
    interested_service?: string;
    next_follow_up?: string;
    notes?: string;
    created_at?: string;
}

const INITIAL_LEADS: Lead[] = [];

const STORAGE_KEY = 'leadhive_leads_v2';

export const leadsService = {
    getLeads: (): Lead[] => {
        if (typeof window === 'undefined') return INITIAL_LEADS;

        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_LEADS));
            return INITIAL_LEADS;
        }
        try {
            return JSON.parse(stored);
        } catch (e) {
            console.error('Failed to parse leads from storage', e);
            return INITIAL_LEADS;
        }
    },

    getLeadById: (id: string): Lead | undefined => {
        const leads = leadsService.getLeads();
        return leads.find(l => l.id === id);
    },

    updateLead: (id: string, updates: Partial<Lead>): Lead | null => {
        const leads = leadsService.getLeads();
        const index = leads.findIndex(l => l.id === id);
        if (index === -1) return null;

        const updatedLead = { ...leads[index], ...updates };
        leads[index] = updatedLead;

        if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
        }

        // Dispatch a custom event so other components can react if they listen
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('leads-updated'));
        }

        return updatedLead;
    },

    addLead: (lead: Omit<Lead, 'id'>): Lead => {
        const leads = leadsService.getLeads();
        const newLead = {
            ...lead,
            id: Math.random().toString(36).substr(2, 9),
            created_at: new Date().toISOString()
        };

        const updatedLeads = [newLead, ...leads];

        if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLeads));
            window.dispatchEvent(new Event('leads-updated'));
        }

        return newLead;
    },

    deleteLead: (id: string): boolean => {
        let leads = leadsService.getLeads();
        const initialLength = leads.length;
        leads = leads.filter(l => l.id !== id);

        if (leads.length !== initialLength) {
            if (typeof window !== 'undefined') {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
                window.dispatchEvent(new Event('leads-updated'));
            }
            return true;
        }
        return false;
    },

    // Reset to initial data (helper for debugging)
    resetData: () => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_LEADS));
            window.dispatchEvent(new Event('leads-updated'));
        }
    }
};

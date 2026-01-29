
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
}

const STORAGE_KEY = 'leadhive_leads_v3';
const PIPELINES_KEY = 'leadhive_pipelines';
const STAGES_KEY = 'leadhive_stages';
const FORMS_KEY = 'leadhive_forms';
const CONTACTS_KEY = 'leadhive_contacts';

export interface Form {
    id: string;
    name: string;
    custom_fields: {
        id: string;
        label: string;
        type: 'text' | 'email' | 'tel' | 'number' | 'textarea' | 'select';
        options?: string[];
        required: boolean;
    }[];
    created_at: string;
    visits: number;
    submissions: number;
}

export interface Contact {
    id: string;
    name: string;
    email: string;
    phone?: string;
    company?: string;
    form_id: string;
    form_name: string;
    form_data: Record<string, any>;
    created_at: string;
}

const INITIAL_LEADS: Lead[] = [];

export const leadsService = {
    // --- Leads ---
    getLeads: (): Lead[] => {
        if (typeof window === 'undefined') return INITIAL_LEADS;
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return INITIAL_LEADS;
        try {
            return JSON.parse(stored);
        } catch (e) {
            return INITIAL_LEADS;
        }
    },

    getLeadById: (id: string): Lead | undefined => {
        return leadsService.getLeads().find(l => l.id === id);
    },

    updateLead: (id: string, updates: Partial<Lead>): Lead | null => {
        const leads = leadsService.getLeads();
        const index = leads.findIndex(l => l.id === id);
        if (index === -1) return null;

        const updatedLead = { ...leads[index], ...updates };
        leads[index] = updatedLead;

        if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
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

    addLeadsBulk: (newLeads: Omit<Lead, 'id'>[]): void => {
        const leads = leadsService.getLeads();
        const preparedLeads = newLeads.map(l => ({
            ...l,
            id: Math.random().toString(36).substr(2, 9),
            created_at: new Date().toISOString()
        }));
        const updatedLeads = [...preparedLeads, ...leads];
        if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLeads));
            window.dispatchEvent(new Event('leads-updated'));
        }
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

    // --- Pipelines ---
    getPipelines: (): Pipeline[] => {
        if (typeof window === 'undefined') return [];
        const stored = localStorage.getItem(PIPELINES_KEY);
        if (!stored) return [];
        try {
            return JSON.parse(stored);
        } catch (e) {
            return [];
        }
    },

    ensureDefaultPipeline: (): Pipeline => {
        const pipelines = leadsService.getPipelines();
        if (pipelines.length > 0) return pipelines[0];

        const newPipeline = leadsService.createPipeline('Main Pipeline');
        const defaultStages = [
            { name: 'Enquiry', color: '#3b82f6', order: 1 },
            { name: 'Contacted', color: '#f59e0b', order: 2 },
            { name: 'Qualified', color: '#10b981', order: 3 },
            { name: 'Quotation Sent', color: '#8b5cf6', order: 4 },
            { name: 'Payment Done', color: '#10b981', order: 5 }
        ];
        defaultStages.forEach(s => leadsService.createStage({ ...s, pipeline_id: newPipeline.id }));
        return newPipeline;
    },

    createPipeline: (name: string): Pipeline => {
        const pipelines = leadsService.getPipelines();
        const newPipeline = {
            id: Math.random().toString(36).substr(2, 9),
            name,
            created_at: new Date().toISOString()
        };
        localStorage.setItem(PIPELINES_KEY, JSON.stringify([...pipelines, newPipeline]));
        return newPipeline;
    },

    updatePipeline: (id: string, name: string): Pipeline | null => {
        const pipelines = leadsService.getPipelines();
        const index = pipelines.findIndex(p => p.id === id);
        if (index === -1) return null;
        pipelines[index].name = name;
        localStorage.setItem(PIPELINES_KEY, JSON.stringify(pipelines));
        return pipelines[index];
    },

    deletePipeline: (id: string) => {
        let pipelines = leadsService.getPipelines();
        pipelines = pipelines.filter(p => p.id !== id);
        localStorage.setItem(PIPELINES_KEY, JSON.stringify(pipelines));
        // Also delete stages
        let stages = leadsService.getAllStages();
        stages = stages.filter(s => s.pipeline_id !== id);
        localStorage.setItem(STAGES_KEY, JSON.stringify(stages));
    },

    // --- Stages ---
    getAllStages: (): Stage[] => {
        if (typeof window === 'undefined') return [];
        const stored = localStorage.getItem(STAGES_KEY);
        if (!stored) return [];
        try {
            return JSON.parse(stored);
        } catch (e) {
            return [];
        }
    },

    getStages: (pipelineId: string): Stage[] => {
        return leadsService.getAllStages()
            .filter(s => s.pipeline_id === pipelineId)
            .sort((a, b) => a.order - b.order);
    },

    createStage: (stage: Omit<Stage, 'id'>): Stage => {
        const stages = leadsService.getAllStages();
        const newStage = {
            ...stage,
            id: Math.random().toString(36).substr(2, 9)
        };
        localStorage.setItem(STAGES_KEY, JSON.stringify([...stages, newStage]));
        return newStage;
    },

    updateStage: (id: string, updates: Partial<Stage>): Stage | null => {
        const stages = leadsService.getAllStages();
        const index = stages.findIndex(s => s.id === id);
        if (index === -1) return null;
        stages[index] = { ...stages[index], ...updates };
        localStorage.setItem(STAGES_KEY, JSON.stringify(stages));
        return stages[index];
    },

    deleteStage: (id: string) => {
        let stages = leadsService.getAllStages();
        stages = stages.filter(s => s.id !== id);
        localStorage.setItem(STAGES_KEY, JSON.stringify(stages));
    },

    resetData: () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(PIPELINES_KEY);
            localStorage.removeItem(STAGES_KEY);
            localStorage.removeItem(FORMS_KEY);
            localStorage.removeItem(CONTACTS_KEY);
            window.dispatchEvent(new Event('leads-updated'));
        }
    },

    // --- Forms ---
    getForms: (): Form[] => {
        if (typeof window === 'undefined') return [];
        const stored = localStorage.getItem(FORMS_KEY);
        if (!stored) return [];
        try {
            return JSON.parse(stored);
        } catch (e) {
            return [];
        }
    },

    getFormById: (id: string): Form | undefined => {
        return leadsService.getForms().find(f => f.id === id);
    },

    createForm: (form: Omit<Form, 'id' | 'created_at' | 'visits' | 'submissions'>): Form => {
        const forms = leadsService.getForms();
        const newForm = {
            ...form,
            id: Math.random().toString(36).substr(2, 9),
            created_at: new Date().toISOString(),
            visits: 0,
            submissions: 0
        };
        localStorage.setItem(FORMS_KEY, JSON.stringify([...forms, newForm]));
        return newForm;
    },

    updateForm: (id: string, updates: Partial<Form>): Form | null => {
        const forms = leadsService.getForms();
        const index = forms.findIndex(f => f.id === id);
        if (index === -1) return null;

        const updatedForm = { ...forms[index], ...updates };
        forms[index] = updatedForm;
        localStorage.setItem(FORMS_KEY, JSON.stringify(forms));
        return updatedForm;
    },

    deleteForm: (id: string) => {
        const forms = leadsService.getForms().filter(f => f.id !== id);
        localStorage.setItem(FORMS_KEY, JSON.stringify(forms));
    },

    incrementFormVisits: (id: string) => {
        const forms = leadsService.getForms();
        const index = forms.findIndex(f => f.id === id);
        if (index !== -1) {
            forms[index].visits += 1;
            localStorage.setItem(FORMS_KEY, JSON.stringify(forms));
        }
    },

    incrementFormSubmissions: (id: string) => {
        const forms = leadsService.getForms();
        const index = forms.findIndex(f => f.id === id);
        if (index !== -1) {
            forms[index].submissions += 1;
            localStorage.setItem(FORMS_KEY, JSON.stringify(forms));
        }
    },

    // --- Contacts ---
    getContacts: (): Contact[] => {
        if (typeof window === 'undefined') return [];
        const stored = localStorage.getItem(CONTACTS_KEY);
        if (!stored) return [];
        try {
            return JSON.parse(stored);
        } catch (e) {
            return [];
        }
    },

    addContact: (contact: Omit<Contact, 'id' | 'created_at'>): Contact => {
        const contacts = leadsService.getContacts();
        const newContact = {
            ...contact,
            id: Math.random().toString(36).substr(2, 9),
            created_at: new Date().toISOString()
        };
        const updatedContacts = [newContact, ...contacts];
        localStorage.setItem(CONTACTS_KEY, JSON.stringify(updatedContacts));
        return newContact;
    },

    deleteContact: (id: string) => {
        const contacts = leadsService.getContacts().filter(c => c.id !== id);
        localStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts));
    }
};

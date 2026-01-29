
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
    jotform_id?: string;
    jotform_url?: string;
}

const normalizeValue = (val: any): string => {
    if (val === null || val === undefined) return '';
    if (typeof val === 'object') {
        if (val.first || val.last) {
            return [val.prefix, val.first, val.middle, val.last, val.suffix].filter(Boolean).join(' ');
        }
        if (val.area || val.phone) {
            return val.area ? `(${val.area}) ${val.phone}` : val.phone;
        }
        if (val.addr_line1) {
            return [val.addr_line1, val.addr_line2, val.city, val.state, val.postal, val.country].filter(Boolean).join(', ');
        }
        return JSON.stringify(val);
    }
    return String(val);
};

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
            const raw = JSON.parse(stored);
            // Defensive normalization for existing data
            return raw.map((c: any) => ({
                ...c,
                name: normalizeValue(c.name),
                email: normalizeValue(c.email),
                phone: normalizeValue(c.phone),
                company: normalizeValue(c.company)
            }));
        } catch (e) {
            return [];
        }
    },

    addContact: (contact: Omit<Contact, 'id' | 'created_at'>): Contact => {
        const contacts = leadsService.getContacts();
        const newContact = {
            ...contact,
            name: normalizeValue(contact.name),
            email: normalizeValue(contact.email),
            phone: normalizeValue(contact.phone),
            company: normalizeValue(contact.company),
            id: Math.random().toString(36).substr(2, 9),
            created_at: new Date().toISOString()
        };
        const updatedContacts = [newContact, ...contacts];
        localStorage.setItem(CONTACTS_KEY, JSON.stringify(updatedContacts));

        if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('leads-updated'));
        }
        return newContact;
    },

    deleteContact: (id: string) => {
        const contacts = leadsService.getContacts().filter(c => c.id !== id);
        localStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts));

        if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('leads-updated'));
        }
    },

    createJotForm: async (formId: string): Promise<{ success: boolean, url?: string, error?: string }> => {
        const form = leadsService.getFormById(formId);
        if (!form) return { success: false, error: 'Form not found' };

        const JOTFORM_API_KEY = 'b154bee5868ed3e6ef4a9664a55e7465';
        const url = `https://api.jotform.com/user/forms?apiKey=${JOTFORM_API_KEY}`;

        const params = new URLSearchParams();
        params.append('properties[title]', form.name);

        form.custom_fields.forEach((field, index) => {
            const prefix = `questions[${index}]`;
            let jotType = 'control_textbox';

            switch (field.type) {
                case 'textarea': jotType = 'control_textarea'; break;
                case 'email': jotType = 'control_email'; break;
                case 'tel': jotType = 'control_phone'; break;
                case 'number': jotType = 'control_number'; break;
                case 'select': jotType = 'control_dropdown'; break;
            }

            params.append(`${prefix}[type]`, jotType);
            params.append(`${prefix}[text]`, field.label);
            params.append(`${prefix}[order]`, (index + 1).toString());
            params.append(`${prefix}[name]`, field.label.toLowerCase().replace(/[^a-z0-0]/g, '_'));

            if (field.required) {
                params.append(`${prefix}[required]`, 'Yes');
            }

            if (field.type === 'select' && field.options) {
                params.append(`${prefix}[options]`, field.options.join('|'));
            }
        });

        // Add Submit Button
        const submitIndex = form.custom_fields.length;
        const submitPrefix = `questions[${submitIndex}]`;
        params.append(`${submitPrefix}[type]`, 'control_button');
        params.append(`${submitPrefix}[text]`, 'Submit');
        params.append(`${submitPrefix}[order]`, (submitIndex + 1).toString());
        params.append(`${submitPrefix}[name]`, 'submit');
        params.append(`${submitPrefix}[buttonStyle]`, 'v3-deep-amber'); // Use a nice style

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: params
            });

            const data = await response.json();
            if (data.responseCode === 200) {
                // Store Jotform ID in the form object
                leadsService.updateForm(formId, {
                    jotform_id: data.content.id,
                    jotform_url: data.content.url
                });
                return { success: true, url: data.content.url };
            } else {
                return { success: false, error: data.message || 'Failed to create Jotform' };
            }
        } catch (error) {
            console.error('Jotform API Error:', error);
            return { success: false, error: 'An unexpected error occurred' };
        }
    },

    syncJotformSubmissions: async (): Promise<{ newContacts: number, error?: string }> => {
        if (typeof window === 'undefined') return { newContacts: 0 };

        const forms = leadsService.getForms().filter(f => f.jotform_id);
        const contacts = leadsService.getContacts();
        const JOTFORM_API_KEY = 'b154bee5868ed3e6ef4a9664a55e7465';
        let totalNew = 0;

        for (const form of forms) {
            try {
                const url = `https://api.jotform.com/form/${form.jotform_id}/submissions?apiKey=${JOTFORM_API_KEY}`;
                const response = await fetch(url);
                const data = await response.json();

                if (data.responseCode === 200) {
                    const submissions = data.content;

                    for (const sub of submissions) {
                        // Check if already exists (using Jotform submission ID as a unique check in form_data)
                        const exists = contacts.some(c => c.form_data?.jotform_submission_id === sub.id);
                        if (exists) continue;

                        // Create new contact from Jotform data
                        const answers = sub.answers;
                        let contactData: any = { jotform_submission_id: sub.id };
                        let name = 'Unknown';
                        let email = '';
                        let phone = '';
                        let company = '';

                        // Extract field values
                        Object.values(answers).forEach((ans: any) => {
                            if (!ans.answer) return;

                            const label = (ans.text || '').toLowerCase();
                            let val = normalizeValue(ans.answer);

                            if (label.includes('name')) name = val;
                            else if (label.includes('email')) email = val;
                            else if (label.includes('phone') || label.includes('tel')) phone = val;
                            else if (label.includes('company')) company = val;

                            // Map to internal field IDs if possible (though we don't have a perfect mapping here)
                            const field = form.custom_fields.find(f => f.label.toLowerCase() === label);
                            if (field) {
                                contactData[field.id] = val;
                            }
                        });

                        leadsService.addContact({
                            name,
                            email,
                            phone,
                            company,
                            form_id: form.id,
                            form_name: form.name + ' (Jotform)',
                            form_data: { ...contactData, jotform_raw: sub }
                        });
                        totalNew++;
                    }
                }
            } catch (err) {
                console.error(`Error syncing Jotform ${form.id}:`, err);
            }
        }

        return { newContacts: totalNew };
    }
};

import { Stage, Pipeline, Lead } from '@/types/lead';
import { supabase } from './supabase';

export type { Stage, Pipeline, Lead };

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
    form_data: Record<string, unknown>;
    created_at: string;
}

const sanitizeLeadForDb = (lead: any, userId?: string) => {
    const {
        id, created_at, updated_at,
        pipeline_name, stage_color,
        customFields, custom_fields,
        user_id, // Strip user_id to prevent accidental ownership changes on update
        ...rest
    } = lead;

    // Use specific whitelist of columns to avoid 400 errors from extra JSON data
    const validColumns = [
        'name', 'email', 'phone', 'company', 'source',
        'status', 'priority', 'budget', 'assigned_to',
        'interested_service', 'next_follow_up', 'notes',
        'pipeline_id', 'stage_id'
    ];

    const dbLead: any = {};
    if (userId) dbLead.user_id = userId;

    // Explicitly handle custom_fields mapping
    if (custom_fields !== undefined || customFields !== undefined) {
        dbLead.custom_fields = custom_fields || customFields || {};
    }

    validColumns.forEach(col => {
        if (rest[col] !== undefined) {
            let val = rest[col];
            // Normalize empty strings to null for specific types to avoid DB errors
            if (val === '') {
                if (col === 'budget' || col === 'next_follow_up' || col === 'assigned_to' || col === 'pipeline_id' || col === 'stage_id') {
                    val = null;
                }
            }
            dbLead[col] = val;
        }
    });

    // Support legacy field names if they exist in source
    if (rest.interested_model !== undefined && !dbLead.interested_service) {
        dbLead.interested_service = rest.interested_model;
    }

    return dbLead;
};

export const leadsService = {
    // --- Leads ---
    getLeads: async (): Promise<Lead[]> => {
        const { data, error } = await (supabase as any)
            .from('leads')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching leads:', error);
            return [];
        }
        return data as Lead[];
    },

    getLeadById: async (id: string): Promise<Lead | undefined> => {
        const { data, error } = await (supabase as any)
            .from('leads')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching lead:', error);
            return undefined;
        }
        return data as Lead;
    },

    updateLead: async (id: string, updates: Partial<Lead>): Promise<Lead | null> => {
        const dbUpdates = sanitizeLeadForDb(updates);

        const { data, error } = await (supabase as any)
            .from('leads')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating lead:', error);
            return null;
        }

        if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('leads-updated'));
        }
        return data as Lead;
    },

    addLead: async (lead: Omit<Lead, 'id'>): Promise<Lead | null> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data, error } = await (supabase as any)
            .from('leads')
            .insert([sanitizeLeadForDb(lead, user.id)])
            .select()
            .single();

        if (error) {
            console.error('Error adding lead:', error);
            return null;
        }

        if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('leads-updated'));
        }
        return data as Lead;
    },

    addLeadsBulk: async (newLeads: Omit<Lead, 'id'>[]): Promise<void> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get default pipeline and stages for mapping if IDs are invalid
        const pipelines = await leadsService.getPipelines();
        const defaultPipeline = pipelines[0] || await leadsService.ensureDefaultPipeline();

        const stages = defaultPipeline ? await leadsService.getStages(defaultPipeline.id) : [];
        const firstStage = stages[0];

        const leadsToInsert = newLeads.map(l => {
            const dbInsert = sanitizeLeadForDb(l, user.id);

            // Validate or default pipeline/stage
            const validPipeline = pipelines.some(p => p.id === dbInsert.pipeline_id);
            if (!validPipeline && defaultPipeline) {
                dbInsert.pipeline_id = defaultPipeline.id;
            }

            // Default stage if not provided
            if (!dbInsert.stage_id && firstStage) {
                dbInsert.stage_id = firstStage.id;
            }

            return dbInsert;
        });

        const { error } = await (supabase as any)
            .from('leads')
            .insert(leadsToInsert);

        if (error) {
            console.error('Error adding leads bulk:', error);
            return;
        }

        if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('leads-updated'));
        }
    },

    deleteLead: async (id: string): Promise<boolean> => {
        const { error } = await (supabase as any)
            .from('leads')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting lead:', error);
            return false;
        }

        if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('leads-updated'));
        }
        return true;
    },

    // --- Pipelines ---
    getPipelines: async (): Promise<Pipeline[]> => {
        const { data, error } = await (supabase as any)
            .from('pipelines')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching pipelines:', error);
            return [];
        }
        return data as Pipeline[];
    },

    ensureDefaultPipeline: async (): Promise<Pipeline | null> => {
        const pipelines = await leadsService.getPipelines();
        if (pipelines.length > 0) return pipelines[0];

        const newPipeline = await leadsService.createPipeline('Main Pipeline');
        if (!newPipeline) return null;

        const defaultStages = [
            { name: 'Enquiry', color: '#3b82f6', order: 1 },
            { name: 'Contacted', color: '#f59e0b', order: 2 },
            { name: 'Qualified', color: '#10b981', order: 3 },
            { name: 'Quotation Sent', color: '#8b5cf6', order: 4 },
            { name: 'Payment Done', color: '#10b981', order: 5 }
        ];

        for (const s of defaultStages) {
            await leadsService.createStage({ ...s, pipeline_id: newPipeline.id });
        }

        return newPipeline;
    },

    createPipeline: async (name: string): Promise<Pipeline | null> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data, error } = await (supabase as any)
            .from('pipelines')
            .insert([{ name, user_id: user.id }])
            .select()
            .single();

        if (error) {
            console.error('Error creating pipeline:', error);
            return null;
        }
        return data as Pipeline;
    },

    updatePipeline: async (id: string, name: string): Promise<Pipeline | null> => {
        const { data, error } = await (supabase as any)
            .from('pipelines')
            .update({ name })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating pipeline:', error);
            return null;
        }
        return data as Pipeline;
    },

    deletePipeline: async (id: string): Promise<void> => {
        const { error } = await (supabase as any)
            .from('pipelines')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting pipeline:', error);
        }
    },

    // --- Stages ---
    getAllStages: async (): Promise<Stage[]> => {
        const { data, error } = await (supabase as any)
            .from('pipeline_stages')
            .select('*')
            .order('order', { ascending: true });

        if (error) {
            console.error('Error fetching all stages:', error);
            return [];
        }
        return data as Stage[];
    },

    getStages: async (pipelineId: string): Promise<Stage[]> => {
        const { data, error } = await (supabase as any)
            .from('pipeline_stages')
            .select('*')
            .eq('pipeline_id', pipelineId)
            .order('order', { ascending: true });

        if (error) {
            console.error('Error fetching stages:', error);
            return [];
        }
        return data as Stage[];
    },

    createStage: async (stage: Omit<Stage, 'id'>): Promise<Stage | null> => {
        const { data, error } = await (supabase as any)
            .from('pipeline_stages')
            .insert([stage])
            .select()
            .single();

        if (error) {
            console.error('Error creating stage:', error);
            return null;
        }
        return data as Stage;
    },

    updateStage: async (id: string, updates: Partial<Stage>): Promise<Stage | null> => {
        const { data, error } = await (supabase as any)
            .from('pipeline_stages')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating stage:', error);
            return null;
        }
        return data as Stage;
    },

    deleteStage: async (id: string): Promise<void> => {
        const { error } = await (supabase as any)
            .from('pipeline_stages')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting stage:', error);
        }
    },

    // --- Forms ---
    getForms: async (): Promise<Form[]> => {
        const { data, error } = await (supabase as any)
            .from('lead_forms')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching forms:', error);
            return [];
        }
        return (data as any[]).map(d => ({
            ...d,
            custom_fields: d.fields || []
        })) as Form[];
    },

    getFormById: async (id: string): Promise<Form | undefined> => {
        const { data, error } = await (supabase as any)
            .from('lead_forms')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching form:', error);
            return undefined;
        }
        return {
            ...data,
            custom_fields: (data as any).fields || []
        } as Form;
    },

    createForm: async (form: Omit<Form, 'id' | 'created_at' | 'visits' | 'submissions'>): Promise<Form | null> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data, error } = await (supabase as any)
            .from('lead_forms')
            .insert([{
                name: form.name,
                fields: form.custom_fields,
                user_id: user.id
            }])
            .select()
            .single();

        if (error) {
            console.error('Error creating form:', error);
            return null;
        }
        return {
            ...data,
            custom_fields: (data as any).fields || []
        } as Form;
    },

    updateForm: async (id: string, updates: Partial<Form>): Promise<Form | null> => {
        const dbUpdates: any = { ...updates };
        if (updates.custom_fields) {
            dbUpdates.fields = updates.custom_fields;
            delete dbUpdates.custom_fields;
        }

        const { data, error } = await (supabase as any)
            .from('lead_forms')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating form:', error);
            return null;
        }
        return {
            ...data,
            custom_fields: (data as any).fields || []
        } as Form;
    },

    deleteForm: async (id: string): Promise<void> => {
        const { error } = await (supabase as any)
            .from('lead_forms')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting form:', error);
        }
    },

    incrementFormVisits: async (id: string): Promise<void> => {
        const form = await leadsService.getFormById(id);
        if (form) {
            await leadsService.updateForm(id, { visits: (form.visits || 0) + 1 });
        }
    },

    incrementFormSubmissions: async (id: string): Promise<void> => {
        const form = await leadsService.getFormById(id);
        if (form) {
            await leadsService.updateForm(id, { submissions: (form.submissions || 0) + 1 });
        }
    },

    // --- Contacts ---
    getContacts: async (): Promise<Contact[]> => {
        const { data, error } = await (supabase as any)
            .from('contacts')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching contacts:', error);
            return [];
        }
        return data as Contact[];
    },

    addContact: async (contact: Omit<Contact, 'id' | 'created_at'>, userId?: string): Promise<Contact | null> => {
        let finalUserId = userId;

        if (!finalUserId) {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null;
            finalUserId = user.id;
        }

        const { data, error } = await (supabase as any)
            .from('contacts')
            .insert([{
                ...contact,
                user_id: finalUserId,
                name: normalizeValue(contact.name),
                email: normalizeValue(contact.email),
                phone: normalizeValue(contact.phone),
                company: normalizeValue(contact.company)
            }])
            .select()
            .single();

        if (error) {
            console.error('Error adding contact:', error);
            return null;
        }

        if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('leads-updated'));
        }
        return data as Contact;
    },

    deleteContact: async (id: string): Promise<void> => {
        const { error } = await (supabase as any)
            .from('contacts')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting contact:', error);
        }

        if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('leads-updated'));
        }
    },

    createJotForm: async (formId: string): Promise<{ success: boolean, url?: string, error?: string }> => {
        const form = await leadsService.getFormById(formId);
        if (!form) return { success: false, error: 'Form not found' };

        const JOTFORM_API_KEY = 'b154bee5868ed3e6ef4a9664a55e7465';
        const url = `https://api.jotform.com/user/forms?apiKey=${JOTFORM_API_KEY}`;

        const params = new URLSearchParams();
        params.append('properties[title]', form.name);

        let customFields = [...form.custom_fields];
        if (customFields.length === 0) {
            customFields = [
                { id: 'name', label: 'Full Name', type: 'text', required: true },
                { id: 'email', label: 'Email Address', type: 'email', required: true },
                { id: 'phone', label: 'Phone Number', type: 'tel', required: false }
            ];
        }

        customFields.forEach((field, index) => {
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

        const submitIndex = form.custom_fields.length;
        const submitPrefix = `questions[${submitIndex}]`;
        params.append(`${submitPrefix}[type]`, 'control_button');
        params.append(`${submitPrefix}[text]`, 'Submit');
        params.append(`${submitPrefix}[order]`, (submitIndex + 1).toString());
        params.append(`${submitPrefix}[name]`, 'submit');
        params.append(`${submitPrefix}[buttonStyle]`, 'v3-deep-amber');

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
                await leadsService.updateForm(formId, {
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
        const allForms = await leadsService.getForms();
        const forms = allForms.filter(f => f.jotform_id);
        const contacts = await leadsService.getContacts();
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
                        const exists = contacts.some(c => c.form_data?.jotform_submission_id === sub.id);
                        if (exists) continue;

                        const answers = sub.answers;
                        const contactData: Record<string, unknown> = { jotform_submission_id: sub.id };
                        let name = 'Unknown';
                        let email = '';
                        let phone = '';
                        let company = '';

                        Object.values(answers).forEach((ansValue) => {
                            const ans = ansValue as { text?: string, answer?: unknown };
                            if (!ans.answer) return;

                            const label = (ans.text || '').toLowerCase();
                            const val = normalizeValue(ans.answer);

                            if (label.includes('name')) name = val;
                            else if (label.includes('email')) email = val;
                            else if (label.includes('phone') || label.includes('tel')) phone = val;
                            else if (label.includes('company')) company = val;

                            const field = form.custom_fields.find(f => f.label.toLowerCase() === label);
                            if (field) {
                                contactData[field.id] = val;
                            }
                        });

                        await leadsService.addContact({
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

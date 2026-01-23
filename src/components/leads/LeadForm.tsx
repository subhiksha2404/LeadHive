"use client";

import React, { useState } from 'react';
import {
    User,
    Mail,
    Phone,
    Globe,
    ChevronDown,
    Calendar,
    MessageSquare,
    IndianRupee,
    ArrowLeft
} from 'lucide-react';
import styles from './LeadForm.module.css';
import Link from 'next/link';

interface LeadFormProps {
    initialData?: any;
    onSubmit: (data: any) => void;
    onCancel?: () => void;
}

interface CustomField {
    id: string;
    sectionId: string;
    label: string;
    dataType: 'text' | 'numeric' | 'boolean';
    boxType: 'single' | 'multi' | 'checkbox' | 'radio';
    value: any;
}

export default function LeadForm({ initialData, onSubmit, onCancel }: LeadFormProps) {
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        email: initialData?.email || '',
        phone: initialData?.phone || '',
        source: initialData?.source || 'Website',
        status: initialData?.status || 'New',
        priority: initialData?.priority || 'Medium',
        interested_model: initialData?.interested_model || '',
        budget: initialData?.budget || 0,
        assigned_to: initialData?.assigned_to || '',
        next_follow_up: initialData?.next_follow_up || '',
        notes: initialData?.notes || ''
    });

    const [customFields, setCustomFields] = useState<CustomField[]>([]);
    const [fieldBuilder, setFieldBuilder] = useState<{ sectionId: string | null; label: string; dataType: string; boxType: string }>({
        sectionId: null,
        label: '',
        dataType: 'text',
        boxType: 'single'
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Merge custom fields into submittable data if needed, or send as is
        onSubmit({ ...formData, customFields });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const finalValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : (name === 'budget' ? Number(value) : value);

        setFormData((prev: any) => ({
            ...prev,
            [name]: finalValue
        }));
    };

    const handleCustomFieldChange = (id: string, value: any) => {
        setCustomFields(prev => prev.map(f => f.id === id ? { ...f, value } : f));
    };

    const addField = (sectionId: string) => {
        if (!fieldBuilder.label) return;

        const newField: CustomField = {
            id: Math.random().toString(36).substr(2, 9),
            sectionId,
            label: fieldBuilder.label,
            dataType: fieldBuilder.dataType as any,
            boxType: fieldBuilder.boxType as any,
            value: fieldBuilder.dataType === 'boolean' ? false : (fieldBuilder.dataType === 'numeric' ? 0 : '')
        };

        setCustomFields(prev => [...prev, newField]);
        setFieldBuilder({ sectionId: null, label: '', dataType: 'text', boxType: 'single' });
    };

    const renderCustomFields = (sectionId: string) => {
        return customFields.filter(f => f.sectionId === sectionId).map(field => (
            <div key={field.id} className={field.boxType === 'multi' ? styles.formGroupFull : styles.formGroup}>
                <label className={styles.label}>{field.label}</label>
                {field.boxType === 'single' && (
                    <input
                        type={field.dataType === 'numeric' ? 'number' : 'text'}
                        className={styles.input}
                        value={field.value}
                        onChange={(e) => handleCustomFieldChange(field.id, field.dataType === 'numeric' ? Number(e.target.value) : e.target.value)}
                    />
                )}
                {field.boxType === 'multi' && (
                    <textarea
                        className={styles.textarea}
                        rows={2}
                        value={field.value}
                        onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                    />
                )}
                {field.boxType === 'checkbox' && (
                    <label className={styles.checkboxLabel}>
                        <input
                            type="checkbox"
                            checked={field.value}
                            onChange={(e) => handleCustomFieldChange(field.id, e.target.checked)}
                        />
                        <span>Enable {field.label}</span>
                    </label>
                )}
                {field.boxType === 'radio' && (
                    <div className={styles.radioGroup}>
                        <label className={styles.radioLabel}>
                            <input type="radio" checked={field.value === 'Yes'} onChange={() => handleCustomFieldChange(field.id, 'Yes')} /> Yes
                        </label>
                        <label className={styles.radioLabel}>
                            <input type="radio" checked={field.value === 'No'} onChange={() => handleCustomFieldChange(field.id, 'No')} /> No
                        </label>
                    </div>
                )}
            </div>
        ));
    };

    const renderFieldBuilder = (sectionId: string) => {
        const isActive = fieldBuilder.sectionId === sectionId;

        if (!isActive) {
            return (
                <button
                    type="button"
                    className={styles.addFieldBtn}
                    onClick={() => setFieldBuilder({ ...fieldBuilder, sectionId })}
                >
                    + Add Field
                </button>
            );
        }

        return (
            <div className={styles.builderCard}>
                <div className={styles.builderGrid}>
                    <input
                        type="text"
                        placeholder="Field Label"
                        className={styles.builderInput}
                        value={fieldBuilder.label}
                        onChange={(e) => setFieldBuilder({ ...fieldBuilder, label: e.target.value })}
                        autoFocus
                    />
                    <select
                        className={styles.builderSelect}
                        value={fieldBuilder.dataType}
                        onChange={(e) => setFieldBuilder({ ...fieldBuilder, dataType: e.target.value })}
                    >
                        <option value="text">Text</option>
                        <option value="numeric">Numeric</option>
                        <option value="boolean">Boolean</option>
                    </select>
                    <select
                        className={styles.builderSelect}
                        value={fieldBuilder.boxType}
                        onChange={(e) => setFieldBuilder({ ...fieldBuilder, boxType: e.target.value })}
                    >
                        <option value="single">Single Line</option>
                        <option value="multi">Multi Line</option>
                        <option value="checkbox">Checkbox</option>
                        <option value="radio">Radio (Yes/No)</option>
                    </select>
                </div>
                <div className={styles.builderActions}>
                    <button type="button" onClick={() => setFieldBuilder({ ...fieldBuilder, sectionId: null })} className={styles.builderCancel}>Cancel</button>
                    <button type="button" onClick={() => addField(sectionId)} className={styles.builderAdd}>Add Field</button>
                </div>
            </div>
        );
    };

    return (
        <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Contact Information</h3>
                <div className={styles.grid}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>
                            <User size={14} /> <span>Name *</span>
                        </label>
                        <input
                            type="text"
                            name="name"
                            required
                            className={styles.input}
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Full name"
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>
                            <Mail size={14} /> <span>Email *</span>
                        </label>
                        <input
                            type="email"
                            name="email"
                            required
                            className={styles.input}
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Email address"
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>
                            <Phone size={14} /> <span>Phone *</span>
                        </label>
                        <input
                            type="tel"
                            name="phone"
                            required
                            className={styles.input}
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="Phone number"
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>
                            <Globe size={14} /> <span>Source</span>
                        </label>
                        <div className={styles.selectWrapper}>
                            <select name="source" className={styles.select} value={formData.source} onChange={handleChange}>
                                <option value="Website">Website</option>
                                <option value="Facebook">Facebook</option>
                                <option value="Google Ads">Google Ads</option>
                                <option value="Twitter">Twitter</option>
                                <option value="Offline Event">Offline Event</option>
                                <option value="Referral">Referral</option>
                            </select>
                            <ChevronDown className={styles.selectIcon} size={16} />
                        </div>
                    </div>
                    {renderCustomFields('contact')}
                </div>
                {renderFieldBuilder('contact')}
            </div>

            <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Deal Details</h3>
                <div className={styles.grid}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Interested Service</label>
                        <input
                            type="text"
                            name="interested_model"
                            className={styles.input}
                            value={formData.interested_model}
                            onChange={handleChange}
                            placeholder="e.g., Web Development"
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Status</label>
                        <div className={styles.selectWrapper}>
                            <select name="status" className={styles.select} value={formData.status} onChange={handleChange}>
                                <option value="New">New</option>
                                <option value="Enquiry">Enquiry</option>
                                <option value="Contacted">Contacted</option>
                                <option value="Qualified">Qualified</option>
                                <option value="Follow Up">Follow Up</option>
                                <option value="Quotation Sent">Quotation Sent</option>
                                <option value="Payment Done">Payment Done</option>
                            </select>
                            <ChevronDown className={styles.selectIcon} size={16} />
                        </div>
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>
                            <IndianRupee size={14} /> <span>Budget (₹)</span>
                        </label>
                        <input
                            type="number"
                            name="budget"
                            className={styles.input}
                            value={formData.budget}
                            onChange={handleChange}
                            placeholder="Total budget"
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Priority</label>
                        <div className={styles.selectWrapper}>
                            <select name="priority" className={styles.select} value={formData.priority} onChange={handleChange}>
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                            </select>
                            <ChevronDown className={styles.selectIcon} size={16} />
                        </div>
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Assigned To</label>
                        <div className={styles.selectWrapper}>
                            <select name="assigned_to" className={styles.select} value={formData.assigned_to} onChange={handleChange}>
                                <option value="">Unassigned</option>
                                <option value="Sarah Johnson">Sarah Johnson</option>
                                <option value="Mike Chen">Mike Chen</option>
                                <option value="Alex Rodriguez">Alex Rodriguez</option>
                            </select>
                            <ChevronDown className={styles.selectIcon} size={16} />
                        </div>
                    </div>
                    {renderCustomFields('deal')}
                </div>
                {renderFieldBuilder('deal')}
            </div>

            <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Follow-up & Notes</h3>
                <div className={styles.formGroupFull}>
                    <label className={styles.label}>
                        <Calendar size={14} /> <span>Next Follow-up</span>
                    </label>
                    <input
                        type="datetime-local"
                        name="next_follow_up"
                        className={styles.input}
                        value={formData.next_follow_up}
                        onChange={handleChange}
                    />
                </div>
                <div className={styles.formGroupFull}>
                    <label className={styles.label}>
                        <MessageSquare size={14} /> <span>Notes</span>
                    </label>
                    <textarea
                        name="notes"
                        className={styles.textarea}
                        value={formData.notes}
                        onChange={handleChange}
                        rows={4}
                        placeholder="Additional notes about the lead..."
                    />
                </div>
                {renderCustomFields('followup')}
                {renderFieldBuilder('followup')}
            </div>

            <div className={styles.footer}>
                {onCancel ? (
                    <button type="button" onClick={onCancel} className={styles.cancelBtn}>Cancel</button>
                ) : (
                    <Link href="/leads" className={styles.cancelBtn}>Cancel</Link>
                )}
                <button type="submit" className={styles.submitBtn}>
                    {initialData ? 'Update Lead' : 'Save Lead'}
                </button>
            </div>
        </form>
    );
}

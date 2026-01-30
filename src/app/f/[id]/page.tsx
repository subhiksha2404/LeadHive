"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { leadsService, Form } from '@/lib/storage';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import styles from './PublicForm.module.css';

export default function PublicFormPage() {
    const params = useParams();
    const [form, setForm] = useState<Form | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    // Dynamic Form Data
    const [formData, setFormData] = useState<Record<string, string>>({});

    const fetchForm = useCallback(async () => {
        if (params.id) {
            setLoading(true);
            const formId = params.id as string;
            const data = await leadsService.getFormById(formId);
            if (data) {
                setForm(data);
                await leadsService.incrementFormVisits(formId);
            } else {
                setError('Form not found or has been deleted.');
            }
            setLoading(false);
        }
    }, [params.id]);

    useEffect(() => {
        fetchForm();
    }, [fetchForm]);

    const handleChange = (fieldId: string, value: string) => {
        setFormData(prev => ({ ...prev, [fieldId]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form) return;

        // Extract contact details (Naive approach by field type/label fallback)
        const customFields = form.custom_fields || [];
        const nameField = customFields.find(f => f.label.toLowerCase().includes('name')) || customFields[0];
        const emailField = customFields.find(f => f.type === 'email') || customFields.find(f => f.label.toLowerCase().includes('email'));
        const phoneField = customFields.find(f => f.type === 'tel') || customFields.find(f => f.label.toLowerCase().includes('phone'));
        const companyField = customFields.find(f => f.label.toLowerCase().includes('company'));

        try {
            await leadsService.addContact({
                name: nameField ? (formData[nameField.id] || 'Unknown') : 'Unknown',
                email: emailField ? formData[emailField.id] : '',
                phone: phoneField ? formData[phoneField.id] : '',
                company: companyField ? formData[companyField.id] : '',
                form_id: form.id,
                form_name: form.name,
                form_data: formData
            }, (form as any).user_id);

            await leadsService.incrementFormSubmissions(form.id);
            setSubmitted(true);
        } catch (err) {
            setError('Something went wrong. Please try again.');
        }
    };

    if (loading) return <div className={styles.centered}>Loading form...</div>;

    if (error) return (
        <div className={styles.centered}>
            <AlertCircle size={48} color="#ef4444" style={{ marginBottom: '1rem' }} />
            <h2 style={{ color: '#ef4444' }}>Error</h2>
            <p>{error}</p>
        </div>
    );

    if (submitted) return (
        <div className={styles.centered}>
            <div className={styles.successCard}>
                <CheckCircle2 size={64} className={styles.successIcon} />
                <h1>Thank You!</h1>
                <p>Your details have been submitted successfully.</p>
                <button
                    onClick={() => {
                        setSubmitted(false);
                        setFormData({});
                    }}
                    className={styles.resetBtn}
                >
                    Submit Another Response
                </button>
            </div>
        </div>
    );

    if (!form) return null;

    return (
        <div className={styles.container}>
            <div className={styles.formCard}>
                <header className={styles.header}>
                    <h1 className={styles.title}>{form.name}</h1>
                    <p className={styles.subtitle}>Please fill in the details below.</p>
                </header>

                <form onSubmit={handleSubmit} className={styles.form}>
                    {(form.custom_fields || []).map(field => (
                        <div key={field.id} className={styles.formGroup}>
                            <label>{field.label} {field.required && <span style={{ color: 'red' }}>*</span>}</label>

                            {field.type === 'textarea' ? (
                                <textarea
                                    value={formData[field.id] || ''}
                                    onChange={(e) => handleChange(field.id, e.target.value)}
                                    required={field.required}
                                    rows={4}
                                />
                            ) : field.type === 'select' ? (
                                <select
                                    value={formData[field.id] || ''}
                                    onChange={(e) => handleChange(field.id, e.target.value)}
                                    required={field.required}
                                >
                                    <option value="">Select...</option>
                                    {field.options?.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type={field.type}
                                    value={formData[field.id] || ''}
                                    onChange={(e) => handleChange(field.id, e.target.value)}
                                    required={field.required}
                                />
                            )}
                        </div>
                    ))}

                    <button type="submit" className={styles.submitBtn}>
                        Submit
                    </button>
                </form>
            </div>

            <footer className={styles.footer}>
                Powered by LeadHive
            </footer>
        </div>
    );
}

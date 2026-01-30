"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Save,
    LayoutTemplate,
    Settings,
    Plus,
    Trash2,
    GripVertical
} from 'lucide-react';
import { leadsService } from '@/lib/storage';
import styles from './NewForm.module.css';

interface FormField {
    id: string;
    label: string;
    type: 'text' | 'email' | 'tel' | 'number' | 'textarea' | 'select';
    options?: string[];
    required: boolean;
}

export default function NewFormPage() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Default fields that are always present or recommended
    const [fields, setFields] = useState<FormField[]>([
        { id: '1', label: 'Full Name', type: 'text', required: true },
        { id: '2', label: 'Email Address', type: 'email', required: true },
        { id: '3', label: 'Phone Number', type: 'tel', required: false }
    ]);

    const [newFieldType, setNewFieldType] = useState<string>('text');

    const handleAddField = () => {
        const newField: FormField = {
            id: Date.now().toString(),
            label: 'New Field',
            type: newFieldType as any,
            required: false,
            options: newFieldType === 'select' ? ['Option 1', 'Option 2'] : undefined
        };
        setFields([...fields, newField]);
    };

    const handleUpdateField = (id: string, updates: Partial<FormField>) => {
        setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
    };

    const handleDeleteField = (id: string) => {
        if (fields.length <= 1) {
            alert("At least one field is required.");
            return;
        }
        setFields(fields.filter(f => f.id !== id));
    };

    const handleOptionChange = (fieldId: string, optionsStr: string) => {
        const options = optionsStr.split(',').map(s => s.trim()).filter(s => s);
        handleUpdateField(fieldId, { options });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || isSaving) return;

        setIsSaving(true);
        try {
            await leadsService.createForm({
                name,
                custom_fields: fields
            });
            router.push('/forms');
        } catch (error) {
            console.error('Error saving form:', error);
            setIsSaving(false);
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <button
                    onClick={() => router.push('/forms')}
                    className={styles.backBtn}
                >
                    <ArrowLeft size={18} />
                    <span>Back to Forms</span>
                </button>
                <div className={styles.titleSection}>
                    <h1 className={styles.title}>Create New Form</h1>
                    <p className={styles.subtitle}>Build your form with custom fields.</p>
                </div>
            </header>

            <main className={styles.main}>
                <form onSubmit={handleSubmit} className={styles.formLayout}>
                    {/* Left Column: Configuration */}
                    <div className={styles.configColumn}>
                        <section className={styles.section}>
                            <div className={styles.sectionHeader}>
                                <Settings size={18} />
                                <h3>Form Settings</h3>
                            </div>

                            <div className={styles.formGroup}>
                                <label>Form Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Website Contact Form"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>
                        </section>

                        <section className={styles.section}>
                            <div className={styles.sectionHeader}>
                                <LayoutTemplate size={18} />
                                <h3>Form Builder</h3>
                            </div>

                            <div className={styles.fieldsList}>
                                {fields.map((field, index) => (
                                    <div key={field.id} className={styles.fieldBuilderItem}>
                                        <div className={styles.fieldHeader}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <GripVertical size={16} className={styles.dragHandle} />
                                                <span className={styles.fieldIndex}>#{index + 1}</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteField(field.id)}
                                                className={styles.deleteFieldBtn}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>

                                        <div className={styles.row}>
                                            <div className={styles.formGroup}>
                                                <label>Label</label>
                                                <input
                                                    type="text"
                                                    value={field.label}
                                                    onChange={(e) => handleUpdateField(field.id, { label: e.target.value })}
                                                />
                                            </div>
                                            <div className={styles.formGroup}>
                                                <label>Type</label>
                                                <select
                                                    value={field.type}
                                                    onChange={(e) => handleUpdateField(field.id, { type: e.target.value as any })}
                                                >
                                                    <option value="text">Text</option>
                                                    <option value="email">Email</option>
                                                    <option value="tel">Phone</option>
                                                    <option value="number">Number</option>
                                                    <option value="textarea">Long Text</option>
                                                    <option value="select">Dropdown</option>
                                                </select>
                                            </div>
                                        </div>

                                        {field.type === 'select' && (
                                            <div className={styles.formGroup}>
                                                <label>Options (comma separated)</label>
                                                <input
                                                    type="text"
                                                    placeholder="Option 1, Option 2, Option 3"
                                                    value={field.options?.join(', ') || ''}
                                                    onChange={(e) => handleOptionChange(field.id, e.target.value)}
                                                />
                                            </div>
                                        )}

                                        <div className={styles.checkboxGroup}>
                                            <input
                                                type="checkbox"
                                                id={`req-${field.id}`}
                                                checked={field.required}
                                                onChange={(e) => handleUpdateField(field.id, { required: e.target.checked })}
                                            />
                                            <label htmlFor={`req-${field.id}`}>Required Field</label>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className={styles.addFieldArea}>
                                <select
                                    value={newFieldType}
                                    onChange={(e) => setNewFieldType(e.target.value)}
                                    className={styles.typeSelect}
                                >
                                    <option value="text">Text Field</option>
                                    <option value="email">Email Field</option>
                                    <option value="tel">Phone Field</option>
                                    <option value="number">Number Field</option>
                                    <option value="textarea">Long Text</option>
                                    <option value="select">Dropdown</option>
                                </select>
                                <button type="button" onClick={handleAddField} className={styles.addFieldBtn}>
                                    <Plus size={16} /> Add Field
                                </button>
                            </div>
                        </section>

                        <div className={styles.actions}>
                            <button type="button" onClick={() => router.back()} className={styles.secondaryBtn}>Cancel</button>
                            <button type="submit" className={styles.primaryBtn} disabled={isSaving}>
                                <Save size={18} />
                                <span>{isSaving ? 'Saving...' : 'Save Form'}</span>
                            </button>
                        </div>
                    </div>

                    {/* Right Column: Preview */}
                    <div className={styles.previewColumn}>
                        <div className={styles.previewHeader}>
                            <LayoutTemplate size={16} />
                            <span>Live Preview</span>
                        </div>

                        <div className={styles.previewCard}>
                            <div className={styles.previewForm}>
                                <h2 className={styles.previewTitle}>{name || 'Form Title'}</h2>
                                <p className={styles.previewSubtitle}>Please fill out the form below.</p>

                                {fields.map(field => (
                                    <div key={field.id} className={styles.previewField}>
                                        <label>
                                            {field.label} {field.required && <span style={{ color: 'red' }}>*</span>}
                                        </label>
                                        {field.type === 'textarea' ? (
                                            <textarea className={styles.mockInput} rows={3} disabled></textarea>
                                        ) : field.type === 'select' ? (
                                            <select className={styles.mockInput} disabled>
                                                <option>Select...</option>
                                                {field.options?.map(opt => <option key={opt}>{opt}</option>)}
                                            </select>
                                        ) : (
                                            <input type={field.type} className={styles.mockInput} disabled />
                                        )}
                                    </div>
                                ))}

                                {/* Permanent Submit Button in Preview */}
                                <button type="button" className={styles.mockBtn} disabled>Submit</button>
                            </div>
                        </div>
                    </div>
                </form>
            </main>
        </div>
    );
}

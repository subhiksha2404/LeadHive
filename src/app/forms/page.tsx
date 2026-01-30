"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Plus,
    Copy,
    Trash2,
    ExternalLink,
    FileText,
    CheckCircle2,
    Edit,
    Box
} from 'lucide-react';
import { leadsService, Form } from '@/lib/storage';
import JotFormModal from '@/components/forms/JotFormModal';
import styles from './Forms.module.css';

export default function FormsPage() {
    const [forms, setForms] = useState<Form[]>([]);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [jotFormTarget, setJotFormTarget] = useState<{ id: string, name: string } | null>(null);

    const fetchForms = async () => {
        const data = await leadsService.getForms();
        setForms(data);
    };

    useEffect(() => {
        fetchForms();
    }, []);

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this form?')) {
            await leadsService.deleteForm(id);
            await fetchForms();
        }
    };

    const handleCopyLink = (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const url = `${window.location.origin}/f/${id}`;
        navigator.clipboard.writeText(url);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleCreateJotForm = (form: Form, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setJotFormTarget({ id: form.id, name: form.name });
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>Lead Capture Forms</h1>
                    <p className={styles.subtitle}>Create and manage public forms to automatically capture leads.</p>
                </div>
                <Link href="/forms/new" className={styles.addBtn}>
                    <Plus size={20} />
                    <span>Create New Form</span>
                </Link>
            </header>

            <main className={styles.main}>
                {forms.length === 0 ? (
                    <div className={styles.emptyState}>
                        <FileText size={48} strokeWidth={1} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                        <h3>No Forms Created</h3>
                        <p>Create your first form to start capturing leads automatically from your website or social media.</p>
                    </div>
                ) : (
                    <div className={styles.grid}>
                        {forms.map(form => (
                            <div key={form.id} className={styles.card}>
                                <div className={styles.cardHeader}>
                                    <div className={styles.iconWrapper}>
                                        <FileText size={20} />
                                    </div>
                                    <div className={styles.cardActions}>
                                        <button
                                            onClick={(e) => handleCopyLink(form.id, e)}
                                            className={styles.iconBtn}
                                            title="Copy Public Link"
                                        >
                                            {copiedId === form.id ? <CheckCircle2 size={16} color="#10b981" /> : <Copy size={16} />}
                                        </button>
                                        <Link href={`/f/${form.id}`} target="_blank" className={styles.iconBtn} title="View Live">
                                            <ExternalLink size={16} />
                                        </Link>
                                        <button
                                            onClick={(e) => handleCreateJotForm(form, e)}
                                            className={styles.iconBtn}
                                            title="Create Jotform"
                                            style={{ color: '#fa8900' }}
                                        >
                                            <Box size={16} />
                                        </button>
                                        <Link href={`/forms/${form.id}/edit`} className={styles.iconBtn} title="Edit Form">
                                            <Edit size={16} />
                                        </Link>
                                        <button
                                            onClick={(e) => handleDelete(form.id, e)}
                                            className={`${styles.iconBtn} ${styles.deleteBtn}`}
                                            title="Delete Form"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <h3 className={styles.formName}>{form.name}</h3>

                                <div className={styles.statsRow}>
                                    <div className={styles.stat}>
                                        <span className={styles.statValue}>{form.visits}</span>
                                        <span className={styles.statLabel}>Visits</span>
                                    </div>
                                    <div className={styles.statDivider} />
                                    <div className={styles.stat}>
                                        <span className={styles.statValue}>{form.submissions}</span>
                                        <span className={styles.statLabel}>Submissions</span>
                                    </div>
                                </div>

                                <div className={styles.cardFooter}>
                                    <span className={styles.date}>Created {new Date(form.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {jotFormTarget && (
                <JotFormModal
                    isOpen={!!jotFormTarget}
                    onClose={() => setJotFormTarget(null)}
                    formId={jotFormTarget.id}
                    formName={jotFormTarget.name}
                />
            )}
        </div>
    );
}

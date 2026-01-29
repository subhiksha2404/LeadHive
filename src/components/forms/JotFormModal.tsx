"use client";

import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Box, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { leadsService } from '@/lib/storage';
import styles from './GoogleFormModal.module.css';

interface JotFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    formId: string;
    formName: string;
}

export default function JotFormModal({ isOpen, onClose, formId, formName }: JotFormModalProps) {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [jotFormUrl, setJotFormUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleCreate = async () => {
        setStatus('loading');
        const result = await leadsService.createJotForm(formId);

        if (result.success && result.url) {
            setJotFormUrl(result.url);
            setStatus('success');
        } else {
            setError(result.error || 'Failed to create form');
            setStatus('error');
        }
    };

    useEffect(() => {
        if (isOpen && status === 'idle') {
            handleCreate();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Box className={styles.icon} size={24} color="#fa8900" />
                        <h2>Jotform Generator</h2>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className={styles.content}>
                    {status === 'loading' && (
                        <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                            <Loader2 size={48} className="animate-spin" style={{ margin: '0 auto 1.5rem', color: '#fa8900' }} />
                            <h3>Creating your Jotform...</h3>
                            <p className={styles.description}>We&apos;re building your form with all custom fields.</p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                            <CheckCircle2 size={48} style={{ margin: '0 auto 1.5rem', color: '#10b981' }} />
                            <h3>Success! Your Jotform is ready.</h3>
                            <p className={styles.description}>
                                Your form <strong>{formName}</strong> has been created in your Jotform account.
                            </p>

                            <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <a
                                    href={jotFormUrl!}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.primaryBtn}
                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: '#fa8900' }}
                                >
                                    Open Jotform <ExternalLink size={16} />
                                </a>
                                <button
                                    className={styles.secondaryBtn}
                                    onClick={() => {
                                        navigator.clipboard.writeText(jotFormUrl!);
                                        alert('Link copied to clipboard!');
                                    }}
                                    style={{ border: '1px solid #e5e7eb', padding: '0.625rem', borderRadius: '0.5rem' }}
                                >
                                    Copy Link
                                </button>
                            </div>
                        </div>
                    )}

                    {status === 'error' && (
                        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                            <AlertCircle size={48} style={{ margin: '0 auto 1.5rem', color: '#ef4444' }} />
                            <h3>Failed to create Jotform</h3>
                            <p className={styles.description}>{error}</p>

                            {(error?.toLowerCase().includes('authorized') || error?.toLowerCase().includes('permission')) && (
                                <div style={{
                                    background: '#fff7ed',
                                    border: '1px solid #ffedd5',
                                    padding: '1rem',
                                    borderRadius: '0.75rem',
                                    marginTop: '1.5rem',
                                    textAlign: 'left'
                                }}>
                                    <h4 style={{ color: '#9a3412', margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>Important: Check your API Key permissions</h4>
                                    <p style={{ color: '#c2410c', fontSize: '0.85rem', margin: 0, lineHeight: '1.4' }}>
                                        Jotform says your API key is not authorized. This usually means it is set to <strong>&quot;Read Only&quot;</strong>.
                                        <br /><br />
                                        Please go to your <strong>Jotform Account &gt; API</strong> settings and change the permissions of your API key to <strong>&quot;Full Access&quot;</strong>.
                                    </p>
                                </div>
                            )}

                            <button className={styles.primaryBtn} onClick={handleCreate} style={{ marginTop: '1.5rem' }}>
                                Try Again
                            </button>
                        </div>
                    )}
                </div>

                <div className={styles.footer}>
                    <button className={styles.primaryBtn} onClick={onClose} style={{ background: status === 'success' ? '#fa8900' : '#2563eb' }}>
                        {status === 'success' ? 'Great!' : 'Close'}
                    </button>
                </div>
            </div>
        </div>
    );
}

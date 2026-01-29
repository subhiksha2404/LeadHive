"use client";

import React, { useState } from 'react';
import { X, Copy, Check, ExternalLink, Code2 } from 'lucide-react';
import styles from './GoogleFormModal.module.css';

interface GoogleFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    script: string;
    formName: string;
}

export default function GoogleFormModal({ isOpen, onClose, script, formName }: GoogleFormModalProps) {
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(script);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Code2 className={styles.icon} size={24} color="#2563eb" />
                        <h2>Google Form Generator</h2>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className={styles.content}>
                    <p className={styles.description}>
                        Generate a Google Form for <strong>{formName}</strong> using Google Apps Script.
                        This script will automatically create a form with all your custom fields in your Google account.
                    </p>

                    <div className={styles.instructions}>
                        <h3>How to use:</h3>
                        <ol>
                            <li>Click the <strong>Copy Script</strong> button below.</li>
                            <li>Go to <a href="https://script.google.com" target="_blank" rel="noopener noreferrer">script.google.com <ExternalLink size={12} style={{ display: 'inline' }} /></a>.</li>
                            <li>Click <strong>&quot;New Project&quot;</strong>.</li>
                            <li>Delete any existing code and <strong>paste</strong> the copied script.</li>
                            <li>Click the <strong>&quot;Run&quot;</strong> button (play icon) at the top.</li>
                            <li>Grant the necessary permissions. Your form will be created and the link will be emailed to you!</li>
                        </ol>
                    </div>

                    <div className={styles.codeArea}>
                        <div className={styles.copyOverlay}>
                            <button className={styles.copyBtn} onClick={handleCopy}>
                                {copied ? <Check size={14} /> : <Copy size={14} />}
                                {copied ? 'Copied!' : 'Copy Script'}
                            </button>
                        </div>
                        <pre>
                            <code>{script}</code>
                        </pre>
                    </div>
                </div>

                <div className={styles.footer}>
                    <button className={styles.primaryBtn} onClick={onClose}>Done</button>
                </div>
            </div>
        </div>
    );
}

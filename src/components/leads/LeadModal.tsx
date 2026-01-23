"use client";

import React from 'react';
import LeadForm from './LeadForm';
import { X } from 'lucide-react';
import styles from './LeadModal.module.css';

interface LeadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    initialData?: any;
}

export default function LeadModal({ isOpen, onClose, onSubmit, initialData }: LeadModalProps) {
    if (!isOpen) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2>{initialData ? 'Edit Lead' : 'Create New Lead'}</h2>
                    <button onClick={onClose} className={styles.closeBtn}>
                        <X size={20} />
                    </button>
                </div>

                <div className={styles.modalContent}>
                    <LeadForm
                        initialData={initialData}
                        onSubmit={(data) => {
                            onSubmit(data);
                            onClose();
                        }}
                        onCancel={onClose}
                    />
                </div>
            </div>
        </div>
    );
}

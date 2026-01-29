"use client";

import React, { useState, useEffect } from 'react';
import {
    X,
    User,
    ArrowRight,
    IndianRupee,
    Briefcase,
    Tag,
    UserCircle
} from 'lucide-react';
import { leadsService, Contact } from '@/lib/storage';
import { Pipeline, Stage } from '@/types/lead';
import styles from './ConvertToLeadModal.module.css';

interface ConvertToLeadModalProps {
    contact: Contact | null;
    isOpen: boolean;
    onClose: () => void;
    onConverted: () => void;
}

export default function ConvertToLeadModal({ contact, isOpen, onClose, onConverted }: ConvertToLeadModalProps) {
    const [pipelines, setPipelines] = useState<Pipeline[]>([]);
    const [stages, setStages] = useState<Stage[]>([]);

    // Form State
    const [pipelineId, setPipelineId] = useState('');
    const [stageId, setStageId] = useState('');
    const [interestedService, setInterestedService] = useState('');
    const [budget, setBudget] = useState('');
    const [assignedTo, setAssignedTo] = useState('');
    const [priority, setPriority] = useState('Medium');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (isOpen && contact) {
            const pData = leadsService.getPipelines();
            setPipelines(pData);
            // Don't auto-select - leave empty by default
            setPipelineId('');
            setStages([]);

            // Intelligent Note Extraction
            // Find fields that define "Notes" or "Message"
            const formDef = leadsService.getFormById(contact.form_id);
            let extractedNotes = '';

            if (formDef) {
                // 1. Look for explicit textarea types
                const noteField = formDef.custom_fields.find(f =>
                    f.type === 'textarea' ||
                    f.label.toLowerCase().includes('note') ||
                    f.label.toLowerCase().includes('message')
                );

                if (noteField && contact.form_data[noteField.id]) {
                    extractedNotes = String(contact.form_data[noteField.id]);
                }
            }

            // Fallback: If no definition or field found, check keys in data
            if (!extractedNotes) {
                const keys = Object.keys(contact.form_data);
                const likelyNoteKey = keys.find(k => k.toLowerCase().includes('note') || k.toLowerCase().includes('message'));
                if (likelyNoteKey) {
                    extractedNotes = String(contact.form_data[likelyNoteKey]);
                }
            }

            setNotes(extractedNotes);
        }
    }, [isOpen, contact]);

    const handlePipelineChange = (pid: string) => {
        setPipelineId(pid);
        const sData = leadsService.getStages(pid);
        setStages(sData);
        if (sData.length > 0) setStageId(sData[0].id);
    };

    const handleConvert = (e: React.FormEvent) => {
        e.preventDefault();
        if (!contact || !pipelineId || !stageId) return;

        // Extract platform from form name (e.g., "Website contact form" -> "Website")
        const platformName = contact.form_name.split(' ')[0];

        leadsService.addLead({
            name: contact.name,
            email: contact.email,
            phone: contact.phone || '',
            company: contact.company || '',
            source: `${platformName} (Form)`,
            pipeline_id: pipelineId,
            stage_id: stageId,
            status: 'New', // Placeholder
            interested_service: interestedService,
            budget: Number(budget) || 0,
            assigned_to: assignedTo,
            priority: priority,
            notes: notes
        });

        leadsService.deleteContact(contact.id);
        onConverted();
        onClose();
    };

    if (!isOpen || !contact) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <header className={styles.header}>
                    <div>
                        <h2>Convert to Lead</h2>
                        <p>Transition <strong>{contact.name}</strong> to your pipeline.</p>
                    </div>
                    <button onClick={onClose} className={styles.closeBtn}><X size={20} /></button>
                </header>

                <form onSubmit={handleConvert}>
                    <div className={styles.body}>
                        <div className={styles.section}>
                            <h3 className={styles.sectionTitle}><Tag size={16} /> Pipeline Assignment</h3>
                            <div className={styles.row}>
                                <div className={styles.formGroup}>
                                    <label>Pipeline</label>
                                    <select
                                        value={pipelineId}
                                        onChange={(e) => {
                                            const pid = e.target.value;
                                            setPipelineId(pid);
                                            if (pid) {
                                                setStages(leadsService.getStages(pid));
                                                setStageId('');
                                            } else {
                                                setStages([]);
                                                setStageId('');
                                            }
                                        }}
                                        required
                                    >
                                        <option value="">Select Pipeline</option>
                                        {pipelines.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Stage</label>
                                    <select
                                        value={stageId}
                                        onChange={(e) => setStageId(e.target.value)}
                                        required
                                        disabled={!pipelineId}
                                    >
                                        <option value="">Select Stage</option>
                                        {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className={styles.section}>
                            <h3 className={styles.sectionTitle}><Briefcase size={16} /> Deal Details</h3>
                            <div className={styles.row}>
                                <div className={styles.formGroup}>
                                    <label>Interested Service</label>
                                    <input
                                        type="text"
                                        value={interestedService}
                                        onChange={(e) => setInterestedService(e.target.value)}
                                        placeholder="e.g. Consulting"
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Budget</label>
                                    <div className={styles.iconInput}>
                                        <IndianRupee size={15} />
                                        <input
                                            type="number"
                                            value={budget}
                                            onChange={(e) => setBudget(e.target.value)}
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className={styles.row}>
                                <div className={styles.formGroup}>
                                    <label>Assign to</label>
                                    <div className={styles.iconInput}>
                                        <UserCircle size={15} />
                                        <input
                                            type="text"
                                            value={assignedTo}
                                            onChange={(e) => setAssignedTo(e.target.value)}
                                            placeholder="Name"
                                        />
                                    </div>
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Priority</label>
                                    <select
                                        value={priority}
                                        onChange={(e) => setPriority(e.target.value)}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', outline: 'none' }}
                                    >
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label>Submission Details</label>
                            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', fontSize: '0.85rem', color: '#334155', maxHeight: '150px', overflowY: 'auto' }}>
                                <p><strong>Submitted:</strong> {new Date(contact.created_at).toLocaleString()}</p>
                                <hr style={{ margin: '0.5rem 0', borderColor: '#e2e8f0' }} />
                                {Object.entries(contact.form_data).map(([key, value]) => {
                                    const fieldLabel = leadsService.getFormById(contact.form_id)?.custom_fields.find(f => f.id === key)?.label || key;
                                    return (
                                        <div key={key} style={{ marginBottom: '0.25rem' }}>
                                            <span style={{ fontWeight: 600 }}>{fieldLabel}:</span> {String(value)}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <footer className={styles.footer}>
                        <button type="button" onClick={onClose} className={styles.secondaryBtn}>Cancel</button>
                        <button type="submit" className={styles.primaryBtn}>
                            <ArrowRight size={16} /> Convert to Lead
                        </button>
                    </footer>
                </form>
            </div>
        </div>
    );
}

"use client";

import React, { useState, useEffect } from 'react';
import {
    Mail,
    Phone,
    Calendar,
    ArrowRight,
    Inbox,
    Trash2,
    RefreshCw,
    CheckCircle2
} from 'lucide-react';
import { leadsService, Contact } from '@/lib/storage';
import styles from './Contacts.module.css';
import ConvertToLeadModal from '@/components/contacts/ConvertToLeadModal';

export default function ContactsPage() {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncResult, setSyncResult] = useState<{ count: number, show: boolean }>({ count: 0, show: false });

    const fetchContacts = async () => {
        const data = await leadsService.getContacts();
        setContacts(data.sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ));
    };

    const handleSync = async () => {
        setIsSyncing(true);
        const result = await leadsService.syncJotformSubmissions();
        if (result.newContacts > 0) {
            await fetchContacts();
            setSyncResult({ count: result.newContacts, show: true });
            setTimeout(() => setSyncResult(prev => ({ ...prev, show: false })), 3000);
        }
        setIsSyncing(false);
    };

    useEffect(() => {
        fetchContacts();
        handleSync(); // Sync on mount
    }, []);

    const handleDelete = async (id: string) => {
        if (confirm('Delete this contact permanently?')) {
            await leadsService.deleteContact(id);
            await fetchContacts();
        }
    };

    const handleOpenConvert = (contact: Contact) => {
        setSelectedContact(contact);
        setIsConvertModalOpen(true);
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>Contacts Inbox</h1>
                    <p className={styles.subtitle}>Review and qualify incoming submissions before adding them to your pipeline.</p>
                </div>
                <div className={styles.stats}>
                    {syncResult.show && (
                        <span className={styles.syncBadge}>
                            <CheckCircle2 size={14} /> New: {syncResult.count}
                        </span>
                    )}
                    <button
                        onClick={handleSync}
                        disabled={isSyncing}
                        className={styles.refreshBtn}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
                        <span>{isSyncing ? 'Syncing...' : 'Sync Jotform'}</span>
                    </button>
                    <span className={styles.badge}>{contacts.length} Total</span>
                </div>
            </header>

            <main className={styles.main}>
                {contacts.length === 0 ? (
                    <div className={styles.emptyState}>
                        <Inbox size={48} strokeWidth={1} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                        <h3>Inbox Empty</h3>
                        <p>No new contacts waiting for review.</p>
                    </div>
                ) : (
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Contact Info</th>
                                    <th>Source Form</th>
                                    <th>Submitted</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {contacts.map(contact => (
                                    <tr key={contact.id}>
                                        <td>
                                            <div className={styles.name}>{contact.name}</div>
                                            {contact.company && <div className={styles.company}>{contact.company}</div>}
                                        </td>
                                        <td>
                                            <div className={styles.contactRow}>
                                                <Mail size={14} /> <span>{contact.email}</span>
                                            </div>
                                            {contact.phone && (
                                                <div className={styles.contactRow}>
                                                    <Phone size={14} /> <span>{contact.phone}</span>
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <span className={styles.sourceTag}>{contact.form_name}</span>
                                        </td>
                                        <td>
                                            <div className={styles.date}>
                                                <Calendar size={14} />
                                                <span>{new Date(contact.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className={styles.actions}>
                                                <button
                                                    onClick={() => handleOpenConvert(contact)}
                                                    className={styles.convertBtn}
                                                >
                                                    Convert <ArrowRight size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(contact.id)}
                                                    className={styles.deleteBtn}
                                                    title="Discard"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>

            <ConvertToLeadModal
                contact={selectedContact}
                isOpen={isConvertModalOpen}
                onClose={() => setIsConvertModalOpen(false)}
                onConverted={() => {
                    fetchContacts();
                    setIsConvertModalOpen(false);
                }}
            />
        </div>
    );
}

"use client";

import React from 'react';
import {
    X,
    Edit2,
    Phone,
    Mail,
    Calendar,
    User,
    Tag,
    IndianRupee,
    Clock,
    Plus,
    ArrowLeft,
    CheckCircle2,
    Trash2
} from 'lucide-react';
import styles from './LeadDetailsModal.module.css';

import { Lead } from '@/lib/storage';

interface LeadDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    lead: Lead | null;
}

export default function LeadDetailsModal({ isOpen, onClose, lead }: LeadDetailsModalProps) {
    const [activities, setActivities] = React.useState<{ id: string, title: string, date: string }[]>([]);
    const [isAddingActivity, setIsAddingActivity] = React.useState(false);
    const [activityInput, setActivityInput] = React.useState('');

    React.useEffect(() => {
        if (lead && lead.created_at) {
            setActivities([
                {
                    id: '1',
                    title: 'Lead Created',
                    date: new Date(lead.created_at).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })
                }
            ]);
        }
    }, [lead]);

    if (!isOpen || !lead) return null;

    const handleAddActivity = () => {
        setIsAddingActivity(true);
    };

    const saveActivity = () => {
        if (!activityInput.trim()) return;

        const newActivity = {
            id: Date.now().toString(),
            title: activityInput,
            date: new Date().toLocaleString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
        };
        setActivities([newActivity, ...activities]);
        setActivityInput('');
        setIsAddingActivity(false);
    };

    const deleteActivity = (id: string) => {
        setActivities(activities.filter(a => a.id !== id));
    };

    const formatDate = (dateStr: string | undefined) => {
        if (!dateStr) return 'Not set';
        try {
            return new Date(dateStr).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
        } catch (e) {
            return dateStr;
        }
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                {/* Header */}
                <header className={styles.header}>
                    <div className={styles.leftHeader}>
                        <button className={styles.backBtn} onClick={onClose}>
                            <ArrowLeft size={18} />
                            <span>Back to Leads</span>
                        </button>
                        <div className={styles.titleArea}>
                            <h1 className={styles.leadName}>{lead.name}</h1>
                            <span className={styles.subtitle}>Lead Details</span>
                        </div>
                    </div>
                </header>

                <div className={styles.contentGrid}>
                    {/* Main Content */}
                    <div className={styles.mainContent}>
                        <section className={styles.section}>
                            <div className={styles.sectionHeader}>
                                <h3>Lead Information</h3>
                                <div className={styles.badges}>
                                    <span className={styles.statusBadge}>{lead.status}</span>
                                    <span className={`${styles.priorityBadge} ${styles['prio' + lead.priority]}`}>{lead.priority}</span>
                                </div>
                            </div>

                            <div className={styles.infoGrid}>
                                <div className={styles.infoItem}>
                                    <label>Name</label>
                                    <p>{lead.name}</p>
                                </div>
                                <div className={styles.infoItem}>
                                    <label>Email</label>
                                    <div className={styles.withIcon}>
                                        <Mail size={14} /> <span>{lead.email}</span>
                                    </div>
                                </div>
                                <div className={styles.infoItem}>
                                    <label>Phone</label>
                                    <div className={styles.withIcon}>
                                        <Phone size={14} /> <span>{lead.phone}</span>
                                    </div>
                                </div>
                                <div className={styles.infoItem}>
                                    <label>Source</label>
                                    <p>{lead.source}</p>
                                </div>
                                <div className={styles.infoItem}>
                                    <label>Status</label>
                                    <p>{lead.status}</p>
                                </div>
                                <div className={styles.infoItem}>
                                    <label>Priority</label>
                                    <p>{lead.priority}</p>
                                </div>
                                <div className={styles.infoItem}>
                                    <label>Interested Service</label>
                                    <p>{lead.interested_service}</p>
                                </div>
                                <div className={styles.infoItem}>
                                    <label>Budget</label>
                                    <div className={styles.withIcon}>
                                        <IndianRupee size={14} /> <span>{(lead.budget || 0).toLocaleString('en-IN')}</span>
                                    </div>
                                </div>
                                <div className={styles.infoItem}>
                                    <label>Assigned To</label>
                                    <div className={styles.withIcon}>
                                        <User size={14} /> <span>{lead.assigned_to}</span>
                                    </div>
                                </div>
                                <div className={styles.fullWidth}>
                                    <label>Notes</label>
                                    <p className={styles.notes}>{lead.notes || 'No notes available.'}</p>
                                </div>
                            </div>
                        </section>

                        <section className={styles.section}>
                            <div className={styles.sectionHeader}>
                                <h3>Activity Timeline</h3>
                                <button className={styles.addActivityBtn} onClick={handleAddActivity}>
                                    <Plus size={16} />
                                    <span>Add Activity</span>
                                </button>
                            </div>
                            <div className={styles.timeline}>
                                {isAddingActivity && (
                                    <div className={styles.activityInputArea}>
                                        <textarea
                                            placeholder="Enter meeting note or activity..."
                                            value={activityInput}
                                            onChange={(e) => setActivityInput(e.target.value)}
                                            className={styles.activityTextarea}
                                            autoFocus
                                        />
                                        <div className={styles.activityActions}>
                                            <button onClick={saveActivity} className={styles.saveActivityBtn}>Save</button>
                                            <button onClick={() => { setIsAddingActivity(false); setActivityInput(''); }} className={styles.cancelActivityBtn}>Cancel</button>
                                        </div>
                                    </div>
                                )}
                                {activities.map(activity => (
                                    <div key={activity.id} className={styles.timelineItem}>
                                        <div className={styles.timelineIcon}><CheckCircle2 size={16} /></div>
                                        <div className={styles.timelineContent}>
                                            <p><strong>{activity.title}</strong></p>
                                            <span>{activity.date}</span>
                                        </div>
                                        <button
                                            className={styles.deleteActivityBtn}
                                            onClick={() => deleteActivity(activity.id)}
                                            title="Delete Activity"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* Sidebar */}
                    <aside className={styles.sidebar}>
                        <div className={styles.section}>
                            <h3>Quick Actions</h3>
                            <div className={styles.actionButtons}>
                                <button className={styles.actionBtn}><Phone size={16} /> Call Lead</button>
                                <button className={styles.actionBtn}><Mail size={16} /> Send Email</button>
                                <a href="https://meet.google.com/new" target="_blank" rel="noopener noreferrer" className={styles.actionBtn} style={{ textDecoration: 'none' }}>
                                    <Calendar size={16} /> Schedule Meeting
                                </a>
                            </div>
                        </div>

                        <div className={styles.section}>
                            <h3>Lead Timeline</h3>
                            <div className={styles.timelineDates}>
                                <div className={styles.dateItem}>
                                    <Clock size={16} />
                                    <div>
                                        <label>Created</label>
                                        <p>{formatDate(lead.created_at)}</p>
                                    </div>
                                </div>
                                <div className={styles.dateItem}>
                                    <Calendar size={16} />
                                    <div>
                                        <label>Next Follow-up</label>
                                        <p>{formatDate(lead.next_follow_up)}</p>
                                    </div>
                                </div>
                                <div className={styles.dateItem}>
                                    <Clock size={16} />
                                    <div>
                                        <label>Last Updated</label>
                                        <p>{formatDate(lead.created_at)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}

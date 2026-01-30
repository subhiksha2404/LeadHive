"use client";

import { useState, useEffect, useCallback } from 'react';
import {
    Users,
    Target,
    Calendar,
    UserPlus,
    Mail,
    Phone,
    Download,
    Upload,
    ChevronDown,
    Eye,
    Video
} from 'lucide-react';
import LeadDetailsModal from '@/components/leads/LeadDetailsModal';
import styles from './Management.module.css';
import { leadsService, Lead } from '@/lib/storage';

export default function ManagementPage() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
    const [actionDropdownOpen, setActionDropdownOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState<{ type: 'assign' | 'status' | 'delete' | null, value?: string }>({ type: null });

    const [viewingLead, setViewingLead] = useState<Lead | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const data = await leadsService.getLeads();
        setLeads(data);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
        window.addEventListener('leads-updated', fetchData);
        return () => window.removeEventListener('leads-updated', fetchData);
    }, [fetchData]);

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedLeads(leads.map(l => l.id));
        } else {
            setSelectedLeads([]);
        }
    };

    const handleSelectLead = (id: string) => {
        if (selectedLeads.includes(id)) {
            setSelectedLeads(selectedLeads.filter(l => l !== id));
        } else {
            setSelectedLeads([...selectedLeads, id]);
        }
    };

    const executeAction = async () => {
        if (!pendingAction.type) return;

        if (pendingAction.type === 'delete') {
            await Promise.all(selectedLeads.map(id => leadsService.deleteLead(id)));
        } else if (pendingAction.type === 'status' && pendingAction.value) {
            await Promise.all(selectedLeads.map(id => leadsService.updateLead(id, { status: pendingAction.value! })));
        } else if (pendingAction.type === 'assign' && pendingAction.value) {
            await Promise.all(selectedLeads.map(id => leadsService.updateLead(id, { assigned_to: pendingAction.value! })));
        }

        setSelectedLeads([]);
        setPendingAction({ type: null });
        setActionDropdownOpen(false);
        await fetchData();
    };

    const handleExport = () => {
        const dataStr = JSON.stringify(leads, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', 'leadhive_export.json');
        linkElement.click();
    };

    const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const content = e.target?.result as string;
                const parsedLeads = JSON.parse(content);
                if (Array.isArray(parsedLeads)) {
                    await leadsService.addLeadsBulk(parsedLeads);
                    alert('Leads imported successfully!');
                    await fetchData();
                } else {
                    alert('Invalid file format.');
                }
            } catch (error) {
                console.error('Import error:', error);
                alert('Error importing leads.');
            }
        };
        reader.readAsText(file);
    };

    const isAllSelected = leads.length > 0 && selectedLeads.length === leads.length;

    // --- KPI Calculations ---
    const totalLeads = leads.length;
    const highBudgetLeads = leads.filter(l => (Number(l.budget) || 0) > 80000).length;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdueFollowUps = leads.filter(l => {
        if (!l.next_follow_up) return false;
        return new Date(l.next_follow_up) < today;
    }).length;

    const followUpLeads = leads.filter(l => l.next_follow_up && new Date(l.next_follow_up) >= today)
        .sort((a, b) => new Date(a.next_follow_up!).getTime() - new Date(b.next_follow_up!).getTime());

    const nearestFollowUp = followUpLeads[0];

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>Lead Management</h1>
                    <p className={styles.subtitle}>Bulk operations and advanced lead management tools.</p>
                </div>
                <div className={styles.headerActions}>
                    <input type="file" id="import-file" style={{ display: 'none' }} accept=".json" onChange={handleImportFile} />
                    <button className={styles.secondaryBtn} onClick={() => document.getElementById('import-file')?.click()}><Upload size={18} /> Import Leads</button>
                    <button className={styles.secondaryBtn} onClick={handleExport}><Download size={18} /> Export Leads</button>
                </div>
            </header>

            <div className={styles.summaryGrid}>
                <div className={styles.summaryCard}>
                    <Users size={20} className={styles.iconBlue} />
                    <div>
                        <span className={styles.label}>Total Leads</span>
                        <div className={styles.value}>{totalLeads}</div>
                    </div>
                </div>
                <div className={styles.summaryCard}>
                    <UserPlus size={20} className={styles.iconGreen} />
                    <div>
                        <span className={styles.label}>High-Budget Leads</span>
                        <div className={styles.value}>{highBudgetLeads}</div>
                    </div>
                </div>
                <div className={styles.summaryCard}>
                    <Target size={20} style={{ color: overdueFollowUps > 0 ? '#ef4444' : '#fbbf24' }} />
                    <div>
                        <span className={styles.label}>Overdue Follow-ups</span>
                        <div className={styles.value}>{overdueFollowUps}</div>
                    </div>
                </div>
                <div className={styles.summaryCard}>
                    <Calendar size={20} className={styles.iconRed} />
                    <div>
                        <span className={styles.label}>Nearest Follow-up</span>
                        <div className={styles.value} style={{ fontSize: '1.2rem' }}>
                            {nearestFollowUp ? (
                                <>
                                    {nearestFollowUp.name}
                                    <span style={{ display: 'block', fontSize: '0.8rem', opacity: 0.8, fontWeight: 'normal' }}>
                                        {new Date(nearestFollowUp.next_follow_up!).toLocaleDateString()}
                                    </span>
                                </>
                            ) : 'None'}
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.content}>
                {selectedLeads.length > 0 && (
                    <div className={styles.floatingBar}>
                        <div className={styles.selectionCount}>{selectedLeads.length} leads selected</div>
                        <div className={styles.actionWrapper}>
                            {!pendingAction.type && (
                                <>
                                    <button className={styles.actionTrigger} onClick={() => setActionDropdownOpen(!actionDropdownOpen)}>
                                        Choose action <ChevronDown size={16} />
                                    </button>
                                    {actionDropdownOpen && (
                                        <div className={styles.dropdown}>
                                            <div className={styles.dropdownItem} onClick={() => { setPendingAction({ type: 'assign' }); setActionDropdownOpen(false); }}>Assign to</div>
                                            <div className={styles.dropdownItem} onClick={() => { setPendingAction({ type: 'status' }); setActionDropdownOpen(false); }}>Change status</div>
                                            <div className={`${styles.dropdownItem} ${styles.deleteItem}`} onClick={() => { setPendingAction({ type: 'delete' }); setActionDropdownOpen(false); }}>Delete</div>
                                        </div>
                                    )}
                                </>
                            )}
                            {pendingAction.type === 'assign' && (
                                <select className={styles.actionSelect} onChange={(e) => setPendingAction({ ...pendingAction, value: e.target.value })} value={pendingAction.value || ''}>
                                    <option value="" disabled>Select User...</option>
                                    <option value="Sarah Johnson">Sarah Johnson</option>
                                    <option value="Mike Chen">Mike Chen</option>
                                    <option value="Alex Rodriguez">Alex Rodriguez</option>
                                </select>
                            )}
                            {pendingAction.type === 'status' && (
                                <select className={styles.actionSelect} onChange={(e) => setPendingAction({ ...pendingAction, value: e.target.value })} value={pendingAction.value || ''}>
                                    <option value="" disabled>Select Status...</option>
                                    {leadsService.getAllStagesSync().map(stage => (
                                        <option key={stage.id} value={stage.name}>{stage.name}</option>
                                    ))}
                                </select>
                            )}
                            {pendingAction.type === 'delete' && <span className={styles.warningText}>Are you sure you want to delete these leads?</span>}
                        </div>
                        <div className={styles.executeActions}>
                            {(pendingAction.type) && (
                                <button className={styles.executeBtn} onClick={executeAction}>
                                    {pendingAction.type === 'delete' ? 'Confirm Delete' : 'Update'}
                                </button>
                            )}
                            <button className={styles.cancelBtn} onClick={() => { setSelectedLeads([]); setPendingAction({ type: null }); }}>Cancel</button>
                        </div>
                    </div>
                )}

                <div className={styles.tableWrapper}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '2rem' }}>Loading Leads...</div>
                    ) : (
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th><input type="checkbox" checked={isAllSelected} onChange={handleSelectAll} /></th>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Phone</th>
                                    <th>Pipeline</th>
                                    <th>Stage</th>
                                    <th>Assigned To</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leads.map(lead => (
                                    <tr key={lead.id} className={selectedLeads.includes(lead.id) ? styles.selectedRow : ''}>
                                        <td><input type="checkbox" checked={selectedLeads.includes(lead.id)} onChange={() => handleSelectLead(lead.id)} /></td>
                                        <td>
                                            <div className={styles.name}>{lead.name}</div>
                                            <div className={styles.company}>{lead.company}</div>
                                        </td>
                                        <td>{lead.email}</td>
                                        <td>{lead.phone}</td>
                                        <td>{lead.pipeline_name || 'Main Pipeline'}</td>
                                        <td>
                                            <span className={styles.statusBadge} style={{
                                                backgroundColor: lead.stage_color ? `${lead.stage_color}15` : '#f1f5f9',
                                                color: lead.stage_color || '#64748b',
                                                borderColor: lead.stage_color ? `${lead.stage_color}30` : '#e2e8f0',
                                                borderStyle: 'solid',
                                                borderWidth: '1px'
                                            }}>
                                                {lead.status}
                                            </span>
                                        </td>
                                        <td>{lead.assigned_to}</td>
                                        <td>
                                            <div className={styles.actions}>
                                                <button onClick={() => { setViewingLead(lead); setIsDetailsOpen(true); }} className={styles.actionBtn} title="View Details"><Eye size={16} /></button>
                                                <a href="https://meet.google.com/new" target="_blank" className={styles.actionBtn} title="Schedule Meet"><Video size={16} /></a>
                                                <a href={`https://mail.google.com/mail/?view=cm&fs=1&to=${lead.email}`} target="_blank" className={styles.actionBtn} title="Send Gmail"><Mail size={16} /></a>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            <LeadDetailsModal isOpen={isDetailsOpen} onClose={() => { setIsDetailsOpen(false); setViewingLead(null); }} lead={viewingLead} />
        </div>
    );
}

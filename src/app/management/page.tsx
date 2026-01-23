"use client";

import { useState, useEffect } from 'react';
import {
    Users,
    UserCheck,
    Target,
    Calendar,
    CheckCircle2,
    UserPlus,
    Mail,
    Phone,
    FileText,
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

    // Modal State
    const [viewingLead, setViewingLead] = useState<Lead | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [editingLead, setEditingLead] = useState<Lead | null>(null); // Kept if needed by modal props, though edit is disabled in table


    useEffect(() => {
        // Initial load
        setLeads(leadsService.getLeads());

        // Listen for updates
        const handleLeadsUpdate = () => {
            setLeads(leadsService.getLeads());
        };

        window.addEventListener('leads-updated', handleLeadsUpdate);
        return () => window.removeEventListener('leads-updated', handleLeadsUpdate);
    }, []);

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

    const executeAction = () => {
        if (!pendingAction.type) return;

        if (pendingAction.type === 'delete') {
            selectedLeads.forEach(id => leadsService.deleteLead(id));
        } else if (pendingAction.type === 'status' && pendingAction.value) {
            selectedLeads.forEach(id => leadsService.updateLead(id, { status: pendingAction.value! }));
        } else if (pendingAction.type === 'assign' && pendingAction.value) {
            selectedLeads.forEach(id => leadsService.updateLead(id, { assigned_to: pendingAction.value! }));
        }

        // Reset
        setSelectedLeads([]);
        setPendingAction({ type: null });
        setActionDropdownOpen(false);
    };

    const handleExport = () => {
        const dataStr = JSON.stringify(leads, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

        const exportFileDefaultName = 'leadhive_export.json';

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };

    const handleImportClick = () => {
        const fileInput = document.getElementById('import-file');
        if (fileInput) fileInput.click();
    };

    const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
        const fileReader = new FileReader();
        const file = event.target.files?.[0];

        if (file) {
            fileReader.readAsText(file, "UTF-8");
            fileReader.onload = (e) => {
                try {
                    const content = e.target?.result as string;
                    const parsedLeads = JSON.parse(content);
                    if (Array.isArray(parsedLeads)) {
                        parsedLeads.forEach((lead: any) => {
                            // Ensure ID is unique or let addLead handle it if we strip ID (but addLead generates new ID)
                            // Ideally check if ID exists to update, else add. simplicity: just add/update
                            if (lead.id && leadsService.getLeadById(lead.id)) {
                                leadsService.updateLead(lead.id, lead);
                            } else {
                                const { id, ...rest } = lead; // strip ID to let addLead generate one if needed, or keep if we trust it
                                leadsService.addLead(rest);
                            }
                        });
                        alert('Leads imported successfully!');
                    } else {
                        alert('Invalid file format. Expected an array of leads.');
                    }
                } catch (error) {
                    console.error('Error parsing JSON:', error);
                    alert('Error importing leads. Please check the file format.');
                }
            };
        }
    };

    const isAllSelected = leads.length > 0 && selectedLeads.length === leads.length;

    // --- KPI Calculations ---
    const totalLeads = leads.length;
    const newLeads = leads.filter(l => (l.status || 'New') === 'New').length; // Logic: Status is 'New'
    const qualifiedLeads = leads.filter(l => (l.status === 'Qualified' || l.status === 'Quotation Sent')).length; // Grouping similar positive statuses
    const convertedLeads = leads.filter(l => l.status === 'Payment Done').length;
    const followUpLeads = leads.filter(l => {
        if (!l.next_follow_up) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const followUpDate = new Date(l.next_follow_up);
        return followUpDate >= today;
    }).sort((a, b) => new Date(a.next_follow_up || '').getTime() - new Date(b.next_follow_up || '').getTime());

    const nearestFollowUp = followUpLeads[0];

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>Lead Management</h1>
                    <p className={styles.subtitle}>Bulk operations and advanced lead management tools.</p>
                </div>
                <div className={styles.headerActions}>
                    <input
                        type="file"
                        id="import-file"
                        style={{ display: 'none' }}
                        accept=".json"
                        onChange={handleImportFile}
                    />
                    <button className={styles.secondaryBtn} onClick={handleImportClick}><Upload size={18} /> Import Leads</button>
                    <button className={styles.secondaryBtn} onClick={handleExport}><Download size={18} /> Export Leads</button>
                </div>
            </header>

            {/* Summary Cards */}
            <div className={styles.summaryGrid}>
                {/* ... existing summary cards ... */}
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
                        <span className={styles.label}>New Leads</span>
                        <div className={styles.value}>{newLeads}</div>
                    </div>
                </div>
                <div className={styles.summaryCard}>
                    <Target size={20} className={styles.iconYellow} />
                    <div>
                        <span className={styles.label}>Qualified</span>
                        <div className={styles.value}>{qualifiedLeads}</div>
                    </div>
                </div>
                <div className={styles.summaryCard}>
                    <CheckCircle2 size={20} className={styles.iconPurple} />
                    <div>
                        <span className={styles.label}>Converted</span>
                        <div className={styles.value}>{convertedLeads}</div>
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
                                        {new Date(nearestFollowUp.next_follow_up || '').toLocaleDateString()}
                                    </span>
                                </>
                            ) : 'None'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className={styles.content}>
                {selectedLeads.length > 0 && (
                    <div className={styles.floatingBar}>
                        <div className={styles.selectionCount}>
                            {selectedLeads.length} leads selected
                        </div>

                        <div className={styles.actionWrapper}>
                            {/* Primary Action Selector */}
                            {!pendingAction.type && (
                                <>
                                    <button
                                        className={styles.actionTrigger}
                                        onClick={() => setActionDropdownOpen(!actionDropdownOpen)}
                                    >
                                        Choose action
                                        <ChevronDown size={16} />
                                    </button>

                                    {actionDropdownOpen && (
                                        <div className={styles.dropdown}>
                                            <div className={styles.dropdownItem} onClick={() => { setPendingAction({ type: 'assign' }); setActionDropdownOpen(false); }}>Assign to</div>
                                            <div className={styles.dropdownItem} onClick={() => { setPendingAction({ type: 'status' }); setActionDropdownOpen(false); }}>Change status</div>
                                            {/* Bulk email removed as per request */}
                                            <div className={`${styles.dropdownItem} ${styles.deleteItem}`} onClick={() => { setPendingAction({ type: 'delete' }); }}>Delete</div>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Secondary Value Selectors */}
                            {pendingAction.type === 'assign' && (
                                <select
                                    className={styles.actionSelect}
                                    onChange={(e) => setPendingAction({ ...pendingAction, value: e.target.value })}
                                    value={pendingAction.value || ''}
                                >
                                    <option value="" disabled>Select User...</option>
                                    <option value="Sarah Johnson">Sarah Johnson</option>
                                    <option value="Mike Chen">Mike Chen</option>
                                    <option value="Alex Rodriguez">Alex Rodriguez</option>
                                </select>
                            )}

                            {pendingAction.type === 'status' && (
                                <select
                                    className={styles.actionSelect}
                                    onChange={(e) => setPendingAction({ ...pendingAction, value: e.target.value })}
                                    value={pendingAction.value || ''}
                                >
                                    <option value="" disabled>Select Status...</option>
                                    <option value="New">New</option>
                                    <option value="Contacted">Contacted</option>
                                    <option value="Call not answered">Call not answered</option>
                                    <option value="Qualified">Qualified</option>
                                    <option value="Follow Up">Follow Up</option>
                                    <option value="Quotation Sent">Quotation Sent</option>
                                    <option value="Payment Done">Payment Done</option>
                                </select>
                            )}

                            {pendingAction.type === 'delete' && (
                                <span className={styles.warningText}>Are you sure you want to delete these leads?</span>
                            )}
                        </div>

                        <div className={styles.executeActions}>
                            {(pendingAction.type === 'assign' || pendingAction.type === 'status' || pendingAction.type === 'delete') && (
                                <button className={styles.executeBtn} onClick={executeAction}>
                                    {pendingAction.type === 'delete' ? 'Confirm Delete' : 'Update'}
                                </button>
                            )}
                            <button className={styles.cancelBtn} onClick={() => { setSelectedLeads([]); setPendingAction({ type: null }); }}>Cancel</button>
                        </div>
                    </div>
                )}

                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>
                                    <input
                                        type="checkbox"
                                        checked={isAllSelected}
                                        onChange={handleSelectAll}
                                    />
                                </th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Status</th>
                                <th>Assigned To</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leads.map(lead => (
                                <tr key={lead.id} className={selectedLeads.includes(lead.id) ? styles.selectedRow : ''}>
                                    <td>
                                        <input
                                            type="checkbox"
                                            checked={selectedLeads.includes(lead.id)}
                                            onChange={() => handleSelectLead(lead.id)}
                                        />
                                    </td>
                                    <td>
                                        <div className={styles.name}>{lead.name}</div>
                                        <div className={styles.company}>{lead.company}</div>
                                    </td>
                                    <td>{lead.email}</td>
                                    <td>{lead.phone}</td>
                                    <td>
                                        <span className={`${styles.statusBadge} ${styles['status' + (lead.status || 'New').replace(' ', '')] || styles.statusNew}`}>
                                            {lead.status || 'New'}
                                        </span>
                                    </td>
                                    <td>{lead.assigned_to}</td>
                                    <td>
                                        <div className={styles.actions}>
                                            <button
                                                onClick={() => { setViewingLead(lead); setIsDetailsOpen(true); }}
                                                title="View Details"
                                                className={styles.actionBtn}
                                            >
                                                <Eye size={16} />
                                            </button>
                                            <a
                                                href="https://meet.google.com/new"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                title="Schedule Meet"
                                                className={styles.actionBtn}
                                            >
                                                <Video size={16} />
                                            </a>
                                            <a
                                                href={`https://mail.google.com/mail/?view=cm&fs=1&to=${lead.email}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                title="Send Gmail"
                                                className={styles.actionBtn}
                                            >
                                                <Mail size={16} />
                                            </a>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <LeadDetailsModal
                isOpen={isDetailsOpen}
                onClose={() => { setIsDetailsOpen(false); setViewingLead(null); }}
                lead={viewingLead}
                onEdit={(lead) => {
                    // Edit functionality is currently disabled/hidden in table, 
                    // but we can preserve the prop or allow edit from modal if desired.
                    // For now, just close details to be safe or log it.
                    console.log("Edit requested for", lead);
                    setIsDetailsOpen(false);
                }}
            />
        </div>
    );
}

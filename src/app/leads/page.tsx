"use client";

import { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    Filter,
    ChevronDown,
    Grid2X2,
    List,
    Eye,
    Edit2,
    Mail,
    Phone
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import styles from './Leads.module.css';
import KanbanBoard from '@/components/leads/KanbanBoard';
import LeadModal from '@/components/leads/LeadModal';
import LeadDetailsModal from '@/components/leads/LeadDetailsModal';
import { leadsService } from '@/lib/storage';

export default function LeadsPage() {
    const searchParams = useSearchParams();
    const initialSearch = searchParams.get('q') || '';

    const [view, setView] = useState<'list' | 'kanban'>('list');
    const [search, setSearch] = useState(initialSearch);
    const [leads, setLeads] = useState<any[]>([]);
    const [statusFilter, setStatusFilter] = useState('all');
    const [sourceFilter, setSourceFilter] = useState('all');
    const [sortBy, setSortBy] = useState('Date Created');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLead, setEditingLead] = useState<any>(null);
    const [viewingLead, setViewingLead] = useState<any>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    // Update search if URL changes (though mostly for initial load)
    useEffect(() => {
        const query = searchParams.get('q');
        if (query !== null) {
            setSearch(query);
        }
    }, [searchParams]);

    useEffect(() => {
        setIsMounted(true);
        // Initial load
        setLeads(leadsService.getLeads());

        // Listen for updates
        const handleLeadsUpdate = () => {
            setLeads(leadsService.getLeads());
        };

        window.addEventListener('leads-updated', handleLeadsUpdate);
        return () => window.removeEventListener('leads-updated', handleLeadsUpdate);
    }, []);

    const handleAddLead = (data: any) => {
        if (editingLead) {
            leadsService.updateLead(editingLead.id, data);
        } else {
            leadsService.addLead(data);
        }
        setEditingLead(null);
    };


    const handleLeadMove = (id: string, newStatus: string) => {
        leadsService.updateLead(id, { status: newStatus });
    };

    const getFilteredLeads = () => {
        let filtered = [...leads];

        // Search
        if (search) {
            const query = search.toLowerCase();
            filtered = filtered.filter(l =>
                l.name.toLowerCase().includes(query) ||
                l.email.toLowerCase().includes(query) ||
                (l.phone && l.phone.includes(query))
            );
        }

        // Status Filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(l => l.status === statusFilter);
        }

        // Source Filter
        if (sourceFilter !== 'all') {
            filtered = filtered.filter(l => l.source === sourceFilter);
        }

        // Sorting
        filtered.sort((a, b) => {
            if (sortBy === 'Date Created') {
                return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
            } else if (sortBy === 'Budget') {
                return (Number(b.budget) || 0) - (Number(a.budget) || 0);
            } else if (sortBy === 'Priority') {
                const priorityOrder: any = { 'High': 3, 'Medium': 2, 'Low': 1 };
                return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
            } else if (sortBy === 'Follow up due') {
                // Ascending order: Nearest follow-ups first. Nulls last.
                const aDate = a.next_follow_up ? new Date(a.next_follow_up).getTime() : Infinity;
                const bDate = b.next_follow_up ? new Date(b.next_follow_up).getTime() : Infinity;
                return aDate - bDate;
            }
            return 0;
        });

        return filtered;
    };

    const filteredLeads = getFilteredLeads();

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>Lead Management</h1>
                    <p className={styles.subtitle}>Manage and track all your leads in one place.</p>
                </div>
                <Link href="/leads/new" className={styles.addBtn}>
                    <Plus size={20} />
                    <span>Add New Lead</span>
                </Link>
            </header>

            {/* Filters Bar */}
            <div className={styles.filtersBar}>
                <div className={styles.searchWrapper}>
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search leads..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className={styles.selectWrapper}>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All Status</option>
                        <option value="Enquiry">Enquiry</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Call not answered">Call not answered</option>
                        <option value="Quotation Sent">Quotation Sent</option>
                        <option value="Payment Done">Payment Done</option>
                    </select>
                    <ChevronDown size={16} />
                </div>

                <div className={styles.selectWrapper}>
                    <select
                        value={sourceFilter}
                        onChange={(e) => setSourceFilter(e.target.value)}
                    >
                        <option value="all">All Sources</option>
                        <option value="Website">Website</option>
                        <option value="Facebook">Facebook</option>
                        <option value="Google Ads">Google Ads</option>
                        <option value="Referral">Referral</option>
                    </select>
                    <ChevronDown size={16} />
                </div>



                <div className={styles.viewToggle}>
                    <button
                        className={`${styles.toggleBtn} ${view === 'list' ? styles.activeToggle : ''}`}
                        onClick={() => setView('list')}
                    >
                        <List size={18} />
                    </button>
                    <button
                        className={`${styles.toggleBtn} ${view === 'kanban' ? styles.activeToggle : ''}`}
                        onClick={() => setView('kanban')}
                    >
                        <Grid2X2 size={18} />
                    </button>
                </div>
            </div>

            <div className={styles.statsSummary}>
                <span>Showing {filteredLeads.length} of {leads.length} leads</span>
                <div className={styles.sortBy}>
                    <span>Sort by:</span>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                    >
                        <option>Date Created</option>
                        <option>Budget</option>
                        <option>Priority</option>
                        <option>Follow up due</option>
                    </select>
                </div>
            </div>

            {view === 'list' ? (
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Contact</th>
                                <th>Source</th>
                                <th>Status</th>
                                <th>Priority</th>
                                <th>Interested Model</th>
                                <th>Budget</th>
                                <th>Assigned To</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLeads.map((lead) => (
                                <tr key={lead.id}>
                                    <td>
                                        <div className={styles.leadName}>{lead.name}</div>
                                        <div className={styles.leadDate}>Created at {new Date(lead.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }).replace(', ', ',     ')}</div>

                                    </td>
                                    <td>
                                        <div className={styles.contactItem}>
                                            <Mail size={14} /> <span>{lead.email}</span>
                                        </div>
                                        <div className={styles.contactItem}>
                                            <Phone size={14} /> <span>{lead.phone}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={styles.sourceTag}>{lead.source}</span>
                                    </td>
                                    <td>
                                        <span className={`${styles.statusBadge} ${styles['status' + (lead.status || 'New').replace(' ', '')] || styles.statusNew}`}>
                                            {lead.status || 'New'}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`${styles.priorityBadge} ${styles['priority' + lead.priority]}`}>
                                            {lead.priority}
                                        </span>
                                    </td>
                                    <td>{lead.interested_model}</td>
                                    <td>₹{isMounted ? lead.budget.toLocaleString('en-IN') : lead.budget.toString()}</td>
                                    <td>{lead.assigned_to}</td>
                                    <td>
                                        <div className={styles.actions}>
                                            <button
                                                onClick={() => { setViewingLead(lead); setIsDetailsOpen(true); }}
                                                title="View Details"
                                                className={styles.actionBtn}
                                            >
                                                <Eye size={18} />
                                            </button>
                                            <Link href={`/leads/edit/${lead.id}`} title="Edit" className={styles.actionBtn}>
                                                <Edit2 size={18} />
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <KanbanBoard
                    leads={filteredLeads}
                    onLeadMove={handleLeadMove}
                    onPreview={(lead) => { setViewingLead(lead); setIsDetailsOpen(true); }}
                />
            )}


            <LeadDetailsModal
                isOpen={isDetailsOpen}
                onClose={() => { setIsDetailsOpen(false); setViewingLead(null); }}
                lead={viewingLead}
                onEdit={(lead) => {
                    setViewingLead(null);
                    setIsDetailsOpen(false);
                    setEditingLead(lead);
                    setIsModalOpen(true);
                }}
            />
        </div>
    );
}

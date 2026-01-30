"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Plus,
    Search,
    ChevronDown,
    List,
    Grid2X2,
    Mail,
    Phone,
    Eye,
    Edit2
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import styles from './Leads.module.css';
import KanbanBoard from '@/components/leads/KanbanBoard';
import LeadDetailsModal from '@/components/leads/LeadDetailsModal';
import { leadsService } from '@/lib/storage';
import { Lead, Pipeline, Stage } from '@/types/lead';


export default function LeadsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialSearch = searchParams.get('q') || '';
    const initialPipelineId = searchParams.get('p');

    const [view, setView] = useState<'list' | 'kanban'>('list');
    const [search, setSearch] = useState(initialSearch);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [pipelines, setPipelines] = useState<Pipeline[]>([]);
    const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(initialPipelineId);
    const [stages, setStages] = useState<Stage[]>([]);
    const [statusFilter, setStatusFilter] = useState('all');
    const [sourceFilter, setSourceFilter] = useState('all');
    const [sortBy, setSortBy] = useState('Date Created');
    const [viewingLead, setViewingLead] = useState<Lead | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const [leadsData, pipelinesData] = await Promise.all([
            leadsService.getLeads(),
            leadsService.getPipelines()
        ]);

        let finalPipelines = pipelinesData;
        if (pipelinesData.length === 0) {
            const defaultPipeline = await leadsService.ensureDefaultPipeline();
            if (defaultPipeline) finalPipelines = [defaultPipeline];
        }

        setLeads(leadsData);
        setPipelines(finalPipelines);

        if (!selectedPipelineId && finalPipelines.length > 0) {
            setSelectedPipelineId(finalPipelines[0].id);
        }

        setLoading(false);
    }, [selectedPipelineId]);

    useEffect(() => {
        setIsMounted(true);
        fetchData();

        const handleLeadsUpdated = () => fetchData();
        window.addEventListener('leads-updated', handleLeadsUpdated);
        return () => window.removeEventListener('leads-updated', handleLeadsUpdated);
    }, [fetchData]);

    const selectedPipeline = useMemo(() => {
        return pipelines.find(p => p.id === selectedPipelineId) || pipelines[0] || null;
    }, [pipelines, selectedPipelineId]);

    useEffect(() => {
        const fetchStages = async () => {
            if (selectedPipeline) {
                const sData = await leadsService.getStages(selectedPipeline.id);
                setStages(sData);
            }
        };
        fetchStages();
    }, [selectedPipeline]);

    // Update URL when pipeline changes
    useEffect(() => {
        if (isMounted && selectedPipelineId) {
            const params = new URLSearchParams(searchParams.toString());
            params.set('p', selectedPipelineId);
            router.replace(`/leads?${params.toString()}`, { scroll: false });
        }
        setStatusFilter('all');
    }, [selectedPipelineId, isMounted, router, searchParams]);

    const activeLeads = useMemo(() => {
        if (selectedPipelineId === 'general') return leads;
        if (!selectedPipeline) return [];
        const isFirstPipeline = pipelines[0]?.id === selectedPipeline.id;

        return leads.filter(l =>
            l.pipeline_id === selectedPipeline.id ||
            (isFirstPipeline && (!l.pipeline_id || l.pipeline_id === ''))
        );
    }, [leads, selectedPipeline, pipelines, selectedPipelineId]);

    const filteredLeads = useMemo(() => {
        let filtered = [...activeLeads];

        if (search) {
            const query = search.toLowerCase();
            filtered = filtered.filter(l =>
                l.name.toLowerCase().includes(query) ||
                l.email.toLowerCase().includes(query) ||
                (l.phone && l.phone.includes(query))
            );
        }

        if (statusFilter !== 'all') {
            filtered = filtered.filter(l => l.status === statusFilter);
        }

        if (sourceFilter !== 'all') {
            filtered = filtered.filter(l => l.source && l.source.toLowerCase().includes(sourceFilter.toLowerCase()));
        }

        filtered.sort((a, b) => {
            if (sortBy === 'Date Created') {
                return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
            } else if (sortBy === 'Budget') {
                return (Number(b.budget) || 0) - (Number(a.budget) || 0);
            } else if (sortBy === 'Priority') {
                const priorityOrder: Record<string, number> = { 'High': 3, 'Medium': 2, 'Low': 1 };
                return (priorityOrder[b.priority || 'Medium'] || 0) - (priorityOrder[a.priority || 'Medium'] || 0);
            } else if (sortBy === 'Follow up due') {
                const aDate = a.next_follow_up ? new Date(a.next_follow_up).getTime() : Infinity;
                const bDate = b.next_follow_up ? new Date(b.next_follow_up).getTime() : Infinity;
                return aDate - bDate;
            }
            return 0;
        });

        return filtered;
    }, [activeLeads, search, statusFilter, sourceFilter, sortBy]);

    const handleLeadMove = async (id: string, newStatus: string, stageId?: string) => {
        await leadsService.updateLead(id, { status: newStatus, stage_id: stageId });
        await fetchData();
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>{selectedPipeline?.name || 'Pipeline'} Management</h1>
                    <p className={styles.subtitle}>Track your leads through the {selectedPipeline?.name || 'pipeline'} stages.</p>
                </div>
                <div className={styles.headerActions}>
                    <Link href="/leads/new" className={styles.addBtn}>
                        <Plus size={20} />
                        <span>Add New Lead</span>
                    </Link>
                </div>
            </header>

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
                        disabled={selectedPipelineId === 'general'}
                    >
                        <option value="all">All Stages</option>
                        {stages.map(s => (
                            <option key={s.id} value={s.name}>{s.name}</option>
                        ))}
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
                        <span>List View</span>
                    </button>
                    <button
                        className={`${styles.toggleBtn} ${view === 'kanban' ? styles.activeToggle : ''}`}
                        onClick={() => {
                            if (selectedPipelineId === 'general' && pipelines.length > 0) {
                                setSelectedPipelineId(pipelines[0].id);
                            }
                            setView('kanban');
                        }}
                    >
                        <Grid2X2 size={18} />
                        <span>Kanban View</span>
                    </button>
                </div>
            </div>

            <div className={styles.statsSummary}>
                <span>Showing {filteredLeads.length} of {leads.length} leads</span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginLeft: 'auto' }}>
                    <div className={styles.filterBox}>
                        <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Pipeline</span>
                        <select
                            value={selectedPipelineId || ''}
                            onChange={(e) => setSelectedPipelineId(e.target.value)}
                            style={{ minWidth: '180px' }}
                        >
                            {view === 'list' && <option value="general">Global View (All Pipelines)</option>}
                            {pipelines.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.filterBox}>
                        <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Sort by</span>
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
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '4rem' }}>Loading Leads...</div>
            ) : view === 'list' ? (
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Contact</th>
                                <th>Source</th>
                                <th>Pipeline</th>
                                <th>Stage</th>
                                <th>Priority</th>
                                <th>Interested Service</th>
                                <th>Budget</th>
                                <th>Assigned To</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLeads.map((lead) => {
                                const leadPipeline = pipelines.find(p => p.id === lead.pipeline_id) || pipelines[0];
                                const leadStage = stages.find(s => s.id === lead.stage_id);

                                return (
                                    <tr key={lead.id}>
                                        <td>
                                            <div className={styles.leadName}>{lead.name}</div>
                                            <div className={styles.leadDate}>
                                                Created at {lead.created_at ? new Date(lead.created_at).toLocaleString('en-IN') : 'N/A'}
                                            </div>
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
                                            <span style={{ fontWeight: 500 }}>{leadPipeline?.name || 'Main Pipeline'}</span>
                                        </td>
                                        <td>
                                            <span className={`${styles.statusBadge}`} style={{
                                                backgroundColor: leadStage?.color ? `${leadStage.color}15` : '#f1f5f9',
                                                color: leadStage?.color || '#64748b',
                                                borderColor: leadStage?.color ? `${leadStage.color}30` : '#e2e8f0',
                                                borderStyle: 'solid',
                                                borderWidth: '1px'
                                            }}>
                                                {leadStage?.name || lead.status || 'New'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`${styles.priorityBadge} ${styles['priority' + lead.priority]}`}>
                                                {lead.priority}
                                            </span>
                                        </td>
                                        <td>{lead.interested_service}</td>
                                        <td>₹{(lead.budget || 0).toLocaleString('en-IN')}</td>
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
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <KanbanBoard
                    leads={filteredLeads}
                    stages={stages}
                    onLeadMove={handleLeadMove}
                    onPreview={(lead) => { setViewingLead(lead); setIsDetailsOpen(true); }}
                />
            )}

            <LeadDetailsModal
                isOpen={isDetailsOpen}
                onClose={() => { setIsDetailsOpen(false); setViewingLead(null); }}
                lead={viewingLead}
            />
        </div>
    );
}

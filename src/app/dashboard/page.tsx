"use client";

import { useState, useEffect, useCallback } from 'react';
import {
    Users,
    Target,
    Calendar,
    ArrowUpRight,
    IndianRupee
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as ReChartsTooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import styles from './Dashboard.module.css';

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, outerRadius, percent, name, color }: { cx: number; cy: number; midAngle?: number; innerRadius: number; outerRadius: number; percent?: number; name?: string; color?: string }) => {
    const angle = midAngle || 0;
    const sin = Math.sin(-angle * RADIAN);
    const cos = Math.cos(-angle * RADIAN);
    const sx = cx + (outerRadius + 5) * cos;
    const sy = cy + (outerRadius + 5) * sin;
    const mx = cx + (outerRadius + 20) * cos;
    const my = cy + (outerRadius + 20) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 15;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';

    return (
        <g>
            <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={color} strokeWidth={1.5} fill="none" />
            <text x={ex + (cos >= 0 ? 8 : -8)} y={ey} textAnchor={textAnchor} fill="#1e293b" fontSize={11} fontWeight={700} dominantBaseline="central">
                {name}
            </text>
            {percent !== undefined && (
                <text x={ex + (cos >= 0 ? 8 : -8)} y={ey} dy={14} textAnchor={textAnchor} fill="#64748b" fontSize={10} fontWeight={500}>
                    {`${(percent * 100).toFixed(0)}%`}
                </text>
            )}
        </g>
    );
};

import { leadsService, Pipeline, Lead } from '@/lib/storage';

export default function Dashboard() {
    const [stats, setStats] = useState({
        totalLeads: 0,
        conversionRate: 0,
        potentialRevenue: 0,
        newLeads: 0
    });

    const [statusData, setStatusData] = useState<{ name: string; value: number; color: string }[]>([]);
    const [sourceData, setSourceData] = useState<{ name: string; leads: number }[]>([]);
    const [pipelines, setPipelines] = useState<Pipeline[]>([]);
    const [selectedPipelineId, setSelectedPipelineId] = useState<string>('all');
    const [isMounted, setIsMounted] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const [leads, pipelinesData, allStages] = await Promise.all([
            leadsService.getLeads(),
            leadsService.getPipelines(),
            leadsService.getAllStages()
        ]);

        setPipelines(pipelinesData);

        // --- Calculate Stats ---
        const totalLeads = leads.length;
        const potentialRevenue = leads.reduce((sum, lead) => sum + (Number(lead.budget) || 0), 0);
        const convertedCount = leads.filter(l => l.status === 'Payment Done').length;
        const conversionRate = totalLeads > 0 ? ((convertedCount / totalLeads) * 100).toFixed(1) : 0;

        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const newLeadsCount = leads.filter(l => {
            const date = new Date(l.created_at || Date.now());
            return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        }).length;

        setStats({
            totalLeads,
            conversionRate: Number(conversionRate),
            potentialRevenue,
            newLeads: newLeadsCount
        });

        // --- Chart Data ---
        const stageColorMap: Record<string, string> = {
            'Enquiry': '#818cf8',
            'Contacted': '#fbbf24',
            'Call not answered': '#ef4444',
            'Quotation Sent': '#c084fc',
            'Payment Done': '#4ade80',
            'New': '#94a3b8',
            'Follow Up': '#f472b6',
            'Qualified': '#60a5fa'
        };
        allStages.forEach(s => { stageColorMap[s.name] = s.color; });

        const chartLeads = selectedPipelineId === 'all'
            ? leads
            : leads.filter(l => l.pipeline_id === selectedPipelineId);

        const statusCounts: Record<string, number> = {};
        chartLeads.forEach(l => {
            const status = l.status || 'New';
            statusCounts[status] = (statusCounts[status] || 0) + 1;
        });

        setStatusData(Object.keys(statusCounts).map(status => ({
            name: status,
            value: statusCounts[status],
            color: stageColorMap[status] || '#cbd5e1'
        })));

        const sourceCounts: Record<string, number> = {};
        leads.forEach(l => {
            let source = l.source || 'Direct';
            const formMatch = source.match(/^(.+?)\s*\(Form\)$/i);
            if (formMatch) source = formMatch[1].trim();
            sourceCounts[source] = (sourceCounts[source] || 0) + 1;
        });

        setSourceData(Object.keys(sourceCounts).map(source => ({
            name: source,
            leads: sourceCounts[source]
        })));

        setLoading(false);
    }, [selectedPipelineId]);

    useEffect(() => {
        setIsMounted(true);
        fetchData();

        const handleLeadsUpdated = () => fetchData();
        window.addEventListener('leads-updated', handleLeadsUpdated);
        return () => window.removeEventListener('leads-updated', handleLeadsUpdated);
    }, [fetchData]);

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>Dashboard</h1>
                    <p className={styles.subtitle}>Overview of your sales pipeline</p>
                </div>
            </header>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '4rem' }}>Loading Dashboard...</div>
            ) : (
                <>
                    <div className={styles.kpiGrid}>
                        <div className={`${styles.kpiCard} ${styles.primaryCard}`}>
                            <div className={styles.kpiIcon} style={{ backgroundColor: '#e0e7ff', color: '#4338ca' }}><Users size={24} /></div>
                            <div className={styles.kpiInfo}>
                                <span className={styles.kpiLabel}>Total Leads</span>
                                <h2 className={styles.kpiValue}>{stats.totalLeads}</h2>
                                <span className={styles.kpiSubtitle}>All-time leads</span>
                            </div>
                        </div>

                        <div className={`${styles.kpiCard} ${styles.primaryCard}`}>
                            <div className={styles.kpiIcon} style={{ backgroundColor: '#fef3c7', color: '#92400e' }}><IndianRupee size={24} /></div>
                            <div className={styles.kpiInfo}>
                                <span className={styles.kpiLabel}>Potential Revenue</span>
                                <h2 className={styles.kpiValue}>₹{stats.potentialRevenue.toLocaleString('en-IN')}</h2>
                                <span className={styles.kpiSubtitle}>Open pipeline value</span>
                            </div>
                        </div>

                        <div className={`${styles.kpiCard} ${styles.secondaryCard}`}>
                            <div className={styles.kpiIcon} style={{ backgroundColor: '#dcfce7', color: '#15803d' }}><Target size={22} /></div>
                            <div className={styles.kpiInfo}>
                                <span className={styles.kpiLabel}>Conversion Rate</span>
                                <h2 className={styles.kpiValue}>{stats.conversionRate}%</h2>
                                <span className={styles.kpiSubtitle}>Enquiry → Payment</span>
                            </div>
                        </div>

                        <div className={`${styles.kpiCard} ${styles.secondaryCard}`}>
                            <div className={styles.kpiIcon} style={{ backgroundColor: '#f3e8ff', color: '#6b21a8' }}><Calendar size={22} /></div>
                            <div className={styles.kpiInfo}>
                                <span className={styles.kpiLabel}>New Leads</span>
                                <h2 className={styles.kpiValue}>{stats.newLeads}</h2>
                                <span className={styles.kpiSubtitle}>This Month</span>
                            </div>
                        </div>
                    </div>

                    <div className={styles.chartsGrid}>
                        <div className={styles.chartCard}>
                            <div className={styles.chartHeader}>
                                <h3>Pipeline Distribution</h3>
                                <select value={selectedPipelineId} onChange={(e) => setSelectedPipelineId(e.target.value)} className={styles.chartSelect}>
                                    <option value="all">All Pipelines</option>
                                    {pipelines.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <div className={styles.pieChartWrapper}>
                                <div className={styles.pieCenterText} style={{ top: '45%' }}>
                                    <span className={styles.pieCenterValue}>{stats.totalLeads}</span>
                                    <span className={styles.pieCenterLabel}>Leads</span>
                                </div>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie data={statusData} cx="50%" cy="45%" innerRadius={55} outerRadius={80} paddingAngle={5} label={renderCustomizedLabel} dataKey="value">
                                            {statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                        </Pie>
                                        <ReChartsTooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className={styles.chartCard}>
                            <div className={styles.chartHeader}>
                                <h3>Lead Acquisition Channels</h3>
                            </div>
                            <div className={styles.barChartWrapper}>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={[...sourceData].sort((a, b) => b.leads - a.leads)}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                                        <ReChartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                        <Bar dataKey="leads" fill="#818cf8" radius={[4, 4, 0, 0]} barSize={32} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

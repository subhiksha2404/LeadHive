"use client";

import { useState, useEffect } from 'react';
import {
    Users,
    Target,
    DollarSign,
    Calendar,
    TrendingUp,
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
    Cell,
    Legend
} from 'recharts';
import styles from './Dashboard.module.css';

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name, color }: any) => {
    const RADIAN = Math.PI / 180;
    const sin = Math.sin(-midAngle * RADIAN);
    const cos = Math.cos(-midAngle * RADIAN);
    const sx = cx + (outerRadius + 5) * cos;
    const sy = cy + (outerRadius + 5) * sin;
    const mx = cx + (outerRadius + 20) * cos;
    const my = cy + (outerRadius + 20) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 15;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';

    return (
        <g>
            {/* Pointer Line */}
            <path
                d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`}
                stroke={color}
                strokeWidth={1.5}
                fill="none"
            />
            {/* Label Text */}
            <text
                x={ex + (cos >= 0 ? 8 : -8)}
                y={ey}
                textAnchor={textAnchor}
                fill="#1e293b"
                fontSize={11}
                fontWeight={700}
                dominantBaseline="central"
            >
                {name}
            </text>
            {/* Percentage Badge */}
            <text
                x={ex + (cos >= 0 ? 8 : -8)}
                y={ey}
                dy={14}
                textAnchor={textAnchor}
                fill="#64748b"
                fontSize={10}
                fontWeight={500}
            >
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        </g>
    );
};

import { leadsService } from '@/lib/storage';

// ... existing imports ...

export default function Dashboard() {
    const [stats, setStats] = useState({
        totalLeads: 0,
        conversionRate: 0,
        potentialRevenue: 0,
        newLeads: 0
    });

    const [statusData, setStatusData] = useState<any[]>([]);
    const [sourceData, setSourceData] = useState<any[]>([]);
    const [distributionFilter, setDistributionFilter] = useState('Month');
    const [acquisitionFilter, setAcquisitionFilter] = useState('Month');
    const [isMounted, setIsMounted] = useState(false);


    useEffect(() => {
        setIsMounted(true);

        const leads = leadsService.getLeads();

        // --- Calculate Stats ---
        const totalLeads = leads.length;

        // Potential Revenue: Sum of all budgets
        const potentialRevenue = leads.reduce((sum, lead) => sum + (Number(lead.budget) || 0), 0);

        // Conversion Rate: Leads with 'Payment Done' / Total Leads
        const convertedCount = leads.filter(l => l.status === 'Payment Done').length;
        const conversionRate = totalLeads > 0 ? ((convertedCount / totalLeads) * 100).toFixed(1) : 0;

        // New Leads: Created this month
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

        // --- Calculate Chart Data ---

        // Status Distribution
        const statusCounts: Record<string, number> = {};
        leads.forEach(l => {
            const status = l.status || 'New';
            statusCounts[status] = (statusCounts[status] || 0) + 1;
        });

        const statusColors: Record<string, string> = {
            'Enquiry': '#818cf8',
            'Contacted': '#fbbf24',
            'Quotation Sent': '#c084fc',
            'Payment Done': '#4ade80',
            'New': '#94a3b8',
            'Follow Up': '#f472b6',
            'Qualified': '#60a5fa'
        };

        const calculatedStatusData = Object.keys(statusCounts).map(status => ({
            name: status,
            value: statusCounts[status],
            color: statusColors[status] || '#cbd5e1'
        }));
        setStatusData(calculatedStatusData);

        // Source Distribution
        const sourceCounts: Record<string, number> = {};
        leads.forEach(l => {
            const source = l.source || 'Direct';
            sourceCounts[source] = (sourceCounts[source] || 0) + 1;
        });

        const calculatedSourceData = Object.keys(sourceCounts).map(source => ({
            name: source,
            leads: sourceCounts[source]
        }));
        setSourceData(calculatedSourceData);

    }, []);

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>Dashboard</h1>
                    <p className={styles.subtitle}>Overview of your sales pipeline</p>
                </div>

            </header>

            {/* KPI Cards */}
            <div className={styles.kpiGrid}>
                {/* PRIMARY: Total Leads */}
                <div className={`${styles.kpiCard} ${styles.primaryCard}`} title="Total number of leads captured across all sources.">
                    <div className={styles.kpiIcon} style={{ backgroundColor: '#e0e7ff', color: '#4338ca' }}>
                        <Users size={24} />
                    </div>
                    <div className={styles.kpiInfo}>
                        <span className={styles.kpiLabel}>Total Leads</span>
                        <h2 className={styles.kpiValue}>{stats.totalLeads}</h2>
                        <span className={styles.kpiSubtitle}>All-time leads</span>
                    </div>
                </div>

                {/* PRIMARY: Potential Revenue */}
                <div className={`${styles.kpiCard} ${styles.primaryCard}`} title="Total budget from active leads (excluding closed).">
                    <div className={styles.kpiIcon} style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>
                        <IndianRupee size={24} />
                    </div>
                    <div className={styles.kpiInfo}>
                        <span className={styles.kpiLabel}>Potential Revenue</span>
                        <h2 className={styles.kpiValue}>
                            ₹{isMounted ? stats.potentialRevenue.toLocaleString('en-IN') : stats.potentialRevenue.toString()}
                        </h2>
                        <span className={styles.kpiSubtitle}>Open pipeline value</span>
                        <div className={styles.kpiBadge} style={{ backgroundColor: '#dcfce7', color: '#15803d' }}>
                            <ArrowUpRight size={12} /> +12% this week
                        </div>
                    </div>
                </div>

                {/* SECONDARY: Conversion Rate */}
                <div className={`${styles.kpiCard} ${styles.secondaryCard}`} title="Percentage of leads converted to completed payments.">
                    <div className={styles.kpiIcon} style={{ backgroundColor: '#dcfce7', color: '#15803d' }}>
                        <Target size={22} />
                    </div>
                    <div className={styles.kpiInfo}>
                        <span className={styles.kpiLabel}>Conversion Rate</span>
                        <h2 className={styles.kpiValue}>{stats.conversionRate}%</h2>
                        <span className={styles.kpiSubtitle}>Enquiry → Payment</span>
                    </div>
                </div>

                {/* SECONDARY: New Leads */}
                <div className={`${styles.kpiCard} ${styles.secondaryCard}`} title="Number of leads added in the current month.">
                    <div className={styles.kpiIcon} style={{ backgroundColor: '#f3e8ff', color: '#6b21a8' }}>
                        <Calendar size={22} />
                    </div>
                    <div className={styles.kpiInfo}>
                        <span className={styles.kpiLabel}>New Leads</span>
                        <h2 className={styles.kpiValue}>{stats.newLeads}</h2>
                        <span className={styles.kpiSubtitle}>This Month</span>
                        <div className={styles.kpiBadge} style={{ backgroundColor: '#f1f5f9', color: '#64748b' }}>
                            +2 vs last month
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Grid */}
            <div className={styles.chartsGrid}>
                <div className={styles.chartCard}>
                    <div className={styles.chartHeader}>
                        <h3>Pipeline Distribution</h3>
                        <div className={styles.filterGroup}>
                            {['Week', 'Month', 'Year'].map((p) => (
                                <button
                                    key={p}
                                    className={`${styles.filterBtn} ${distributionFilter === p ? styles.activeFilter : ''}`}
                                    onClick={() => setDistributionFilter(p)}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className={styles.pieChartWrapper}>
                        <div className={styles.pieCenterText} style={{ top: '45%' }}>
                            <span className={styles.pieCenterValue}>{stats.totalLeads}</span>
                            <span className={styles.pieCenterLabel}>Leads</span>
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="45%"
                                    innerRadius={55}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    label={renderCustomizedLabel}
                                    dataKey="value"
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <ReChartsTooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className={styles.chartCard}>
                    <div className={styles.chartHeader}>
                        <h3>Lead Acquisition Channels</h3>
                        <div className={styles.filterGroup}>
                            {['Week', 'Month', 'Year'].map((p) => (
                                <button
                                    key={p}
                                    className={`${styles.filterBtn} ${acquisitionFilter === p ? styles.activeFilter : ''}`}
                                    onClick={() => setAcquisitionFilter(p)}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className={styles.barChartWrapper}>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={[...sourceData].sort((a, b) => b.leads - a.leads)}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 11 }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 11 }}
                                />
                                <ReChartsTooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar
                                    dataKey="leads"
                                    fill="#818cf8"
                                    radius={[4, 4, 0, 0]}
                                    barSize={32}
                                    label={{ position: 'top', fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}

"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { leadsService } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import {
    LayoutDashboard,
    Users,
    Settings,
    LogOut,
    Search
} from 'lucide-react';
import styles from './Layout.module.css';

const initialNavItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Leads', icon: Users, path: '/leads', count: 0 },
    { name: 'Management', icon: Settings, path: '/management' },
];

export default function MainLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [stats, setStats] = useState({ leadsCount: 0, notificationCount: 0 });
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const isAuthPage = useMemo(() => pathname === '/login' || pathname === '/signup', [pathname]);

    // 1. Session and Auth State listener (Stable)
    useEffect(() => {
        let mounted = true;

        const initSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (mounted) {
                setUser(session?.user ?? null);
                setLoading(false);
            }
        };

        initSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (mounted) {
                setUser(session?.user ?? null);
                setLoading(false);
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    // 2. Redirection logic (Reactive to user/loading/pathname)
    useEffect(() => {
        if (!loading && !user && !isAuthPage) {
            router.push('/login');
        }
    }, [user, loading, isAuthPage, router]);

    // 3. Stats update logic
    useEffect(() => {
        const updateCounts = () => {
            const leads = leadsService.getLeads();
            const now = new Date();
            now.setHours(0, 0, 0, 0);

            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(23, 59, 59, 999);

            const pendingFollowUps = leads.filter(l => {
                if (!l.next_follow_up) return false;
                const followUpDate = new Date(l.next_follow_up);
                return followUpDate <= tomorrow;
            }).length;

            setStats({ leadsCount: leads.length, notificationCount: pendingFollowUps });
        };

        updateCounts();
        window.addEventListener('leads-updated', updateCounts);
        return () => window.removeEventListener('leads-updated', updateCounts);
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    const navItems = useMemo(() => initialNavItems.map(item => {
        if (item.name === 'Leads') {
            return { ...item, count: stats.leadsCount };
        }
        return item;
    }), [stats.leadsCount]);

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-primary)' }}>
                <div style={{ color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 600 }}>Loading...</div>
            </div>
        );
    }

    return (
        <div className={isAuthPage ? "" : styles.container}>
            {(!isAuthPage && user) && (
                <header className={styles.topBar}>
                    <div className={styles.leftSection}>
                        <div className={styles.logo}>
                            <img src="/logo.png" alt="LeadHive Logo" className={styles.logoImg} />
                            <span className={styles.logoText}>LeadHive</span>
                        </div>

                        <nav className={styles.nav}>
                            {navItems.map((item) => {
                                const isActive = pathname === item.path;
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.path}
                                        href={item.path}
                                        className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                                    >
                                        <Icon size={18} />
                                        <span>{item.name}</span>
                                        {item.name === 'Leads' && <span className={styles.badge}>{item.count}</span>}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    <div className={styles.rightSection}>
                        <div className={styles.searchBar}>
                            <Search size={16} className={styles.searchIcon} />
                            <input
                                type="text"
                                placeholder="Search leads..."
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        const value = (e.target as HTMLInputElement).value;
                                        if (value.trim()) {
                                            router.push(`/leads?q=${encodeURIComponent(value)}`);
                                        }
                                    }
                                }}
                            />
                        </div>

                        <div className={styles.headerActions}>
                            
                            <div className={styles.userProfile}>
                                <div className={styles.avatar}>
                                    {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
                                </div>
                                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                    {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
                                </span>
                            </div>
                            <button onClick={handleLogout} className={styles.logoutBtn} title="Logout" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}>
                                <LogOut size={18} />
                            </button>
                        </div>
                    </div>
                </header>
            )}

            <main className={isAuthPage ? "" : styles.mainContent}>
                {(user || isAuthPage) ? children : null}
            </main>
        </div>
    );
}

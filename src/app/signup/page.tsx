"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '../login/Auth.module.css'; // Reuse Auth styles
import { supabase } from '@/lib/supabase';

export default function SignUpPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const router = useRouter();

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);
        setSuccessMsg(null);

        if (password !== confirmPassword) {
            setErrorMsg('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: name,
                    }
                }
            });

            if (error) {
                setErrorMsg(error.message);
            } else if (data.user && data.session === null) {
                setSuccessMsg('Please check your email to confirm your account.');
            } else {
                router.push('/dashboard');
            }
        } catch (err: any) {
            setErrorMsg(err.message || 'An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.authCard}>
                <div className={styles.logo}>
                    <img src="/logo.png" alt="LeadHive Logo" className={styles.logoIcon} style={{ background: 'transparent', width: '64px', height: '64px' }} />
                    <span style={{ fontSize: '2rem' }}>LeadHive</span>
                </div>
                <h1>Create Account</h1>
                <p>Sign up to start managing your leads.</p>
                <form onSubmit={handleSignUp} className={styles.form}>
                    {errorMsg && <div className={styles.errorAlert}>{errorMsg}</div>}
                    {successMsg && <div style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.875rem', textAlign: 'center' }}>{successMsg}</div>}
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Name</label>
                        <input
                            type="text"
                            name="name"
                            required
                            className={styles.input}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your full name"
                            disabled={loading}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Email</label>
                        <input
                            type="email"
                            name="email"
                            required
                            className={styles.input}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@company.com"
                            disabled={loading}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Password</label>
                        <input
                            type="password"
                            name="password"
                            required
                            className={styles.input}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            disabled={loading}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Confirm Password</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            required
                            className={styles.input}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            disabled={loading}
                        />
                    </div>
                    <button type="submit" className={styles.submitBtn} disabled={loading}>
                        {loading ? 'Creating Account...' : 'Sign Up'}
                    </button>
                </form>
                <div className={styles.footer}>
                    <p>
                        Already have an account?{' '}
                        <Link href="/login" className={styles.actionBtn}>Sign In</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

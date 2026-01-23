"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import LeadForm from '@/components/leads/LeadForm';
import styles from './NewLead.module.css';

import { leadsService } from '@/lib/storage';

export default function NewLeadPage() {
    const router = useRouter();

    const handleCreateLead = (data: any) => {
        leadsService.addLead(data);
        router.push('/leads');
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <button
                    onClick={() => router.push('/leads')}
                    className={styles.backBtn}
                >
                    <ArrowLeft size={18} />
                    <span>Back to Pipeline</span>
                </button>
                <div className={styles.titleSection}>
                    <h1 className={styles.title}>Create New Lead</h1>
                    <p className={styles.subtitle}>Enter the prospect's details to start the conversion process.</p>
                </div>
            </header>

            <main className={styles.main}>
                <div className={styles.card}>
                    <LeadForm onSubmit={handleCreateLead} />
                </div>
            </main>
        </div>
    );
}

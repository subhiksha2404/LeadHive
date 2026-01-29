"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import LeadForm from '@/components/leads/LeadForm';
import { leadsService } from '@/lib/storage';
import styles from '../../new/NewLead.module.css'; // Reusing the same professional styles

export default function EditLeadPage() {
    const router = useRouter();
    const params = useParams();
    const [lead, setLead] = useState<any>(null);

    useEffect(() => {
        if (params.id) {
            const data = leadsService.getLeadById(params.id as string);
            if (data) {
                setLead(data);
            } else {
                // If lead not found, maybe redirect or show error
                console.error("Lead not found");
                // Optional: router.push('/leads');
            }
        }
    }, [params.id]);

    const handleUpdateLead = (data: any) => {
        if (params.id) {
            leadsService.updateLead(params.id as string, data);
            router.push('/leads');
        }
    };

    if (!lead) return <div className={styles.container}><p>Loading lead details...</p></div>;

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
                    <h1 className={styles.title}>Edit Lead: {lead.name}</h1>
                    <p className={styles.subtitle}>Update the prospect&apos;s details and track their progress in the pipeline.</p>
                </div>
            </header>

            <main className={styles.main}>
                <div className={styles.card}>
                    <LeadForm
                        initialData={lead}
                        onSubmit={handleUpdateLead}
                    />
                </div>
            </main>
        </div>
    );
}

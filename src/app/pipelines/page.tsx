"use client";

import { useState, useEffect } from 'react';
import {
    Plus,
    Layers,
    Edit2,
    Trash2,
    GripVertical,
    X
} from 'lucide-react';
import { leadsService, Pipeline, Stage } from '@/lib/storage';
import styles from './Pipelines.module.css';

export default function PipelinesPage() {
    const [pipelines, setPipelines] = useState<Pipeline[]>([]);
    const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null);
    const [stages, setStages] = useState<Stage[]>([]);

    // Modal states
    const [isPipelineModalOpen, setIsPipelineModalOpen] = useState(false);
    const [isStageModalOpen, setIsStageModalOpen] = useState(false);
    const [editingPipeline, setEditingPipeline] = useState<Pipeline | null>(null);
    const [editingStage, setEditingStage] = useState<Stage | null>(null);

    // Form states
    const [pipelineName, setPipelineName] = useState('');
    const [stageName, setStageName] = useState('');
    const [stageColor, setStageColor] = useState('#6366f1');

    const fetchPipelines = async () => {
        const data = await leadsService.getPipelines();
        setPipelines(data);
        if (data.length > 0) {
            if (!selectedPipeline) {
                setSelectedPipeline(data[0]);
                fetchStages(data[0].id);
            } else {
                // Refresh stages for current pipeline
                fetchStages(selectedPipeline.id);
            }
        }
    };

    const fetchStages = async (pipelineId: string) => {
        const data = await leadsService.getStages(pipelineId);
        setStages(data);
    };

    useEffect(() => {
        fetchPipelines();
    }, []);

    const handleCreatePipeline = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editingPipeline) {
            await leadsService.updatePipeline(editingPipeline.id, pipelineName);
        } else {
            const newP = await leadsService.createPipeline(pipelineName);
            if (newP && pipelines.length === 0) {
                setSelectedPipeline(newP);
                await fetchStages(newP.id);
            }
        }
        setPipelineName('');
        setEditingPipeline(null);
        setIsPipelineModalOpen(false);
        await fetchPipelines();
    };

    const handleDeletePipeline = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this pipeline? All stages and data associated will be lost.')) {
            await leadsService.deletePipeline(id);
            if (selectedPipeline?.id === id) {
                setSelectedPipeline(null);
                setStages([]);
            }
            await fetchPipelines();
        }
    };

    const handleCreateStage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPipeline) return;

        if (editingStage) {
            await leadsService.updateStage(editingStage.id, {
                name: stageName,
                color: stageColor
            });
        } else {
            await leadsService.createStage({
                pipeline_id: selectedPipeline.id,
                name: stageName,
                color: stageColor,
                order: stages.length + 1
            });
        }
        setStageName('');
        setStageColor('#6366f1');
        setEditingStage(null);
        setIsStageModalOpen(false);
        await fetchStages(selectedPipeline.id);
    };

    const handleDeleteStage = async (id: string) => {
        if (confirm('Are you sure you want to delete this stage?')) {
            await leadsService.deleteStage(id);
            if (selectedPipeline) await fetchStages(selectedPipeline.id);
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>Pipelines</h1>
                    <p className={styles.subtitle}>Configure multiple sales processes and custom stages.</p>
                </div>
                <button
                    className={styles.addBtn}
                    onClick={() => {
                        setEditingPipeline(null);
                        setPipelineName('');
                        setIsPipelineModalOpen(true);
                    }}
                >
                    <Plus size={20} />
                    <span>Create Pipeline</span>
                </button>
            </header>

            <div className={styles.content}>
                <aside className={styles.sidebar}>
                    <h2 className={styles.sidebarTitle}>All Pipelines</h2>
                    <div className={styles.pipelineList}>
                        {pipelines.length === 0 ? (
                            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>No pipelines created yet.</p>
                        ) : (
                            pipelines.map(p => (
                                <div
                                    key={p.id}
                                    className={`${styles.pipelineItem} ${selectedPipeline?.id === p.id ? styles.activePipeline : ''}`}
                                    onClick={() => {
                                        setSelectedPipeline(p);
                                        fetchStages(p.id);
                                    }}
                                >
                                    <span>{p.name}</span>
                                    <div className={styles.stageActions}>
                                        <button
                                            className={styles.iconBtn}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingPipeline(p);
                                                setPipelineName(p.name);
                                                setIsPipelineModalOpen(true);
                                            }}
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                        <button
                                            className={`${styles.iconBtn} ${styles.deleteBtn}`}
                                            onClick={(e) => handleDeletePipeline(p.id, e)}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </aside>

                <main className={styles.mainPanel}>
                    {selectedPipeline ? (
                        <>
                            <div className={styles.panelHeader}>
                                <h2 className={styles.panelTitle}>{selectedPipeline.name} Stages</h2>
                                <button
                                    className={styles.addBtn}
                                    onClick={() => {
                                        setEditingStage(null);
                                        setStageName('');
                                        setStageColor('#6366f1');
                                        setIsStageModalOpen(true);
                                    }}
                                >
                                    <Plus size={18} />
                                    <span>Add Stage</span>
                                </button>
                            </div>

                            <div className={styles.stagesList}>
                                {stages.length === 0 ? (
                                    <div className={styles.emptyState}>
                                        <Layers size={48} strokeWidth={1} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                                        <p>No stages defined for this pipeline.</p>
                                    </div>
                                ) : (
                                    stages.map((stage) => (
                                        <div key={stage.id} className={styles.stageCard}>
                                            <GripVertical size={20} className={styles.stageDragHandle} />
                                            <div
                                                className={styles.stageColor}
                                                style={{ backgroundColor: stage.color }}
                                            />
                                            <div className={styles.stageInfo}>
                                                <div className={styles.stageName}>{stage.name}</div>
                                            </div>
                                            <div className={styles.stageActions}>
                                                <button
                                                    className={styles.iconBtn}
                                                    onClick={() => {
                                                        setEditingStage(stage);
                                                        setStageName(stage.name);
                                                        setStageColor(stage.color);
                                                        setIsStageModalOpen(true);
                                                    }}
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    className={`${styles.iconBtn} ${styles.deleteBtn}`}
                                                    onClick={() => handleDeleteStage(stage.id)}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </>
                    ) : (
                        <div className={styles.emptyState}>
                            <Layers size={64} strokeWidth={1} style={{ marginBottom: '1.5rem', opacity: 0.3 }} />
                            <h3>Select a Pipeline</h3>
                            <p>Choose a pipeline from the sidebar to manage its stages.</p>
                        </div>
                    )}
                </main>
            </div>

            {/* Pipeline Modal */}
            {isPipelineModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <h3>{editingPipeline ? 'Edit Pipeline' : 'Create New Pipeline'}</h3>
                            <button className={styles.iconBtn} onClick={() => setIsPipelineModalOpen(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleCreatePipeline}>
                            <div className={styles.modalBody}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Pipeline Name</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={pipelineName}
                                        onChange={(e) => setPipelineName(e.target.value)}
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <div className={styles.modalFooter}>
                                <button type="button" className={styles.secondaryBtn} onClick={() => setIsPipelineModalOpen(false)}>Cancel</button>
                                <button type="submit" className={styles.primaryBtn}>{editingPipeline ? 'Save Changes' : 'Create Pipeline'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Stage Modal */}
            {isStageModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <h3>{editingStage ? 'Edit Stage' : 'Add New Stage'}</h3>
                            <button className={styles.iconBtn} onClick={() => setIsStageModalOpen(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleCreateStage}>
                            <div className={styles.modalBody}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Stage Name</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={stageName}
                                        onChange={(e) => setStageName(e.target.value)}
                                        required
                                        autoFocus
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Stage Color</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <input
                                            type="color"
                                            value={stageColor}
                                            onChange={(e) => setStageColor(e.target.value)}
                                            style={{ width: '50px', height: '50px', padding: '0', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                                        />
                                        <span>{stageColor}</span>
                                    </div>
                                </div>
                            </div>
                            <div className={styles.modalFooter}>
                                <button type="button" className={styles.secondaryBtn} onClick={() => setIsStageModalOpen(false)}>Cancel</button>
                                <button type="submit" className={styles.primaryBtn}>{editingStage ? 'Save Changes' : 'Add Stage'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

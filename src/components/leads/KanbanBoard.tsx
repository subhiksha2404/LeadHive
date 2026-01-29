"use client";

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import {
    DndContext,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    useDroppable,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Eye, Edit2, IndianRupee } from 'lucide-react';
import styles from './Kanban.module.css';


import { Lead, Stage } from '@/types/lead';

function SortableItem({ lead, onPreview }: { lead: Lead, onPreview: (lead: Lead) => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: lead.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={styles.card}
            {...attributes}
            {...listeners}
            onClick={() => onPreview(lead)}
        >
            <div className={`${styles.cardIndicator} ${styles['prio' + lead.priority]}`} />

            <div className={styles.cardHeader}>
                <h4 className={styles.leadName}>{lead.name}</h4>
                <div className={styles.budgetRow}>
                    <IndianRupee size={10} /> <span>{(lead.budget || 0).toLocaleString('en-IN')}</span>
                </div>
            </div>

            <p className={styles.modelName}>{lead.interested_service || 'No interest specified'}</p>

            <div className={styles.cardFooter}>
                <span className={styles.assignedUser}>{lead.assigned_to}</span>
                <button
                    className={styles.viewBtn}
                    onClick={(e) => {
                        e.stopPropagation();
                        onPreview(lead);
                    }}
                    title="View Details"
                >
                    <Eye size={14} />
                </button>
                <Link
                    href={`/leads/edit/${lead.id}`}
                    className={styles.editBtn}
                    onClick={(e) => e.stopPropagation()}
                    title="Edit Lead"
                >
                    <Edit2 size={14} />
                </Link>
            </div>
        </div>
    );
}

function KanbanColumn({ id, title, color, children }: { id: string, title: string, color: string, children: React.ReactNode }) {
    const { setNodeRef, isOver } = useDroppable({
        id: id,
    });

    return (
        <div
            ref={setNodeRef}
            className={`${styles.column} ${isOver ? styles.columnOver : ''}`}
        >
            <div className={styles.columnHeader} style={{ borderTop: `3px solid ${color}` }}>
                <div className={styles.columnTitle}>
                    {title} - <span className={styles.itemCount}>{React.Children.count(children)}</span>
                </div>
            </div>
            <div className={styles.columnList}>
                {children}
            </div>
        </div>
    );
}

export default function KanbanBoard({ leads, stages, onLeadMove, onPreview }: {
    leads: Lead[],
    stages: Stage[],
    onLeadMove: (id: string, newStatus: string, stageId?: string) => void,
    onPreview: (lead: Lead) => void
}) {
    const [activeId, setActiveId] = useState<string | null>(null);
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const getLeadsByStage = (stageId: string) => leads.filter(l => l.stage_id === stageId);

    // For legacy/backward compatibility or if stage_id is missing, fallback to status name matching
    const getLeadsByStatus = (statusName: string) => leads.filter(l => l.status === statusName);

    const handleDragStart = (event: any) => {
        setActiveId(event.active.id);
    };

    const handleDragOver = (event: any) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        const activeLead = leads.find(l => l.id === activeId);
        if (!activeLead) return;

        let targetStageId = '';
        let targetStatus = '';

        const column = stages.find(s => s.id === overId);
        if (column) {
            targetStageId = column.id;
            targetStatus = column.name;
        } else {
            const overLead = leads.find(l => l.id === overId);
            if (overLead) {
                targetStageId = overLead.stage_id || '';
                targetStatus = overLead.status;
            }
        }

        if (targetStageId && activeLead.stage_id !== targetStageId) {
            onLeadMove(activeId, targetStatus, targetStageId);
        }
    };

    const handleDragEnd = (event: any) => {
        const { active, over } = event;
        setActiveId(null);
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        const activeLead = leads.find(l => l.id === activeId);
        if (!activeLead) return;

        let targetStageId = '';
        let targetStatus = '';

        const column = stages.find(s => s.id === overId);
        if (column) {
            targetStageId = column.id;
            targetStatus = column.name;
        } else {
            const overLead = leads.find(l => l.id === overId);
            if (overLead) {
                targetStageId = overLead.stage_id || '';
                targetStatus = overLead.status;
            }
        }

        if (targetStageId && activeLead.stage_id !== targetStageId) {
            onLeadMove(activeId, targetStatus, targetStageId);
        }
    };

    const activeLead = activeId ? leads.find(l => l.id === activeId) : null;

    return (
        <div className={styles.board}>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                {stages.map(stage => {
                    const stageLeads = getLeadsByStage(stage.id);
                    // Fallback to name matching if no leads by ID (helpful for migrating from hardcoded stages)
                    const displayLeads = stageLeads.length > 0 ? stageLeads : getLeadsByStatus(stage.name);

                    return (
                        <KanbanColumn key={stage.id} id={stage.id} title={stage.name} color={stage.color}>
                            <SortableContext
                                items={displayLeads.map(l => l.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                {displayLeads.map(lead => (
                                    <SortableItem key={lead.id} lead={lead} onPreview={onPreview} />
                                ))}
                            </SortableContext>
                        </KanbanColumn>
                    );
                })}

                <DragOverlay>
                    {activeLead ? (
                        <div className={`${styles.card} ${styles.dragging}`}>
                            <div className={`${styles.cardIndicator} ${styles['prio' + activeLead.priority]}`} />
                            <div className={styles.cardHeader}>
                                <h4 className={styles.leadName}>{activeLead.name}</h4>
                                <div className={styles.budgetRow}>
                                    <IndianRupee size={10} /> <span>{(activeLead.budget || 0).toLocaleString('en-IN')}</span>
                                </div>
                            </div>
                            <p className={styles.modelName}>{activeLead.interested_service || 'No interest specified'}</p>
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
}

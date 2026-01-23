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

interface Lead {
    id: string;
    name: string;
    interested_service: string;
    priority: string;
    budget: number;
    assigned_to: string;
    source: string;
    email: string;
    phone: string;
    status: string;
}

const COLUMNS = [
    { id: 'Enquiry', title: 'Enquiry', color: '#3b82f6' },
    { id: 'Contacted', title: 'Contacted', color: '#f59e0b' },
    { id: 'Call not answered', title: 'Call not answered', color: '#ef4444' },
    { id: 'Quotation Sent', title: 'Quotation Sent', color: '#a855f7' },
    { id: 'Payment Done', title: 'Payment Done', color: '#22c55e' },
];

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
                    <IndianRupee size={10} /> <span>{lead.budget.toLocaleString('en-IN')}</span>
                </div>
            </div>

            <p className={styles.modelName}>{lead.interested_service}</p>

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

export default function KanbanBoard({ leads, onLeadMove, onPreview }: {
    leads: Lead[],
    onLeadMove: (id: string, newStatus: string) => void,
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

    const getLeadsByStatus = (status: string) => leads.filter(l => l.status === status);

    const handleDragStart = (event: any) => {
        setActiveId(event.active.id);
    };

    const handleDragOver = (event: any) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        // Find the active lead
        const activeLead = leads.find(l => l.id === activeId);
        if (!activeLead) return;

        // Identify where we are dropping
        let newStatus = '';

        // Is it a column?
        const column = COLUMNS.find(col => col.id === overId);
        if (column) {
            newStatus = column.id;
        } else {
            // Is it another card?
            const overLead = leads.find(l => l.id === overId);
            if (overLead) {
                newStatus = overLead.status;
            }
        }

        if (newStatus && activeLead.status !== newStatus) {
            onLeadMove(activeId, newStatus);
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

        let newStatus = '';
        const column = COLUMNS.find(col => col.id === overId);
        if (column) {
            newStatus = column.id;
        } else {
            const overLead = leads.find(l => l.id === overId);
            if (overLead) {
                newStatus = overLead.status;
            }
        }

        if (newStatus && activeLead.status !== newStatus) {
            onLeadMove(activeId, newStatus);
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
                {COLUMNS.map(col => (
                    <KanbanColumn key={col.id} id={col.id} title={col.title} color={col.color}>
                        <SortableContext
                            items={getLeadsByStatus(col.id).map(l => l.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            {getLeadsByStatus(col.id).map(lead => (
                                <SortableItem key={lead.id} lead={lead} onPreview={onPreview} />
                            ))}
                        </SortableContext>
                    </KanbanColumn>
                ))}

                <DragOverlay>
                    {activeLead ? (
                        <div className={`${styles.card} ${styles.dragging}`}>
                            <div className={`${styles.cardIndicator} ${styles['prio' + activeLead.priority]}`} />
                            <div className={styles.cardHeader}>
                                <h4 className={styles.leadName}>{activeLead.name}</h4>
                                <div className={styles.budgetRow}>
                                    <IndianRupee size={10} /> <span>{activeLead.budget.toLocaleString('en-IN')}</span>
                                </div>
                            </div>
                            <p className={styles.modelName}>{activeLead.interested_service}</p>
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
}

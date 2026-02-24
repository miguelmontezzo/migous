import { useState } from 'react';
import { CheckCircle2, XCircle, Pencil, Trash2, Timer } from 'lucide-react';
import PomodoroTimer from './PomodoroTimer';
import './TaskCard.css';

interface TaskCardProps {
    id: string;
    title: string;
    type: string;
    difficulty: string;
    habitType?: 'positive' | 'negative';
    onComplete: () => void;
    onFail?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    isPomodoro?: boolean;
    pomodoroTime?: number;
    executionCount?: number;
}

const typeMap: Record<string, string> = {
    daily: 'Diária',
    habit: 'Hábito',
    todo: 'Afazer'
};

const diffColors: Record<string, string> = {
    easy: 'var(--xp-color)', // iOS Green
    medium: 'var(--credits-color)', // iOS Orange
    hard: 'var(--hp-color)', // iOS Red
    epic: 'var(--secondary)' // iOS Indigo
};

export default function TaskCard({ title, type, difficulty, habitType, onComplete, onFail, onEdit, onDelete, isPomodoro, pomodoroTime, executionCount = 0 }: TaskCardProps) {
    const [isPomodoroActive, setIsPomodoroActive] = useState(false);
    const [swipeOffset, setSwipeOffset] = useState(0);
    const [isRevealed, setIsRevealed] = useState(false);
    const [startX, setStartX] = useState<number | null>(null);

    const handleCompleteClick = () => {
        if (type === 'daily' && isPomodoro) {
            setIsPomodoroActive(true);
        } else {
            onComplete();
        }
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        setStartX(e.touches[0].clientX);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (startX === null) return;
        const currentX = e.touches[0].clientX;
        const diff = currentX - startX;

        // Only allow swiping left, up to -120px to show buttons
        if (diff < 0) {
            setSwipeOffset(Math.max(-120, diff));
        } else if (isRevealed && diff > 0) {
            // closing the swipe
            setSwipeOffset(Math.min(0, -120 + diff));
        }
    };

    const handleTouchEnd = () => {
        if (swipeOffset < -50) {
            setSwipeOffset(-120);
            setIsRevealed(true);
        } else {
            setSwipeOffset(0);
            setIsRevealed(false);
        }
        setStartX(null);
    };

    const closeReveal = () => {
        setSwipeOffset(0);
        setIsRevealed(false);
    };

    return (
        <div className="task-card-wrapper" style={{ position: 'relative', overflow: 'hidden', marginBottom: '12px', borderRadius: 'var(--radius-md)' }}>

            {/* The Actions Drawer underneath */}
            <div className="task-card-drawer" style={{
                position: 'absolute', right: 0, top: 0, bottom: 0, width: '120px',
                display: 'flex', zIndex: 0
            }}>
                {onEdit && (
                    <button
                        className="drawer-btn edit"
                        onClick={() => { onEdit(); closeReveal(); }}
                    >
                        <Pencil size={20} />
                    </button>
                )}
                {onDelete && (
                    <button
                        className="drawer-btn delete"
                        onClick={() => { onDelete(); closeReveal(); }}
                    >
                        <Trash2 size={20} />
                    </button>
                )}
            </div>

            {/* The Main Card on top, sliding */}
            <div
                className="task-card"
                style={{
                    flexDirection: 'column',
                    transform: `translateX(${swipeOffset}px)`,
                    transition: startX === null ? 'transform 0.2s ease-out' : 'none',
                    margin: 0,
                    zIndex: 1,
                    position: 'relative'
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >

                <div style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div className="task-info">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h4 className="task-title">{title}</h4>
                            {executionCount > 0 && (
                                <span style={{
                                    background: 'var(--credits-color)',
                                    color: '#1C1C1E',
                                    fontSize: '0.65rem',
                                    padding: '2px 6px',
                                    borderRadius: '12px',
                                    fontWeight: 700
                                }}>
                                    {executionCount}x hoje
                                </span>
                            )}
                        </div>
                        <div className="task-meta">
                            <span className="task-type">{typeMap[type] || type}</span>
                            <span className="task-difficulty" style={{ color: diffColors[difficulty] }}>
                                • {difficulty.toUpperCase()}
                            </span>
                            {type === 'habit' && habitType && (
                                <span style={{ marginLeft: '8px', fontSize: '0.75rem', opacity: 0.8 }}>
                                    ({habitType === 'positive' ? 'POSITIVO' : 'NEGATIVO'})
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="task-actions" style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '40px' }}>
                        {type === 'habit' ? (
                            habitType === 'negative' ? (
                                <button className="btn-action fail" onClick={onFail}>
                                    <XCircle size={28} />
                                </button>
                            ) : (
                                <button className="btn-action complete" onClick={handleCompleteClick}>
                                    <CheckCircle2 size={28} />
                                </button>
                            )
                        ) : (
                            <button className="btn-action complete" onClick={handleCompleteClick} style={{ alignSelf: 'flex-end' }}>
                                {type === 'daily' && isPomodoro ? <Timer size={28} /> : <CheckCircle2 size={28} />}
                            </button>
                        )}
                    </div>
                </div>

                {isPomodoroActive && (
                    <div style={{ width: '100%', marginTop: '12px' }}>
                        <PomodoroTimer
                            initialMinutes={pomodoroTime || 25}
                            onComplete={() => {
                                setIsPomodoroActive(false);
                                onComplete();
                            }}
                            onCancel={() => setIsPomodoroActive(false)}
                        />
                    </div>
                )}

            </div>
        </div>
    );
}

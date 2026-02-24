import { useState } from 'react';
import { useStore } from '../store/useStore';
import { CheckSquare, ShieldAlert } from 'lucide-react';
import './DailyCheckinModal.css';

export default function DailyCheckinModal() {
    const { pendingDailiesToReview, resolvePendingDailies } = useStore();
    const [completedIds, setCompletedIds] = useState<string[]>([]);

    if (pendingDailiesToReview.length === 0) return null;

    const toggleCheck = (id: string) => {
        setCompletedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleConfirm = () => {
        resolvePendingDailies(completedIds);
    };

    return (
        <div className="modal-overlay">
            <div className="checkin-modal">
                <div className="modal-header">
                    <ShieldAlert size={32} className="warning-icon" />
                    <h2>Revisão Diária</h2>
                    <p>Você tem rotinas pendentes do ciclo anterior. Marque as que você concluiu para evitar receber dano.</p>
                </div>

                <div className="pending-list">
                    {pendingDailiesToReview.map(routine => (
                        <div
                            key={routine.id}
                            className={`pending-item ${completedIds.includes(routine.id) ? 'checked' : ''}`}
                            onClick={() => toggleCheck(routine.id)}
                        >
                            <div className="checkbox">
                                {completedIds.includes(routine.id) && <CheckSquare size={18} />}
                            </div>
                            <span className="routine-title">{routine.title}</span>
                            <span className="routine-diff">{routine.difficulty.toUpperCase()}</span>
                        </div>
                    ))}
                </div>

                <div className="modal-footer">
                    <button className="confirm-btn" onClick={handleConfirm}>
                        Confirmar e Iniciar Novo Dia
                    </button>
                </div>
            </div>
        </div>
    );
}

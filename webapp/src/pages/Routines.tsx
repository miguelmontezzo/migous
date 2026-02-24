import { useState } from 'react';
import { useStore, type Routine } from '../store/useStore';
import TaskCard from '../components/TaskCard';
import './Routines.css';

const DAYS_OF_WEEK = [
    { value: 0, label: 'Dom' },
    { value: 1, label: 'Seg' },
    { value: 2, label: 'Ter' },
    { value: 3, label: 'Qua' },
    { value: 4, label: 'Qui' },
    { value: 5, label: 'Sex' },
    { value: 6, label: 'Sáb' }
];

export default function Routines() {
    const { routines, isLoading, todayCompletions, addRoutine, editRoutine, deleteRoutine, completeRoutine, failRoutine } = useStore();
    const [isAdding, setIsAdding] = useState(false);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [newRoutine, setNewRoutine] = useState<Partial<Routine>>({
        title: '',
        type: 'daily',
        difficulty: 'medium',
        habitType: 'positive',
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        isPomodoro: false,
        pomodoroTime: 25
    });

    const handleAdd = () => {
        if (!newRoutine.title) return;
        if (editingId) {
            editRoutine(editingId, newRoutine);
            setEditingId(null);
        } else {
            addRoutine(newRoutine as Omit<Routine, 'id'>);
        }
        setIsAdding(false);
        setNewRoutine({ title: '', type: 'daily', difficulty: 'medium', habitType: 'positive', daysOfWeek: [0, 1, 2, 3, 4, 5, 6], isPomodoro: false, pomodoroTime: 25 });
    };

    const handleEdit = (routine: Routine) => {
        setNewRoutine({
            title: routine.title,
            type: routine.type,
            difficulty: routine.difficulty,
            habitType: routine.habitType || 'positive',
            daysOfWeek: routine.daysOfWeek || [0, 1, 2, 3, 4, 5, 6],
            isPomodoro: routine.isPomodoro || false,
            pomodoroTime: routine.pomodoroTime || 25
        });
        setEditingId(routine.id);
        setIsAdding(true);
    };

    const toggleDay = (day: number) => {
        const currentDays = newRoutine.daysOfWeek || [];
        if (currentDays.includes(day)) {
            setNewRoutine({ ...newRoutine, daysOfWeek: currentDays.filter(d => d !== day) });
        } else {
            setNewRoutine({ ...newRoutine, daysOfWeek: [...currentDays, day] });
        }
    };

    const dailies = routines.filter((r: Routine) => r.type === 'daily');
    const habits = routines.filter((r: Routine) => r.type === 'habit');
    const todos = routines.filter((r: Routine) => r.type === 'todo');

    return (
        <div className="routines-page">
            <div className="routines-header">
                <h2>Suas Rotinas</h2>
                <button className="btn-primary" onClick={() => {
                    setIsAdding(!isAdding);
                    if (isAdding) setEditingId(null);
                }}>
                    {isAdding ? 'Cancelar' : '+ Nova Rotina'}
                </button>
            </div>

            {isAdding && (
                <div className="add-routine-form">
                    <input
                        type="text"
                        placeholder="Nome da Tarefa"
                        value={newRoutine.title}
                        onChange={e => setNewRoutine({ ...newRoutine, title: e.target.value })}
                    />
                    <div className="form-row">
                        <select
                            value={newRoutine.type}
                            onChange={e => setNewRoutine({ ...newRoutine, type: e.target.value as any })}
                        >
                            <option value="daily">Diária</option>
                            <option value="habit">Hábito</option>
                            <option value="todo">Para Fazer</option>
                        </select>
                        <select
                            value={newRoutine.difficulty}
                            onChange={e => setNewRoutine({ ...newRoutine, difficulty: e.target.value as any })}
                        >
                            <option value="easy">Fácil</option>
                            <option value="medium">Médio</option>
                            <option value="hard">Difícil</option>
                            <option value="epic">Épico</option>
                        </select>
                    </div>

                    {newRoutine.type === 'habit' && (
                        <div className="form-row" style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                            <button
                                className={`type-button ${newRoutine.habitType === 'positive' ? 'active-positive' : ''}`}
                                onClick={() => setNewRoutine({ ...newRoutine, habitType: 'positive' })}
                                style={{
                                    flex: 1, padding: '10px', borderRadius: 'var(--radius-md)',
                                    border: newRoutine.habitType === 'positive' ? '2px solid var(--xp-color)' : '1px solid var(--border-color)',
                                    backgroundColor: newRoutine.habitType === 'positive' ? 'var(--xp-bg)' : 'transparent',
                                    color: newRoutine.habitType === 'positive' ? 'var(--xp-color)' : 'var(--text-muted)'
                                }}
                            >
                                Bom (XP/Ouro)
                            </button>
                            <button
                                className={`type-button ${newRoutine.habitType === 'negative' ? 'active-negative' : ''}`}
                                onClick={() => setNewRoutine({ ...newRoutine, habitType: 'negative' })}
                                style={{
                                    flex: 1, padding: '10px', borderRadius: 'var(--radius-md)',
                                    border: newRoutine.habitType === 'negative' ? '2px solid var(--hp-color)' : '1px solid var(--border-color)',
                                    backgroundColor: newRoutine.habitType === 'negative' ? 'var(--hp-bg)' : 'transparent',
                                    color: newRoutine.habitType === 'negative' ? 'var(--hp-color)' : 'var(--text-muted)'
                                }}
                            >
                                Ruim (Dano HP)
                            </button>
                        </div>
                    )}

                    {newRoutine.type === 'daily' && (
                        <div style={{ marginTop: '12px' }}>
                            <div className="days-selector" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                                {DAYS_OF_WEEK.map(day => {
                                    const isSelected = (newRoutine.daysOfWeek || []).includes(day.value);
                                    return (
                                        <button
                                            key={day.value}
                                            onClick={() => toggleDay(day.value)}
                                            style={{
                                                padding: '6px 12px',
                                                borderRadius: 'var(--radius-lg)',
                                                border: isSelected ? 'none' : '1px solid var(--border-color)',
                                                backgroundColor: isSelected ? 'var(--primary)' : 'transparent',
                                                color: isSelected ? 'var(--text-inverse)' : 'var(--text-muted)',
                                                fontWeight: isSelected ? '600' : 'normal',
                                                fontSize: '0.8rem'
                                            }}
                                        >
                                            {day.label}
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="form-row pomodoro-toggle" style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--card-bg)', padding: '12px', borderRadius: '12px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                                    <input
                                        type="checkbox"
                                        checked={newRoutine.isPomodoro}
                                        onChange={(e) => setNewRoutine({ ...newRoutine, isPomodoro: e.target.checked })}
                                    />
                                    Usar Pomodoro
                                </label>
                                {newRoutine.isPomodoro && (
                                    <input
                                        type="number"
                                        min="1"
                                        max="120"
                                        value={newRoutine.pomodoroTime}
                                        onChange={(e) => setNewRoutine({ ...newRoutine, pomodoroTime: parseInt(e.target.value) || 25 })}
                                        style={{ width: '80px', padding: '4px 8px' }}
                                    />
                                )}
                                {newRoutine.isPomodoro && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>min</span>}
                            </div>
                        </div>
                    )}

                    <button className="btn-primary full-width" onClick={handleAdd} style={{ marginTop: '16px' }}>{editingId ? 'Salvar Edição' : 'Criar Rotina'}</button>
                </div>
            )}

            <div className="routine-category">
                <h3>Dailies</h3>
                {isLoading && <p className="empty-text">Carregando...</p>}
                {!isLoading && dailies.length === 0 && <p className="empty-text">Nenhuma diária cadastrada.</p>}
                {!isLoading && dailies.map((r: Routine) => (
                    <TaskCard key={r.id} {...r} executionCount={todayCompletions[r.id] || 0} onComplete={() => completeRoutine(r.id)} onEdit={() => handleEdit(r)} onDelete={() => deleteRoutine(r.id)} />
                ))}
            </div>

            <div className="routine-category">
                <h3>Hábitos</h3>
                {habits.length === 0 && <p className="empty-text">Nenhum hábito cadastrado.</p>}
                {habits.map((r: Routine) => (
                    <TaskCard key={r.id} {...r} executionCount={todayCompletions[r.id] || 0} onComplete={() => completeRoutine(r.id)} onFail={() => failRoutine(r.id)} onEdit={() => handleEdit(r)} onDelete={() => deleteRoutine(r.id)} />
                ))}
            </div>

            <div className="routine-category">
                <h3>To-Dos</h3>
                {todos.length === 0 && <p className="empty-text">Nenhum afazer cadastrado.</p>}
                {todos.map((r: Routine) => (
                    <TaskCard key={r.id} {...r} onComplete={() => completeRoutine(r.id)} onEdit={() => handleEdit(r)} onDelete={() => deleteRoutine(r.id)} />
                ))}
            </div>
        </div>
    );
}

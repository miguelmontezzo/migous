import { useStore } from '../store/useStore';
import StatusBar from '../components/StatusBar';
import TaskCard from '../components/TaskCard';
import { Heart, Star, Coins } from 'lucide-react';

export default function Dashboard() {
    const { stats, routines, completeRoutine, failRoutine } = useStore();

    // Calculate level threshold based on formula in store
    const maxXp = Math.floor(100 * Math.pow(1.5, stats.level - 1));

    return (
        <div className="dashboard-page">
            <section className="character-stats" style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.2rem', marginBottom: '16px', color: 'var(--text-main)', fontWeight: 700, letterSpacing: '-0.3px' }}>Seu Personagem</h2>

                <StatusBar
                    label="HP (Saúde)"
                    icon={<Heart size={14} />}
                    value={stats.hp}
                    max={stats.maxHp}
                    color="var(--hp-color)"
                />

                <StatusBar
                    label={`EXP (Nível ${stats.level})`}
                    icon={<Star size={14} />}
                    value={stats.xp}
                    max={maxXp}
                    color="var(--xp-color)"
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', marginTop: '12px', border: '0.5px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Coins size={18} color="var(--credits-color)" />
                        <span style={{ fontWeight: 600, color: 'var(--credits-color)' }}>{stats.credits} Créditos</span>
                    </div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                        🔥 {stats.streak} dias
                    </div>
                </div>
            </section>

            <section className="today-routines">
                <h3 style={{ fontSize: '1.1rem', marginBottom: '12px', borderBottom: '0.5px solid var(--border-color)', paddingBottom: '8px', fontWeight: 600 }}>Pendente Hoje</h3>

                <div className="routines-list">
                    {routines.map(routine => (
                        <TaskCard
                            key={routine.id}
                            id={routine.id}
                            title={routine.title}
                            type={routine.type}
                            difficulty={routine.difficulty}
                            onComplete={() => completeRoutine(routine.id)}
                            onFail={routine.type === 'habit' ? () => failRoutine(routine.id) : undefined}
                        />
                    ))}
                    {routines.length === 0 && (
                        <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '0.5px solid var(--border-color)', margin: '12px 0' }}>
                            Tudo limpo! Descanse ou crie novas missões.
                        </p>
                    )}
                </div>
            </section>
        </div>
    );
}


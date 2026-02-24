import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { User, Flame, TrendingUp, MessageCircle, LogOut, Sun, Moon, Settings } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import './Profile.css';

export default function Profile() {
    const { stats } = useStore();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [remindersActive, setRemindersActive] = useState(false);
    const [reminderTime, setReminderTime] = useState('09:00');
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [theme, setTheme] = useState(document.documentElement.getAttribute('data-theme') || 'dark');

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('lifeforge-theme', newTheme);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.reload();
    };

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data, error } = await supabase
                    .from('users')
                    .select('phone_number, whatsapp_reminders_active, whatsapp_reminder_time')
                    .eq('id', user.id)
                    .single();

                if (error && error.code !== 'PGRST116') {
                    console.error('Erro ao buscar dados do usuário:', error);
                }

                if (data) {
                    setPhoneNumber(data.phone_number || '');
                    setRemindersActive(data.whatsapp_reminders_active || false);
                    setReminderTime(data.whatsapp_reminder_time || '09:00');
                }
            } catch (err) {
                console.error(err);
            } finally {
                setFetching(false);
            }
        };

        fetchUserData();
    }, []);

    const handleSaveSettings = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Usuário não autenticado');

            // Save to database
            const { error } = await supabase
                .from('users')
                .update({
                    phone_number: phoneNumber,
                    whatsapp_reminders_active: remindersActive,
                    whatsapp_reminder_time: reminderTime
                })
                .eq('id', user.id);

            if (error) throw error;

            toast.success('Configurações salvas!');

            if (remindersActive && phoneNumber) {
                // Call edge function to trigger motivation message using Evolution API
                const { error: fnError } = await supabase.functions.invoke('send-whatsapp-reminder', {
                    body: { userId: user.id }
                });

                if (fnError) {
                    console.error('Falha ao enviar mensagem de ativação:', fnError);
                    toast.error('Configuração salva, mas falha ao enviar o lembrete teste.');
                } else {
                    toast.success('Mensagem de confirmação enviada no WhatsApp!');
                }
            }
        } catch (err: any) {
            toast.error(err.message || 'Erro ao salvar configurações');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="profile-page">
            <div className="profile-header">
                <div className="avatar-circle">
                    <User size={64} color="var(--primary)" />
                </div>
                <h2>Seu Avatar</h2>
                <p className="level-text">Nível {stats.level}</p>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <Flame size={24} className="stat-icon streak" />
                    <div className="stat-info">
                        <span className="stat-value">{stats.streak}</span>
                        <span className="stat-label">Dias de Fogo</span>
                    </div>
                </div>

                <div className="stat-card">
                    <TrendingUp size={24} className="stat-icon" style={{ color: 'var(--xp-color)' }} />
                    <div className="stat-info">
                        <span className="stat-value">{stats.xp}</span>
                        <span className="stat-label">EXP Total (Nível Atual)</span>
                    </div>
                </div>
            </div>

            <div className="achievements-section">
                <h3>Conquistas Recentes</h3>
                <p style={{ color: 'var(--text-muted)' }}>Mantenha sua streak e conclua dailies para ganhar medalhas.</p>

                <div className="achievements-grid">
                    <div className="achievement-badge locked"></div>
                    <div className="achievement-badge locked"></div>
                    <div className="achievement-badge locked"></div>
                </div>
            </div>

            <div className="settings-section">
                <h3><MessageCircle size={20} color="#22c55e" /> Lembretes do WhatsApp</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '16px', fontSize: '0.9rem' }}>
                    Receba mensagens motivacionais e lembretes para fazer seu check-in diário.
                </p>

                <div className="setting-item">
                    <div className="setting-label">
                        <span>Número de WhatsApp</span>
                    </div>
                    <input
                        type="text"
                        className="setting-input"
                        placeholder="Ex: 5511999999999"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                        disabled={fetching || loading}
                    />
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Insira apenas números. O código do país (DDI) é obrigatório, ex: 55 para o Brasil, seguido do DDD e número.
                    </p>

                    <div className="setting-label" style={{ marginTop: '8px' }}>
                        <span>Ativar Lembretes?</span>
                        <label className="switch">
                            <input
                                type="checkbox"
                                checked={remindersActive}
                                onChange={(e) => setRemindersActive(e.target.checked)}
                                disabled={fetching || loading || !phoneNumber}
                            />
                            <span className="slider round"></span>
                        </label>
                    </div>

                    <div className="setting-label" style={{ marginTop: '16px' }}>
                        <span>Horário do Lembrete</span>
                    </div>
                    <input
                        type="time"
                        className="setting-input time-input"
                        value={reminderTime}
                        onChange={(e) => setReminderTime(e.target.value)}
                        disabled={fetching || loading || !remindersActive}
                        style={{ marginTop: '8px' }}
                    />
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                        Escolha o horário para receber sua mensagem diária.
                    </p>

                    <button
                        className="save-btn"
                        onClick={handleSaveSettings}
                        disabled={fetching || loading}
                    >
                        {loading ? 'Salvando...' : 'Salvar Configurações'}
                    </button>
                </div>
            </div>
            <div className="settings-section" style={{ marginTop: '24px' }}>
                <h3><Settings size={20} color="var(--primary)" /> Sistema e Conta</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '16px', fontSize: '0.9rem' }}>
                    Personalize sua experiência visual e gerencie sua sessão.
                </p>

                <div className="setting-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600 }}>Modo Visual</span>
                    <button
                        onClick={toggleTheme}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            background: 'var(--bg-main)', padding: '8px 16px',
                            borderRadius: 'var(--radius-lg)', color: 'var(--text-main)',
                            border: '1px solid var(--border-color)', fontWeight: 600,
                            boxShadow: 'var(--shadow-sm)'
                        }}
                    >
                        {theme === 'dark' ? <><Sun size={18} /> Claro</> : <><Moon size={18} /> Escuro</>}
                    </button>
                </div>

                <div className="setting-item" style={{ marginTop: '16px', background: 'transparent' }}>
                    <button
                        className="save-btn"
                        onClick={handleLogout}
                        style={{
                            backgroundColor: 'transparent', border: '1px solid var(--hp-color)',
                            color: 'var(--hp-color)', display: 'flex', justifyContent: 'center',
                            alignItems: 'center', gap: '8px'
                        }}
                    >
                        <LogOut size={20} /> Sair do Aplicativo
                    </button>
                </div>
            </div>
        </div>
    );
}

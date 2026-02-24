import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

import { toast } from 'sonner';
import './Login.css';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                navigate('/');
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
                navigate('/');
            }
        });

        return () => subscription.unsubscribe();
    }, [navigate]);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isSignUp) {
                if (!name) {
                    toast.error('Preencha o nome do seu avatar!');
                    setLoading(false);
                    return;
                }
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: name,
                        }
                    }
                });
                if (error) throw error;
                toast.success('Conta criada com sucesso! Forje sua lenda.');
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                toast.success('Bem-vindo de volta, aventureiro!');
            }
        } catch (error: any) {
            toast.error(error.message || 'Erro ao autenticar.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-banner">
                <div className="banner-content">
                    <img src="/migouslogo.png" alt="Migous Logo" style={{ width: '80px', height: '80px', objectFit: 'contain' }} className="banner-icon" />
                    <h2>Migous</h2>
                    <p>Transforme sua rotina em uma jornada épica. Complete diárias, ganhe experiência e forje seu próprio destino.</p>
                </div>
            </div>

            <div className="login-content">
                <div className="login-card">
                    <div className="login-header">
                        <div className="login-logo desktop-hidden">
                            <img src="/migouslogo.png" alt="Migous Logo" style={{ width: '48px', height: '48px', objectFit: 'contain' }} className="logo-icon" />
                            <h1>Migous</h1>
                        </div>
                        <h2>{isSignUp ? 'Criar nova conta' : 'Acesse o Reino'}</h2>
                        <p>{isSignUp ? 'Forje sua lenda agora mesmo.' : 'Bem-vindo de volta, aventureiro!'}</p>
                    </div>

                    <form onSubmit={handleAuth} className="login-form">
                        {isSignUp && (
                            <div className="input-group">
                                <label>Nome do Avatar</label>
                                <input
                                    type="text"
                                    placeholder="Ex: Guerreiro da Produtividade"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required={isSignUp}
                                />
                            </div>
                        )}

                        <div className="input-group">
                            <label>Email Mágico</label>
                            <input
                                type="email"
                                placeholder="seu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label>Palavra-Passe</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button type="submit" className="login-btn" disabled={loading}>
                            {loading ? 'Preparando...' : (isSignUp ? 'Forjar Nova Lenda' : 'Entrar no Reino')}
                        </button>
                    </form>

                    <div className="login-footer">
                        <p>
                            {isSignUp ? 'Já possui um registro?' : 'Ainda não é um herói?'}
                            <button
                                type="button"
                                className="toggle-mode-btn"
                                onClick={() => setIsSignUp(!isSignUp)}
                            >
                                {isSignUp ? 'Entrar' : 'Criar Conta'}
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

-- Schema de Autenticação e Gamificação LifeForge

-- Habilita UUIDs no PostgreSQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabela de Usuários / Avatar
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    hp INTEGER DEFAULT 100 NOT NULL,
    xp INTEGER DEFAULT 0 NOT NULL,
    level INTEGER DEFAULT 1 NOT NULL,
    credits INTEGER DEFAULT 0 NOT NULL,
    streak INTEGER DEFAULT 0 NOT NULL,
    timezone TEXT DEFAULT 'America/Sao_Paulo',
    phone_number TEXT,
    whatsapp_reminders_active BOOLEAN DEFAULT false,
    whatsapp_reminder_time TEXT DEFAULT '09:00',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabela de Rotinas (Dailies, Hábitos, To-Dos)
CREATE TABLE routines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    type TEXT CHECK(type IN ('daily', 'habit', 'todo')) NOT NULL,
    difficulty TEXT CHECK(difficulty IN ('easy', 'medium', 'hard', 'epic')) NOT NULL,
    recurrence TEXT, -- (Ex: diária, ou JSON de dias da semana)
    "habitType" TEXT,
    "isPomodoro" BOOLEAN DEFAULT false,
    "pomodoroTime" INTEGER DEFAULT 25,
    active BOOLEAN DEFAULT true,
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Logs de Rotinas (Histórico de check-in / reset automático)
CREATE TABLE routine_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    routine_id UUID REFERENCES routines(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    status TEXT CHECK(status IN ('completed', 'failed', 'skipped')) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Itens da Loja
CREATE TABLE shop_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    cost INTEGER NOT NULL,
    type TEXT CHECK(type IN ('consumable', 'permanent')) NOT NULL,
    stock INTEGER, -- NULL se for infinito
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Inventário do Usuário (Sua Mochila)
CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    item_id UUID REFERENCES shop_items(id) ON DELETE CASCADE NOT NULL,
    quantity INTEGER DEFAULT 1 NOT NULL,
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Uso do Inventário (Histórico dos buffs / recompensas ativadas)
CREATE TABLE inventory_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inventory_id UUID REFERENCES inventory(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Sistema de Conquistas (Achievements)
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    achievement_type TEXT NOT NULL,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Tabela de Auditoria de Eventos RPG (HP, XP e Dinheiro)
CREATE TABLE xp_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    amount INTEGER NOT NULL,
    reason TEXT NOT NULL, -- (ex: 'penalty_daily', 'habit_completion')
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- RLS (Row Level Security) - Protegendo as tabelas para que cada usuario veja apenas seus dados
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_events ENABLE ROW LEVEL SECURITY;

-- Exemplo de Policies:
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can manage own routines" ON routines FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own routine logs" ON routine_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own shop items" ON shop_items FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own inventory" ON inventory FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own inventory usage" ON inventory_usage FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own achievements" ON achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own xp events" ON xp_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own xp events" ON xp_events FOR SELECT USING (auth.uid() = user_id);

-- Configurando o trigger pra registrar user novo automaticamente a partir da tabela auth do supabase
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, name, email)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

export interface UserStats {
    hp: number;
    maxHp: number;
    xp: number;
    level: number;
    credits: number;
    streak: number;
}

export interface Routine {
    id: string;
    title: string;
    type: 'daily' | 'habit' | 'todo';
    difficulty: 'easy' | 'medium' | 'hard' | 'epic';
    habitType?: 'positive' | 'negative';
    daysOfWeek?: number[]; // 0 = Domingo, 1 = Seg... (para dailies)
    completedAt?: string;
    isPomodoro?: boolean;
    pomodoroTime?: number; // em minutos
    checklist?: { title: string; completed: boolean }[];
    active?: boolean;
}

export interface ShopItem {
    id: string;
    name: string;
    description: string;
    cost: number;
    stock?: number;
    type?: 'consumable' | 'permanent';
}

export interface InventoryItem {
    id: string;
    item: ShopItem;
    quantity: number;
    purchasedAt: string;
}

export interface GameState {
    stats: UserStats;
    routines: Routine[];
    shopItems: ShopItem[];
    inventory: InventoryItem[];
    lastUpdateDate: string;
    pendingDailiesToReview: Routine[];
    todayCompletions: Record<string, number>;
    isLoading: boolean;

    // Actions
    fetchUserStats: (userId: string) => Promise<void>;
    fetchRoutines: (userId: string) => Promise<void>;
    completeRoutine: (id: string) => Promise<void>;
    failRoutine: (id: string) => Promise<void>;
    addRoutine: (routine: Omit<Routine, 'id'>) => Promise<void>;
    editRoutine: (id: string, partialData: Partial<Routine>) => Promise<void>;
    deleteRoutine: (id: string) => Promise<void>;
    runDailyCheck: () => void;
    resolvePendingDailies: (completedIds: string[]) => void;

    // Data Sync
    fetchShopAndInventory: (userId: string) => Promise<void>;

    // Economy
    createShopItem: (item: Omit<ShopItem, 'id'>) => void;
    editShopItem: (id: string, partialData: Partial<ShopItem>) => void;
    deleteShopItem: (id: string) => void;
    buyItem: (itemId: string) => void;
    useInventoryItem: (invId: string) => void;
}

const levelThresholds = (level: number) => 100 * Math.pow(1.5, level - 1);

const difficultyRewards = {
    easy: { xp: 10, credits: 5, failXp: 5, failHp: 3 },
    medium: { xp: 25, credits: 15, failXp: 12, failHp: 8 },
    hard: { xp: 50, credits: 30, failXp: 25, failHp: 15 },
    epic: { xp: 100, credits: 60, failXp: 50, failHp: 30 }
};

export const useStore = create<GameState>()(
    persist(
        (set) => ({
            stats: {
                hp: 100,
                maxHp: 100,
                xp: 0,
                level: 1,
                credits: 0,
                streak: 0,
            },
            lastUpdateDate: new Date().toISOString(),
            pendingDailiesToReview: [],
            isLoading: false,
            routines: [],
            shopItems: [],
            inventory: [],
            todayCompletions: {},

            fetchUserStats: async (userId: string) => {
                try {
                    const { data, error } = await supabase.from('users').select('hp, xp, level, credits, streak').eq('id', userId).single();
                    if (error) {
                        // Auto-create missing user profile if it doesn't exist (PGRST116: no rows returned)
                        if (error.code === 'PGRST116') {
                            const { data: authData } = await supabase.auth.getUser();
                            const name = authData?.user?.user_metadata?.full_name || 'Herói';
                            const email = authData?.user?.email || '';

                            const { data: newData, error: insertError } = await supabase
                                .from('users')
                                .insert([{ id: userId, name, email }])
                                .select('hp, xp, level, credits, streak')
                                .single();

                            if (insertError) throw insertError;

                            if (newData) {
                                set((state) => ({
                                    stats: { ...state.stats, ...newData }
                                }));
                            }
                            return;
                        }
                        throw error;
                    }

                    if (data) {
                        set((state) => ({
                            stats: {
                                ...state.stats,
                                hp: data.hp ?? state.stats.hp,
                                xp: data.xp ?? state.stats.xp,
                                level: data.level ?? state.stats.level,
                                credits: data.credits ?? state.stats.credits,
                                streak: data.streak ?? state.stats.streak,
                            }
                        }));
                    }
                } catch (e: any) {
                    // Fail silently or log
                    console.error('Error fetching user stats:', e);
                }
            },

            fetchRoutines: async (userId: string) => {
                set({ isLoading: true });
                try {
                    const { data, error } = await supabase.from('routines').select('*').eq('user_id', userId);
                    if (error) throw error;

                    const todayDate = new Date().toISOString().split('T')[0];
                    const { data: logsData } = await supabase.from('routine_logs').select('routine_id').eq('user_id', userId).eq('date', todayDate).eq('status', 'completed');

                    const completions: Record<string, number> = {};
                    if (logsData) {
                        logsData.forEach(log => {
                            completions[log.routine_id] = (completions[log.routine_id] || 0) + 1;
                        });
                    }

                    if (data) set({ routines: data, todayCompletions: completions });
                } catch (e: any) {
                    toast.error('Erro ao buscar rotinas', { description: e.message });
                } finally {
                    set({ isLoading: false });
                }
            },

            fetchShopAndInventory: async (userId: string) => {
                try {
                    const { data: shopData } = await supabase.from('shop_items').select('*').eq('user_id', userId);
                    const { data: invData } = await supabase.from('inventory').select('id, item_id, quantity, purchased_at').eq('user_id', userId);

                    const finalShop = shopData || [];
                    const finalInv = (invData || []).map((inv: any) => ({
                        id: inv.id,
                        item: finalShop.find(s => s.id === inv.item_id) as ShopItem,
                        quantity: inv.quantity,
                        purchasedAt: inv.purchased_at
                    })).filter(i => i.item); // Remove if item got deleted

                    set({ shopItems: finalShop, inventory: finalInv });
                } catch (e: any) {
                    console.error('Error fetching shop and inventory:', e);
                }
            },

            addRoutine: async (routine) => {
                try {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) throw new Error("Usuário não autenticado");

                    // Prepare the data for insertion, mapping frontend fields to DB columns
                    const { daysOfWeek, ...restRoutine } = routine;
                    const newRoutine = {
                        ...restRoutine,
                        user_id: user.id,
                        type: routine.type || 'daily',
                        difficulty: routine.difficulty || 'medium',
                        recurrence: daysOfWeek ? JSON.stringify(daysOfWeek) : null
                    };

                    const { data, error } = await supabase.from('routines').insert([newRoutine]).select().single();
                    if (error) throw error;
                    set((state) => ({ routines: [...state.routines, data] }));
                } catch (e: any) {
                    toast.error('Erro ao criar rotina', { description: e.message });
                }
            },

            editRoutine: async (id, partialData) => {
                try {
                    const updateData = { ...partialData };
                    if (partialData.daysOfWeek) {
                        (updateData as any).recurrence = JSON.stringify(partialData.daysOfWeek);
                        delete updateData.daysOfWeek;
                    }

                    const { error } = await supabase.from('routines').update(updateData).eq('id', id);
                    if (error) throw error;

                    set((state) => {
                        const newRoutines = state.routines.map(r => r.id === id ? { ...r, ...partialData } : r);
                        return { routines: newRoutines };
                    });
                } catch (e: any) {
                    toast.error('Erro ao editar rotina', { description: e.message });
                }
            },

            deleteRoutine: async (id) => {
                try {
                    const { error } = await supabase.from('routines').delete().eq('id', id);
                    if (error) throw error;
                    set((state) => ({ routines: state.routines.filter(r => r.id !== id) }));
                } catch (e: any) {
                    toast.error('Erro ao deletar rotina', { description: e.message });
                }
            },

            completeRoutine: async (id) => {
                const state = useStore.getState();
                const routine = state.routines.find(r => r.id === id);
                if (!routine) return;

                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const reward = difficultyRewards[routine.difficulty];
                const newXp = state.stats.xp + reward.xp;
                const currentThreshold = levelThresholds(state.stats.level);

                let newLevel = state.stats.level;
                let finalXp = newXp;
                let newHp = state.stats.hp + (reward.xp * 0.1);

                if (newHp > state.stats.maxHp) newHp = state.stats.maxHp;

                if (newXp >= currentThreshold) {
                    newLevel += 1;
                    finalXp = newXp - currentThreshold;
                    newHp = state.stats.maxHp;
                }

                const newCredits = state.stats.credits + reward.credits;
                const completedDate = new Date().toISOString();

                try {
                    // Record log in routine_logs efficiently. The column completedAt does NOT exist in routines table.
                    const todayDate = new Date().toISOString().split('T')[0];
                    await supabase.from('routine_logs').insert([
                        { user_id: user.id, routine_id: id, status: 'completed', date: todayDate }
                    ]);
                    // Sync stats to users table
                    await supabase.from('users').update({
                        xp: finalXp,
                        level: newLevel,
                        hp: newHp,
                        credits: newCredits
                    }).eq('id', user.id);

                    // If it is a todo, disable it natively
                    if (routine.type === 'todo') {
                        await supabase.from('routines').update({ active: false }).eq('id', id);
                    }

                    toast.success(`+${reward.xp} EXP | +${reward.credits} Créditos`, {
                        description: `Tarefa "${routine.title}" concluída!`
                    });

                    set((state) => ({
                        stats: {
                            ...state.stats,
                            xp: finalXp,
                            level: newLevel,
                            hp: newHp,
                            credits: newCredits
                        },
                        routines: state.routines.map(r => r.id === id ? { ...r, completedAt: completedDate, active: r.type === 'todo' ? false : r.active } : r),
                        todayCompletions: {
                            ...state.todayCompletions,
                            [id]: (state.todayCompletions[id] || 0) + 1
                        }
                    }));
                } catch (error: any) {
                    toast.error('Falha ao sincronizar online', { description: error.message });
                }
            },

            failRoutine: async (id) => {
                const state = useStore.getState();
                const routine = state.routines.find(r => r.id === id);
                if (!routine) return;

                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const penalty = difficultyRewards[routine.difficulty];

                let newHp = state.stats.hp - penalty.failHp;
                let newCredits = state.stats.credits;
                let newXp = state.stats.xp - penalty.failXp;

                if (newXp < 0) newXp = 0;

                if (newHp <= 0) {
                    newHp = state.stats.maxHp / 2;
                    newCredits = Math.floor(newCredits * 0.9);
                    newXp = Math.floor(newXp * 0.9);
                    toast.error('Você morreu!', { description: 'Perdeu 10% de EXP e Créditos. HP restaurado em 50%.' });
                } else {
                    toast.error(`-${penalty.failHp} HP | -${penalty.failXp} EXP`, {
                        description: `Hábito ruim ou falha em "${routine.title}"`
                    });
                }

                try {
                    await supabase.from('routine_logs').insert([{
                        routine_id: id,
                        user_id: user.id,
                        date: new Date().toISOString().split('T')[0],
                        status: 'failed'
                    }]);

                    // Sync to users table
                    await supabase.from('users').update({
                        xp: newXp,
                        hp: newHp,
                        credits: newCredits
                    }).eq('id', user.id);

                    set((state) => ({
                        stats: { ...state.stats, hp: newHp, credits: newCredits, xp: newXp }
                    }));
                } catch (error: any) {
                    toast.error('Erro de sincronização', { description: error.message });
                }
            },

            runDailyCheck: () => set((state) => {
                const today = new Date().toDateString();
                const lastUpdate = new Date(state.lastUpdateDate).toDateString();

                if (today === lastUpdate) return state;

                const dailies = state.routines.filter(r => r.type === 'daily');
                const missed = dailies.filter(d => !d.completedAt || new Date(d.completedAt).toDateString() !== lastUpdate);

                if (missed.length > 0) {
                    return { pendingDailiesToReview: missed };
                }

                // If no missed, just reset and grant streak
                const resetRoutines = state.routines.map(r =>
                    r.type === 'daily' ? { ...r, completedAt: undefined } : r
                );

                // Sync new streak to the cloud immediately to prevent overwrite on next refresh
                const newStreak = state.stats.streak + 1;
                supabase.auth.getUser().then(({ data: { user } }) => {
                    if (user) {
                        supabase.from('users').update({ streak: newStreak }).eq('id', user.id).then();
                    }
                });

                return {
                    stats: { ...state.stats, streak: newStreak },
                    routines: resetRoutines,
                    lastUpdateDate: new Date().toISOString()
                };
            }),

            resolvePendingDailies: (completedIds: string[]) => set((state) => {
                let totalHpPenalty = 0;
                let totalXpPenalty = 0;
                let actuallyMissed = false;

                state.pendingDailiesToReview.forEach(d => {
                    if (!completedIds.includes(d.id)) {
                        actuallyMissed = true;
                        const penalty = difficultyRewards[d.difficulty];
                        totalHpPenalty += penalty.failHp;
                        totalXpPenalty += penalty.failXp;
                    }
                });

                const newStreak = actuallyMissed ? 0 : state.stats.streak + 1;

                let newHp = state.stats.hp - totalHpPenalty;
                let newXp = state.stats.xp - totalXpPenalty;
                let newCredits = state.stats.credits;

                if (newXp < 0) newXp = 0;
                if (newHp <= 0 && totalHpPenalty > 0) {
                    newHp = state.stats.maxHp / 2;
                    newCredits = Math.floor(newCredits * 0.9);
                    newXp = Math.floor(newXp * 0.9);
                }

                const resetRoutines = state.routines.map(r =>
                    r.type === 'daily' ? { ...r, completedAt: undefined } : r
                );

                // Need to apply XP/Credits for the ones they marked completed? Optional. The user requested simple varredura, but let's just avoid penalizing.

                return {
                    stats: {
                        ...state.stats,
                        hp: newHp,
                        xp: newXp,
                        credits: newCredits,
                        streak: newStreak
                    },
                    routines: resetRoutines,
                    pendingDailiesToReview: [],
                    lastUpdateDate: new Date().toISOString()
                };
            }),

            createShopItem: async (item) => {
                try {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) return;

                    const newItem = { ...item, user_id: user.id, type: item.type || 'consumable' };
                    const { data, error } = await supabase.from('shop_items').insert([newItem]).select().single();
                    if (error) throw error;

                    set((state) => ({ shopItems: [...state.shopItems, data] }));
                } catch (e: any) {
                    toast.error('Erro ao criar item', { description: e.message });
                }
            },

            editShopItem: async (id, partialData) => {
                try {
                    const { error } = await supabase.from('shop_items').update(partialData).eq('id', id);
                    if (error) throw error;
                    set((state) => ({ shopItems: state.shopItems.map(i => i.id === id ? { ...i, ...partialData } : i) }));
                } catch (e: any) {
                    toast.error('Erro ao editar item', { description: e.message });
                }
            },

            deleteShopItem: async (id) => {
                try {
                    const { error } = await supabase.from('shop_items').delete().eq('id', id);
                    if (error) throw error;
                    set((state) => ({ shopItems: state.shopItems.filter(i => i.id !== id) }));
                } catch (e: any) {
                    toast.error('Erro ao deletar item', { description: e.message });
                }
            },

            buyItem: async (itemId) => {
                const state = useStore.getState();
                const item = state.shopItems.find(i => i.id === itemId);
                if (!item || state.stats.credits < item.cost) return;

                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const newCredits = state.stats.credits - item.cost;
                const exists = state.inventory.find(i => i.item.id === itemId);

                try {
                    let newInvItem;
                    if (exists) {
                        const { data, error } = await supabase.from('inventory').update({ quantity: exists.quantity + 1 }).eq('id', exists.id).select().single();
                        if (error) throw error;
                        newInvItem = { ...exists, quantity: data.quantity };
                    } else {
                        const { data, error } = await supabase.from('inventory').insert([{ user_id: user.id, item_id: itemId, quantity: 1 }]).select().single();
                        if (error) throw error;
                        newInvItem = { id: data.id, item, quantity: data.quantity, purchasedAt: data.purchased_at };
                    }

                    // Sync credits decrement with users table
                    await supabase.from('users').update({ credits: newCredits }).eq('id', user.id);

                    set((state) => {
                        let updatedInv = [...state.inventory];
                        if (exists) {
                            updatedInv = updatedInv.map(i => i.id === exists.id ? newInvItem : i);
                        } else {
                            updatedInv.push(newInvItem);
                        }
                        return {
                            stats: { ...state.stats, credits: newCredits },
                            inventory: updatedInv
                        };
                    });

                    toast.success('Compra realizada!', { description: `${item.name} foi adicionado à mochila.` });
                } catch (e: any) {
                    toast.error('Erro na compra', { description: e.message });
                }
            },

            useInventoryItem: async (invId) => {
                const state = useStore.getState();
                const invItem = state.inventory.find(i => i.id === invId);
                if (!invItem || invItem.quantity <= 0) return;

                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const newQuantity = invItem.quantity - 1;

                try {
                    if (newQuantity <= 0) {
                        await supabase.from('inventory').delete().eq('id', invId);
                    } else {
                        await supabase.from('inventory').update({ quantity: newQuantity }).eq('id', invId);
                    }

                    // Optional: Log usage into inventory_usage
                    await supabase.from('inventory_usage').insert([{ inventory_id: invId, user_id: user.id }]);

                    set((state) => {
                        let newInventory = [...state.inventory];
                        if (newQuantity <= 0) {
                            newInventory = newInventory.filter(i => i.id !== invId);
                        } else {
                            newInventory = newInventory.map(i => i.id === invId ? { ...i, quantity: newQuantity } : i);
                        }
                        return { inventory: newInventory };
                    });

                    toast.success(`Usou ${invItem.item.name}!`);
                } catch (e: any) {
                    toast.error('Erro ao usar item', { description: e.message });
                }
            }
        }),
        {
            name: 'lifeforge-storage',
        }
    )
);

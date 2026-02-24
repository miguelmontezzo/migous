import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        );

        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
        if (userError || !user) throw new Error('Não autenticado ou token inválido');

        const { data, error } = await supabaseClient
            .from('users')
            .select('phone_number, whatsapp_reminders_active')
            .eq('id', user.id)
            .single();

        if (error || !data) throw new Error('Usuário não encontrado no banco de dados');

        if (!data.phone_number || !data.whatsapp_reminders_active) {
            return new Response(JSON.stringify({ error: 'WhatsApp não configurado ou inativo' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            });
        }

        const message = "🚀 Olá! Lembre-se de fazer seu check-in hoje no LifeForge e garanta seu XP! A consistência constrói o seu império.";

        const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY');
        if (!evolutionApiKey) {
            throw new Error('Chave da EVOLUTION_API_KEY não configurada nos secrets do Supabase');
        }

        const response = await fetch("https://zzotech-evolution-api.lgctvv.easypanel.host/message/sendText/kpyai", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "apikey": evolutionApiKey
            },
            body: JSON.stringify({
                number: data.phone_number,
                options: {
                    delay: 1200,
                    presence: "composing"
                },
                textMessage: {
                    text: message
                },
                text: message // Send both for compatibility
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Erro na API Evolution: ${errText}`);
        }

        const result = await response.json();

        return new Response(
            JSON.stringify({ success: true, result }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
    } catch (err: any) {
        console.error(err);
        return new Response(
            JSON.stringify({ error: err.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
        );
    }
});

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { email } = await req.json();

    if (!email) {
      throw new Error('Email é obrigatório');
    }

    console.log('Deletando usuário:', email);

    // Buscar o usuário pelo email
    const { data: { users }, error: listError } = await supabaseClient.auth.admin.listUsers();
    
    if (listError) {
      console.error('Erro ao listar usuários:', listError);
      throw listError;
    }

    const user = users.find(u => u.email === email);
    
    if (!user) {
      console.log('Usuário não encontrado no auth:', email);
      // Deletar apenas o perfil se não encontrar o auth user
      // Remove o status principal antes de deletar para evitar trigger
      const { error: updateError } = await supabaseClient
        .from('perfis')
        .update({ principal: false })
        .eq('email', email);

      if (updateError) {
        console.error('Erro ao atualizar perfil:', updateError);
      }

      const { error: perfilError } = await supabaseClient
        .from('perfis')
        .delete()
        .eq('email', email);

      if (perfilError) {
        console.error('Erro ao deletar perfil:', perfilError);
        throw perfilError;
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Perfil deletado com sucesso' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Primeiro remover o status principal para evitar trigger
    const { error: updateError } = await supabaseClient
      .from('perfis')
      .update({ principal: false })
      .eq('email', email);

    if (updateError) {
      console.error('Erro ao atualizar perfil (pode não existir):', updateError);
    }

    // Deletar o perfil
    const { error: perfilError } = await supabaseClient
      .from('perfis')
      .delete()
      .eq('email', email);

    if (perfilError) {
      console.error('Erro ao deletar perfil:', perfilError);
      throw perfilError;
    }

    console.log('Perfil deletado, deletando auth user...');

    // Deletar o usuário do auth
    const { error: deleteError } = await supabaseClient.auth.admin.deleteUser(user.id);

    if (deleteError) {
      console.error('Erro ao deletar auth user:', deleteError);
      throw deleteError;
    }

    console.log('Usuário deletado com sucesso:', email);

    return new Response(
      JSON.stringify({ success: true, message: 'Usuário deletado com sucesso' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na função delete-auth-user:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});

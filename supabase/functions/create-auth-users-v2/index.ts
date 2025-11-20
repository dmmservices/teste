
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface UserData {
  email: string;
  password: string;
  nome_completo: string;
  empresa_id?: string;
  funcao?: string;
  principal?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Ler dados do body
    const body = await req.json()
    const users: UserData[] = body.users || []

    if (users.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Nenhum usuário fornecido' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        },
      )
    }

    console.log('Iniciando criação de usuários...')
    
    const results = []
    
    for (const userData of users) {
      try {
        console.log(`Tentando criar usuário: ${userData.email}`)
        
        // Primeiro, verificar se o usuário já existe
        const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers()
        
        if (listError) {
          console.error('Erro ao listar usuários:', listError)
          results.push({
            email: userData.email,
            status: 'error',
            message: `Erro ao verificar usuário existente: ${listError.message}`
          })
          continue
        }

        const userExists = existingUsers.users.find(user => user.email === userData.email)
        
        if (userExists) {
          console.log(`Usuário ${userData.email} já existe`)
          results.push({
            email: userData.email,
            status: 'already_exists',
            message: 'Usuário já existe'
          })
          continue
        }

        // Criar o usuário
        const { data: authUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: userData.email,
          password: userData.password,
          email_confirm: true, // Confirmar email automaticamente
          user_metadata: {
            nome_completo: userData.nome_completo
          }
        })

        if (createError) {
          console.error(`Erro ao criar usuário ${userData.email}:`, createError)
          results.push({
            email: userData.email,
            status: 'error',
            message: createError.message
          })
          continue
        }

        if (authUser.user) {
          // Verificar se o perfil já existe
          const { data: existingPerfil } = await supabaseAdmin
            .from('perfis')
            .select('id')
            .eq('email', userData.email)
            .maybeSingle()

          if (existingPerfil) {
            // Atualizar o perfil existente com o ID do usuário criado
            const { error: updateError } = await supabaseAdmin
              .from('perfis')
              .update({ id: authUser.user.id })
              .eq('email', userData.email)

            if (updateError) {
              console.error(`Erro ao atualizar perfil para ${userData.email}:`, updateError)
            }
          } else if (userData.empresa_id && userData.funcao) {
            // Criar novo perfil para usuário de cliente
            const { error: insertError } = await supabaseAdmin
              .from('perfis')
              .insert({
                id: authUser.user.id,
                email: userData.email,
                nome_completo: userData.nome_completo,
                empresa_id: userData.empresa_id,
                funcao: userData.funcao,
                principal: userData.principal || false,
                senha_temporaria: true  // Marcar como senha temporária
              })

            if (insertError) {
              console.error(`Erro ao criar perfil para ${userData.email}:`, insertError)
            }
          }

          console.log(`Usuário ${userData.email} criado com sucesso`)
          results.push({
            email: userData.email,
            status: 'created',
            message: 'Usuário criado com sucesso',
            userId: authUser.user.id,
            senha: userData.password
          })
        }

      } catch (error) {
        console.error(`Erro inesperado ao processar ${userData.email}:`, error)
        results.push({
          email: userData.email,
          status: 'error',
          message: `Erro inesperado: ${error.message}`
        })
      }
    }

    console.log('Processo concluído. Resultados:', results)

    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        summary: {
          total: users.length,
          created: results.filter(r => r.status === 'created').length,
          existing: results.filter(r => r.status === 'already_exists').length,
          errors: results.filter(r => r.status === 'error').length
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Erro geral na função:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor', 
        details: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

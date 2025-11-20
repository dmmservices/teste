export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      acessos: {
        Row: {
          atualizado_em: string
          atualizado_por: string | null
          criado_em: string
          criado_por: string
          empresa_id: string
          id: string
          nome: string
          notas: string | null
          senha_criptografada: string
          site: string
          status: boolean
          totp_enabled: boolean | null
          totp_secret: string | null
          ultimo_acesso: string | null
          usuario: string
        }
        Insert: {
          atualizado_em?: string
          atualizado_por?: string | null
          criado_em?: string
          criado_por: string
          empresa_id: string
          id?: string
          nome: string
          notas?: string | null
          senha_criptografada: string
          site: string
          status?: boolean
          totp_enabled?: boolean | null
          totp_secret?: string | null
          ultimo_acesso?: string | null
          usuario: string
        }
        Update: {
          atualizado_em?: string
          atualizado_por?: string | null
          criado_em?: string
          criado_por?: string
          empresa_id?: string
          id?: string
          nome?: string
          notas?: string | null
          senha_criptografada?: string
          site?: string
          status?: boolean
          totp_enabled?: boolean | null
          totp_secret?: string | null
          ultimo_acesso?: string | null
          usuario?: string
        }
        Relationships: [
          {
            foreignKeyName: "acessos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      comentarios_tarefa: {
        Row: {
          anexos: Json | null
          autor_id: string | null
          comentario: string
          criado_em: string
          id: string
          tarefa_id: string
        }
        Insert: {
          anexos?: Json | null
          autor_id?: string | null
          comentario: string
          criado_em?: string
          id?: string
          tarefa_id: string
        }
        Update: {
          anexos?: Json | null
          autor_id?: string | null
          comentario?: string
          criado_em?: string
          id?: string
          tarefa_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comentarios_tarefa_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comentarios_tarefa_tarefa_id_fkey"
            columns: ["tarefa_id"]
            isOneToOne: false
            referencedRelation: "tarefas"
            referencedColumns: ["id"]
          },
        ]
      }
      despesas: {
        Row: {
          atualizado_em: string | null
          criado_em: string | null
          criado_por: string
          data_fim: string | null
          data_inicio: string | null
          data_pagamento: string
          frequencia_recorrencia: string | null
          id: string
          meio_pagamento: string
          nome: string
          notas: string | null
          quantidade: number
          recorrente: boolean | null
          tipo: string
          valor_total: number | null
          valor_unitario: number
        }
        Insert: {
          atualizado_em?: string | null
          criado_em?: string | null
          criado_por: string
          data_fim?: string | null
          data_inicio?: string | null
          data_pagamento: string
          frequencia_recorrencia?: string | null
          id?: string
          meio_pagamento: string
          nome: string
          notas?: string | null
          quantidade?: number
          recorrente?: boolean | null
          tipo: string
          valor_total?: number | null
          valor_unitario: number
        }
        Update: {
          atualizado_em?: string | null
          criado_em?: string | null
          criado_por?: string
          data_fim?: string | null
          data_inicio?: string | null
          data_pagamento?: string
          frequencia_recorrencia?: string | null
          id?: string
          meio_pagamento?: string
          nome?: string
          notas?: string | null
          quantidade?: number
          recorrente?: boolean | null
          tipo?: string
          valor_total?: number | null
          valor_unitario?: number
        }
        Relationships: []
      }
      empresas: {
        Row: {
          atualizado_em: string | null
          criado_em: string | null
          criado_por: string | null
          data_encerramento: string | null
          data_inicio: string | null
          data_pagamento: string | null
          descricao: string | null
          frequencia_pagamento: string | null
          id: string
          nome: string
          nome_decisor: string | null
          responsavel_id: string | null
          senha: string | null
          servicos: Json | null
          site: string | null
          slug: string
          status: Database["public"]["Enums"]["status_cliente"] | null
          tipo_contrato: string | null
          url_logo: string | null
          valor_projeto: number | null
        }
        Insert: {
          atualizado_em?: string | null
          criado_em?: string | null
          criado_por?: string | null
          data_encerramento?: string | null
          data_inicio?: string | null
          data_pagamento?: string | null
          descricao?: string | null
          frequencia_pagamento?: string | null
          id?: string
          nome: string
          nome_decisor?: string | null
          responsavel_id?: string | null
          senha?: string | null
          servicos?: Json | null
          site?: string | null
          slug: string
          status?: Database["public"]["Enums"]["status_cliente"] | null
          tipo_contrato?: string | null
          url_logo?: string | null
          valor_projeto?: number | null
        }
        Update: {
          atualizado_em?: string | null
          criado_em?: string | null
          criado_por?: string | null
          data_encerramento?: string | null
          data_inicio?: string | null
          data_pagamento?: string | null
          descricao?: string | null
          frequencia_pagamento?: string | null
          id?: string
          nome?: string
          nome_decisor?: string | null
          responsavel_id?: string | null
          senha?: string | null
          servicos?: Json | null
          site?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["status_cliente"] | null
          tipo_contrato?: string | null
          url_logo?: string | null
          valor_projeto?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "empresas_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "empresas_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
        ]
      }
      favoritos_acesso: {
        Row: {
          acesso_id: string
          criado_em: string
          id: string
          usuario_id: string
        }
        Insert: {
          acesso_id: string
          criado_em?: string
          id?: string
          usuario_id: string
        }
        Update: {
          acesso_id?: string
          criado_em?: string
          id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favoritos_acesso_acesso_id_fkey"
            columns: ["acesso_id"]
            isOneToOne: false
            referencedRelation: "acessos"
            referencedColumns: ["id"]
          },
        ]
      }
      itens_checklist: {
        Row: {
          atualizado_em: string | null
          concluido: boolean | null
          concluido_em: string | null
          concluido_por: string | null
          criado_em: string | null
          criado_por: string | null
          data_entrega: string | null
          descricao: string | null
          empresa_id: string
          id: string
          prioridade: Database["public"]["Enums"]["prioridade_tarefa"]
          tipo: Database["public"]["Enums"]["tipo_checklist"]
          titulo: string
        }
        Insert: {
          atualizado_em?: string | null
          concluido?: boolean | null
          concluido_em?: string | null
          concluido_por?: string | null
          criado_em?: string | null
          criado_por?: string | null
          data_entrega?: string | null
          descricao?: string | null
          empresa_id: string
          id?: string
          prioridade?: Database["public"]["Enums"]["prioridade_tarefa"]
          tipo: Database["public"]["Enums"]["tipo_checklist"]
          titulo: string
        }
        Update: {
          atualizado_em?: string | null
          concluido?: boolean | null
          concluido_em?: string | null
          concluido_por?: string | null
          criado_em?: string | null
          criado_por?: string | null
          data_entrega?: string | null
          descricao?: string | null
          empresa_id?: string
          id?: string
          prioridade?: Database["public"]["Enums"]["prioridade_tarefa"]
          tipo?: Database["public"]["Enums"]["tipo_checklist"]
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "itens_checklist_concluido_por_fkey"
            columns: ["concluido_por"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_checklist_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_checklist_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      pagamentos: {
        Row: {
          atualizado_em: string
          comprovante_url: string | null
          criado_em: string
          data_vencimento: string
          empresa_id: string
          forma_pagamento: string
          id: string
          notas: string | null
          status: string
          valor: number
        }
        Insert: {
          atualizado_em?: string
          comprovante_url?: string | null
          criado_em?: string
          data_vencimento: string
          empresa_id: string
          forma_pagamento: string
          id?: string
          notas?: string | null
          status: string
          valor: number
        }
        Update: {
          atualizado_em?: string
          comprovante_url?: string | null
          criado_em?: string
          data_vencimento?: string
          empresa_id?: string
          forma_pagamento?: string
          id?: string
          notas?: string | null
          status?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      perfis: {
        Row: {
          atualizado_em: string | null
          criado_em: string | null
          email: string
          empresa_id: string | null
          funcao: Database["public"]["Enums"]["funcao_usuario"]
          id: string
          nome_completo: string
          principal: boolean
          senha_temporaria: boolean | null
          url_avatar: string | null
        }
        Insert: {
          atualizado_em?: string | null
          criado_em?: string | null
          email: string
          empresa_id?: string | null
          funcao: Database["public"]["Enums"]["funcao_usuario"]
          id?: string
          nome_completo: string
          principal?: boolean
          senha_temporaria?: boolean | null
          url_avatar?: string | null
        }
        Update: {
          atualizado_em?: string | null
          criado_em?: string | null
          email?: string
          empresa_id?: string | null
          funcao?: Database["public"]["Enums"]["funcao_usuario"]
          id?: string
          nome_completo?: string
          principal?: boolean
          senha_temporaria?: boolean | null
          url_avatar?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "perfis_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      tarefa_responsaveis: {
        Row: {
          criado_em: string
          id: string
          responsavel_id: string
          tarefa_id: string
        }
        Insert: {
          criado_em?: string
          id?: string
          responsavel_id: string
          tarefa_id: string
        }
        Update: {
          criado_em?: string
          id?: string
          responsavel_id?: string
          tarefa_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tarefa_responsaveis_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarefa_responsaveis_tarefa_id_fkey"
            columns: ["tarefa_id"]
            isOneToOne: false
            referencedRelation: "tarefas"
            referencedColumns: ["id"]
          },
        ]
      }
      tarefas: {
        Row: {
          atualizado_em: string | null
          criado_em: string | null
          criado_por: string
          data_entrega: string | null
          data_inicio: string | null
          descricao: string | null
          empresa_id: string
          id: string
          ordem_subtarefa: number | null
          prioridade: Database["public"]["Enums"]["prioridade_tarefa"] | null
          status: Database["public"]["Enums"]["status_tarefa"] | null
          tarefa_pai_id: string | null
          tipo: string | null
          titulo: string
        }
        Insert: {
          atualizado_em?: string | null
          criado_em?: string | null
          criado_por: string
          data_entrega?: string | null
          data_inicio?: string | null
          descricao?: string | null
          empresa_id: string
          id?: string
          ordem_subtarefa?: number | null
          prioridade?: Database["public"]["Enums"]["prioridade_tarefa"] | null
          status?: Database["public"]["Enums"]["status_tarefa"] | null
          tarefa_pai_id?: string | null
          tipo?: string | null
          titulo: string
        }
        Update: {
          atualizado_em?: string | null
          criado_em?: string | null
          criado_por?: string
          data_entrega?: string | null
          data_inicio?: string | null
          descricao?: string | null
          empresa_id?: string
          id?: string
          ordem_subtarefa?: number | null
          prioridade?: Database["public"]["Enums"]["prioridade_tarefa"] | null
          status?: Database["public"]["Enums"]["status_tarefa"] | null
          tarefa_pai_id?: string | null
          tipo?: string | null
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_tarefas_criado_por"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarefas_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarefas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarefas_tarefa_pai_id_fkey"
            columns: ["tarefa_pai_id"]
            isOneToOne: false
            referencedRelation: "tarefas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      empresa_tem_registros: {
        Args: { empresa_id_param: string }
        Returns: boolean
      }
      get_current_user_profile: {
        Args: never
        Returns: {
          user_email: string
          user_empresa_id: string
          user_funcao: Database["public"]["Enums"]["funcao_usuario"]
        }[]
      }
      get_user_auth_id: { Args: { user_email: string }; Returns: string }
    }
    Enums: {
      ambiente_acesso: "producao" | "homologacao" | "desenvolvimento"
      categoria_acesso:
        | "social"
        | "ads"
        | "ecommerce"
        | "streaming"
        | "productivity"
        | "development"
        | "finance"
        | "other"
      funcao_usuario:
        | "dmm_admin"
        | "dmm_membro"
        | "cliente_admin"
        | "cliente_membro"
      prioridade_tarefa: "baixa" | "media" | "alta"
      status_cliente: "ativo" | "pausado" | "encerrado"
      status_tarefa:
        | "pode_fazer"
        | "deve_fazer"
        | "pronto_fazer"
        | "em_andamento"
        | "em_revisao"
        | "recorrente"
        | "concluido"
        | "rejeitado"
      tipo_checklist: "pendencia_dmm" | "pendencia_cliente"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      ambiente_acesso: ["producao", "homologacao", "desenvolvimento"],
      categoria_acesso: [
        "social",
        "ads",
        "ecommerce",
        "streaming",
        "productivity",
        "development",
        "finance",
        "other",
      ],
      funcao_usuario: [
        "dmm_admin",
        "dmm_membro",
        "cliente_admin",
        "cliente_membro",
      ],
      prioridade_tarefa: ["baixa", "media", "alta"],
      status_cliente: ["ativo", "pausado", "encerrado"],
      status_tarefa: [
        "pode_fazer",
        "deve_fazer",
        "pronto_fazer",
        "em_andamento",
        "em_revisao",
        "recorrente",
        "concluido",
        "rejeitado",
      ],
      tipo_checklist: ["pendencia_dmm", "pendencia_cliente"],
    },
  },
} as const

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Hook genérico que busca dados de uma tabela do Supabase filtrados pelo user_id atual.
 * Se a tabela estiver vazia (ou usuário não logado), retorna `fallback` (mockups) e marca `isMock = true`.
 * Os dados serão alimentados pelo N8N via WhatsApp ou pelo próprio sistema no futuro.
 */
export function useSupabaseTable<T>(
  table: "customers" | "products" | "sales" | "appointments" | "expenses" | "taxes",
  fallback: T[],
  options?: {
    orderBy?: { column: string; ascending?: boolean };
    select?: string;
  }
) {
  const { user } = useAuth();
  const [data, setData] = useState<T[]>(fallback);
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) {
      setData(fallback);
      setIsMock(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    let query = supabase.from(table).select(options?.select ?? "*").eq("user_id", user.id);
    if (options?.orderBy) {
      query = query.order(options.orderBy.column, { ascending: options.orderBy.ascending ?? false });
    }
    const { data: rows, error } = await query;
    if (error || !rows || rows.length === 0) {
      setData(fallback);
      setIsMock(true);
    } else {
      setData(rows as T[]);
      setIsMock(false);
    }
    setLoading(false);
  }, [user, table, options?.orderBy?.column, options?.orderBy?.ascending, options?.select]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, isMock, refetch: fetchData };
}

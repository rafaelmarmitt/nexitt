import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Hook genérico que busca dados de uma tabela do Supabase filtrados pelo user_id atual.
 * Retorna sempre dados reais (array vazio quando não há registros).
 */
export function useSupabaseTable<T>(
  table: "customers" | "products" | "sales" | "appointments" | "expenses" | "taxes",
  _fallback: T[] = [],
  options?: {
    orderBy?: { column: string; ascending?: boolean };
    select?: string;
  }
) {
  const { user } = useAuth();
  const orderByColumn = options?.orderBy?.column;
  const orderByAscending = options?.orderBy?.ascending;
  const select = options?.select;
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    let query = supabase.from(table).select(select ?? "*").eq("user_id", user.id);
    if (orderByColumn) {
      query = query.order(orderByColumn, { ascending: orderByAscending ?? false });
    }

    const { data: rows, error } = await query;
    if (error || !rows) {
      setData([]);
    } else {
      setData(rows as T[]);
    }
    setLoading(false);
  }, [user, table, orderByColumn, orderByAscending, select]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`${table}-rt-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table, filter: `user_id=eq.${user.id}` },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, table, fetchData]);

  return { data, loading, isMock: false, refetch: fetchData };
}

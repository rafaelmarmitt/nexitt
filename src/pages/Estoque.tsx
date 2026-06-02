import { DashboardLayout } from "@/components/DashboardLayout";
import { Seo } from "@/components/Seo";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Box, Plus, AlertTriangle, TrendingDown, Search, Package, Filter } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ListSkeleton, StatCardsSkeleton } from "@/components/skeletons";

import { NewInventoryItemDialog } from "@/components/NewInventoryItemDialog";

interface ItemEstoque {
  nome: string;
  categoria: string;
  estoque: number;
  minimo: number;
  preco: number;
  status: "ok" | "baixo" | "esgotado";
}


const formatBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const computeStatus = (qty: number, min: number): ItemEstoque["status"] => {
  if (qty <= 0) return "esgotado";
  if (qty < min) return "baixo";
  return "ok";
};

export default function Estoque() {
  const { user } = useAuth();
  const [itens, setItens] = useState<ItemEstoque[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setItens([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("products")
      .select("name, category, price, inventory(quantity, min_quantity)")
      .eq("user_id", user.id);
    if (!data) {
      setItens([]);
      setLoading(false);
      return;
    }
    const mapped: ItemEstoque[] = data.map((p: any) => {
      const inv = Array.isArray(p.inventory) ? p.inventory[0] : p.inventory;
      const qty = Number(inv?.quantity ?? 0);
      const min = Number(inv?.min_quantity ?? 0);
      return {
        nome: p.name,
        categoria: p.category || "Outros",
        estoque: qty,
        minimo: min,
        preco: Number(p.price),
        status: computeStatus(qty, min),
      };
    });
    setItens(mapped);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const total = itens.reduce((s, i) => s + i.estoque * i.preco, 0);
  const baixos = itens.filter((i) => i.status !== "ok").length;
  const esgotados = itens.filter((i) => i.status === "esgotado").length;

  return (
    <>
      <Seo title="Estoque · Nexitt" description="Controle de estoque para MEI: monitore quantidades, alertas de mínimo e movimentação de produtos." path="/estoque" />
    <DashboardLayout
      title="Estoque"
      subtitle="Controle do que entra e sai"
      actions={
        <NewInventoryItemDialog
          onCreated={load}
          trigger={
            <Button variant="hero" className="rounded-xl">
              <Plus className="h-4 w-4" /> Adicionar item
            </Button>
          }
        />
      }
    >

      {loading ? (
        <>
          <StatCardsSkeleton />
          <ListSkeleton rows={6} />
        </>
      ) : (
      <>
      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card className="p-5 shadow-card">
          <div className="flex items-center gap-2 mb-1">
            <Package className="h-4 w-4 text-primary" />
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Itens</p>
          </div>
          <p className="text-3xl font-extrabold">{itens.length}</p>
          <p className="text-xs text-muted-foreground">cadastrados</p>
        </Card>
        <Card className="p-5 shadow-card gradient-mesh">
          <div className="flex items-center gap-2 mb-1">
            <Box className="h-4 w-4 text-info" />
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Valor em estoque</p>
          </div>
          <p className="text-3xl font-extrabold text-info">{formatBRL(total)}</p>
          <p className="text-xs text-muted-foreground">total parado</p>
        </Card>
        <Card className="p-5 shadow-card border-warning/30">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="h-4 w-4 text-warning-deep" />
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Estoque baixo</p>
          </div>
          <p className="text-3xl font-extrabold text-warning-deep">{baixos}</p>
          <p className="text-xs text-muted-foreground">precisam reposição</p>
        </Card>
        <Card className="p-5 shadow-card border-destructive/30">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Esgotados</p>
          </div>
          <p className="text-3xl font-extrabold text-destructive">{esgotados}</p>
          <p className="text-xs text-muted-foreground">repor urgente</p>
        </Card>
      </div>

      <Card className="p-4 mb-4 shadow-card flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar item..." className="pl-9 h-10 rounded-xl" />
        </div>
        <Button variant="outline" className="rounded-xl">
          <Filter className="h-4 w-4" /> Categoria
        </Button>
      </Card>

      <Card className="shadow-card overflow-hidden">
        <ul className="divide-y">
          {itens.map((item, i) => {
            const pct = item.minimo > 0 ? Math.min((item.estoque / (item.minimo * 2)) * 100, 100) : 100;
            return (
              <li
                key={i}
                className="flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-4 p-3 sm:p-4 hover:bg-muted/30 transition-smooth animate-fade-in"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="h-12 w-12 rounded-xl bg-primary-soft flex items-center justify-center shrink-0 text-2xl">
                  📦
                </div>
                <div className="flex-1 min-w-0 basis-[60%] sm:basis-auto">
                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                    <p className="font-bold truncate min-w-0">{item.nome}</p>
                    <Badge variant="secondary" className="text-[10px] shrink-0">{item.categoria}</Badge>
                    {item.status === "baixo" && <Badge className="bg-warning-soft text-warning-deep text-[10px] border-0 shrink-0">Baixo</Badge>}
                    {item.status === "esgotado" && <Badge className="bg-destructive-soft text-destructive text-[10px] border-0 shrink-0">Esgotado</Badge>}
                  </div>
                  <Progress value={pct} className="h-1.5 max-w-xs" />
                  <p className="text-xs text-muted-foreground mt-1">
                    <span className="font-semibold text-foreground">{item.estoque}</span> em estoque · mínimo {item.minimo}
                  </p>
                </div>
                <div className="ml-auto text-right shrink-0">
                  <p className="font-extrabold">{formatBRL(item.preco)}</p>
                  <p className="text-[11px] text-muted-foreground">unidade</p>
                </div>
                <Button size="sm" variant="outline" className="rounded-xl shrink-0">
                  Repor
                </Button>
              </li>
            );
          })}
        </ul>
      </Card>
      </>
      )}
    </DashboardLayout>
    </>
  );
}

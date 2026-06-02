import { DashboardLayout } from "@/components/DashboardLayout";
import { Seo } from "@/components/Seo";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Download, Filter, Search, ArrowUpRight, ArrowDownRight, FileText, FileSpreadsheet, Printer } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { toast } from "sonner";
import { useEffect, useMemo, useState, useCallback } from "react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Tx {
  id: string;
  data: Date;
  desc: string;
  cat: string;
  tipo: "entrada" | "saida";
  valor: number;
  cliente: string;
  item: string;
}

const PIE_COLORS = [
  "hsl(172 85% 38%)", "hsl(14 92% 62%)", "hsl(252 85% 65%)",
  "hsl(88 85% 52%)", "hsl(38 95% 58%)", "hsl(199 89% 48%)", "hsl(320 75% 55%)",
];

const formatBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const escapeCSV = (value: string) => `"${value.replace(/"/g, '""')}"`;
const escapeHTML = (value: string) => value.replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char] ?? char));
const toISODate = (d: Date) => d.toISOString().slice(0, 10);
const firstOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const lastOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0);

const Relatorios = () => {
  const { user } = useAuth();
  const today = new Date();
  const [dateFrom, setDateFrom] = useState(toISODate(firstOfMonth(today)));
  const [dateTo, setDateTo] = useState(toISODate(lastOfMonth(today)));
  const [categoria, setCategoria] = useState("all");
  const [tipo, setTipo] = useState<"all" | "entrada" | "saida">("all");
  const [busca, setBusca] = useState("");

  const [transacoes, setTransacoes] = useState<Tx[]>([]);
  const [txAnterior, setTxAnterior] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const fromISO = new Date(dateFrom + "T00:00:00").toISOString();
    const toISO = new Date(dateTo + "T23:59:59").toISOString();

    // Período anterior de mesmo tamanho
    const diffMs = new Date(dateTo).getTime() - new Date(dateFrom).getTime();
    const prevTo = new Date(new Date(dateFrom).getTime() - 86400000);
    const prevFrom = new Date(prevTo.getTime() - diffMs);

    const [sales, expenses, salesPrev, expensesPrev] = await Promise.all([
      supabase.from("sales")
        .select("id, sold_at, total, notes, status, customers(name), sale_items(product_name, quantity)")
        .eq("user_id", user.id).gte("sold_at", fromISO).lte("sold_at", toISO)
        .order("sold_at", { ascending: false }),
      supabase.from("expenses")
        .select("id, expense_date, description, category, amount")
        .eq("user_id", user.id).gte("expense_date", dateFrom).lte("expense_date", dateTo)
        .order("expense_date", { ascending: false }),
      supabase.from("sales")
        .select("total, status")
        .eq("user_id", user.id)
        .gte("sold_at", prevFrom.toISOString()).lte("sold_at", prevTo.toISOString()),
      supabase.from("expenses")
        .select("amount, category, expense_date")
        .eq("user_id", user.id)
        .gte("expense_date", toISODate(prevFrom)).lte("expense_date", toISODate(prevTo)),
    ]);

    const txs: Tx[] = [];
    (sales.data || []).forEach((s: any) => {
      if (s.status === "cancelada") return;
      const saleItems = Array.isArray(s.sale_items) ? s.sale_items : [];
      const item = saleItems.length
        ? saleItems.map((i: any) => `${i.product_name}${Number(i.quantity || 0) > 1 ? ` x${i.quantity}` : ""}`).join(", ")
        : s.notes || "Venda";
      txs.push({
        id: `s-${s.id}`,
        data: new Date(s.sold_at),
        desc: s.notes || "Venda",
        cat: "Vendas",
        tipo: "entrada",
        valor: Number(s.total),
        cliente: s.customers?.name || "-",
        item,
      });
    });
    (expenses.data || []).forEach((e: any) => {
      txs.push({
        id: `e-${e.id}`,
        data: new Date(e.expense_date),
        desc: e.description,
        cat: e.category || "Outros",
        tipo: "saida",
        valor: Number(e.amount),
        cliente: "-",
        item: e.description,
      });
    });
    txs.sort((a, b) => b.data.getTime() - a.data.getTime());
    setTransacoes(txs);

    const prev: Tx[] = [];
    (salesPrev.data || []).forEach((s: any) => {
      if (s.status === "cancelada") return;
      prev.push({ id: "", data: prevFrom, desc: "", cat: "Vendas", tipo: "entrada", valor: Number(s.total), cliente: "", item: "" });
    });
    (expensesPrev.data || []).forEach((e: any) => {
      prev.push({ id: "", data: new Date(e.expense_date), desc: "", cat: e.category || "Outros", tipo: "saida", valor: Number(e.amount), cliente: "", item: "" });
    });
    setTxAnterior(prev);
    setLoading(false);
  }, [user, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`relatorios-rt-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "sales", filter: `user_id=eq.${user.id}` }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "expenses", filter: `user_id=eq.${user.id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, load]);

  const categorias = useMemo(() => {
    const set = new Set<string>();
    transacoes.forEach(t => set.add(t.cat));
    return Array.from(set).sort();
  }, [transacoes]);

  const filtradas = useMemo(() => transacoes.filter(t => {
    if (tipo !== "all" && t.tipo !== tipo) return false;
    if (categoria !== "all" && t.cat !== categoria) return false;
    if (busca) {
      const q = busca.toLowerCase();
      if (!t.desc.toLowerCase().includes(q) && !t.item.toLowerCase().includes(q) && !t.cliente.toLowerCase().includes(q) && !t.cat.toLowerCase().includes(q)) return false;
    }
    return true;
  }), [transacoes, tipo, categoria, busca]);

  const totalEntradas = filtradas.filter(t => t.tipo === "entrada").reduce((s, t) => s + t.valor, 0);
  const totalSaidas = filtradas.filter(t => t.tipo === "saida").reduce((s, t) => s + t.valor, 0);

  const distribuicao = useMemo(() => {
    const m = new Map<string, number>();
    filtradas.filter(t => t.tipo === "saida").forEach(t => m.set(t.cat, (m.get(t.cat) || 0) + t.valor));
    return Array.from(m.entries())
      .map(([name, value], i) => ({ name, value, color: PIE_COLORS[i % PIE_COLORS.length] }))
      .sort((a, b) => b.value - a.value);
  }, [filtradas]);

  const totalDespesas = distribuicao.reduce((s, d) => s + d.value, 0);

  const entradasAnt = txAnterior.filter(t => t.tipo === "entrada").reduce((s, t) => s + t.valor, 0);
  const saidasAnt = txAnterior.filter(t => t.tipo === "saida").reduce((s, t) => s + t.valor, 0);
  const comparativo = [
    { cat: "Entradas", anterior: entradasAnt, atual: totalEntradas },
    { cat: "Saídas", anterior: saidasAnt, atual: totalSaidas },
    { cat: "Lucro", anterior: entradasAnt - saidasAnt, atual: totalEntradas - totalSaidas },
  ];

  const downloadCSV = () => {
    const header = ["Data", "Descricao", "Item vendido/gasto", "Cliente/Fornecedor", "Categoria", "Tipo", "Valor"];
    const rows = filtradas.map(t => [
      t.data.toLocaleDateString("pt-BR"),
      escapeCSV(t.desc),
      escapeCSV(t.item),
      escapeCSV(t.cliente),
      t.cat,
      t.tipo,
      t.valor.toFixed(2).replace(".", ","),
    ]);
    const csv = "\ufeff" + [header.join(";"), ...rows.map(r => r.join(";"))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `relatorio-${dateFrom}_a_${dateTo}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado");
  };

  const printPDF = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    const rows = filtradas.map(t => `<tr>
      <td>${t.data.toLocaleDateString("pt-BR")}</td>
      <td>${escapeHTML(t.desc)}</td>
      <td>${escapeHTML(t.item)}</td>
      <td>${escapeHTML(t.cliente)}</td>
      <td>${escapeHTML(t.cat)}</td>
      <td style="text-align:right;color:${t.tipo === "entrada" ? "#0a7b3e" : "#b91c1c"}">
        ${t.tipo === "entrada" ? "+" : "-"}${formatBRL(t.valor)}
      </td></tr>`).join("");
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Relatorio</title>
      <style>body{font-family:system-ui,sans-serif;padding:24px;color:#111}
      h1{margin:0 0 4px}.muted{color:#666;font-size:12px}
      table{width:100%;border-collapse:collapse;margin-top:16px;font-size:12px}
      th,td{border-bottom:1px solid #ddd;padding:8px;text-align:left}
      th{background:#f5f5f5}</style></head><body>
      <h1>Relatorio Financeiro</h1>
      <p class="muted">Periodo: ${new Date(dateFrom).toLocaleDateString("pt-BR")} - ${new Date(dateTo).toLocaleDateString("pt-BR")}</p>
      <p><strong>Entradas:</strong> ${formatBRL(totalEntradas)} &nbsp; <strong>Saidas:</strong> ${formatBRL(totalSaidas)} &nbsp; <strong>Saldo:</strong> ${formatBRL(totalEntradas - totalSaidas)}</p>
      <table><thead><tr><th>Data</th><th>Descricao</th><th>Item vendido/gasto</th><th>Cliente</th><th>Categoria</th><th style="text-align:right">Valor</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="6">Sem dados</td></tr>'}</tbody></table>
      <script>window.onload=()=>setTimeout(()=>window.print(),300)</script>
      </body></html>`);
    w.document.close();
    toast.success("PDF pronto para impressao");
  };

  const resetFiltros = () => {
    setDateFrom(toISODate(firstOfMonth(today)));
    setDateTo(toISODate(lastOfMonth(today)));
    setCategoria("all"); setTipo("all"); setBusca("");
  };

  return (
    <>
      <Seo title="Relatórios financeiros · Nexitt" description="Relatórios mensais prontos para o contador: receitas, despesas, lucro e comparativos do seu MEI." path="/relatorios" />
    <DashboardLayout
      title="Relatórios Financeiros"
      subtitle="Análise detalhada das suas transações"
      actions={
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="success" className="rounded-xl">
              <Download className="h-4 w-4" /> Exportar
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={downloadCSV}>
              <FileSpreadsheet className="h-4 w-4 mr-2" /> CSV (Excel)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={printPDF}>
              <Printer className="h-4 w-4 mr-2" /> PDF / Imprimir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      }
    >
      {/* Resumo */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card className="p-5 shadow-card border-success/20 bg-success-soft/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase text-success-deep tracking-wider">Entradas</p>
              <p className="text-2xl font-extrabold text-success-deep mt-1">{formatBRL(totalEntradas)}</p>
            </div>
            <div className="h-12 w-12 rounded-2xl gradient-success flex items-center justify-center shadow-success">
              <ArrowUpRight className="h-5 w-5 text-success-foreground" />
            </div>
          </div>
        </Card>
        <Card className="p-5 shadow-card border-destructive/20 bg-destructive-soft/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase text-destructive tracking-wider">Saídas</p>
              <p className="text-2xl font-extrabold text-destructive mt-1">{formatBRL(totalSaidas)}</p>
            </div>
            <div className="h-12 w-12 rounded-2xl gradient-coral flex items-center justify-center shadow-coral">
              <ArrowDownRight className="h-5 w-5 text-primary-foreground" />
            </div>
          </div>
        </Card>
        <Card className="p-5 shadow-card border-primary/20 gradient-primary text-primary-foreground">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider opacity-90">Saldo</p>
              <p className="text-2xl font-extrabold mt-1">{formatBRL(totalEntradas - totalSaidas)}</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <FileText className="h-5 w-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="p-5 shadow-card mb-5">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-bold">Filtros</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-5">
          <div className="space-y-2">
            <Label htmlFor="de">De</Label>
            <Input id="de" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ate">Até</Label>
            <Input id="ate" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select value={categoria} onValueChange={setCategoria}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {categorias.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as typeof tipo)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="entrada">Entradas</SelectItem>
                <SelectItem value="saida">Saídas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="invisible">Reset</Label>
            <Button variant="outline" className="w-full" onClick={resetFiltros}>
              Limpar filtros
            </Button>
          </div>
        </div>
      </Card>

      {/* Gráficos */}
      <div className="grid gap-5 lg:grid-cols-5 mb-5">
        <Card className="p-5 shadow-card lg:col-span-2">
          <h2 className="text-base font-bold mb-1">Distribuição de Gastos</h2>
          <p className="text-xs text-muted-foreground mb-4">Total {formatBRL(totalDespesas)}</p>
          <div className="h-72">
            {distribuicao.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Sem despesas no período</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={distribuicao} cx="50%" cy="50%" innerRadius={55} outerRadius={95}
                    paddingAngle={3} dataKey="value" stroke="hsl(var(--card))" strokeWidth={3}>
                    {distribuicao.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", boxShadow: "var(--shadow-card)" }}
                    formatter={(v: number) => formatBRL(v)}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card className="p-5 shadow-card lg:col-span-3">
          <h2 className="text-base font-bold mb-1">Comparativo com período anterior</h2>
          <p className="text-xs text-muted-foreground mb-4">Mesma janela de dias imediatamente anterior</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparativo} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="cat" fontSize={11} stroke="hsl(var(--muted-foreground))" />
                <YAxis fontSize={11} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px" }}
                  formatter={(v: number) => formatBRL(v)}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="anterior" name="Período anterior" fill="hsl(var(--muted-foreground))" radius={[6, 6, 0, 0]} maxBarSize={40} />
                <Bar dataKey="atual" name="Período atual" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Tabela */}
      <Card className="p-5 shadow-card">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h2 className="text-base font-bold">Transações</h2>
            <p className="text-xs text-muted-foreground">{filtradas.length} registros{loading ? " · carregando…" : ""}</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar transação, cliente ou categoria..." className="pl-9" />
          </div>
        </div>
        <div className="overflow-x-auto rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="font-bold">Data</TableHead>
                <TableHead className="font-bold">Descrição</TableHead>
                <TableHead className="font-bold">Item vendido/gasto</TableHead>
                <TableHead className="font-bold">Cliente/Fornecedor</TableHead>
                <TableHead className="font-bold">Categoria</TableHead>
                <TableHead className="font-bold text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={`sk-${i}`}>
                    {Array.from({ length: 6 }).map((_, c) => (
                      <TableCell key={c}><div className="h-4 w-full rounded bg-muted animate-pulse" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <>
                  {filtradas.map((t) => (
                    <TableRow key={t.id} className="hover:bg-muted/30 transition-smooth">
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{t.data.toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell className="font-semibold">{t.desc}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{t.item}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{t.cliente}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-muted text-foreground border-0">{t.cat}</Badge>
                      </TableCell>
                      <TableCell className={`text-right font-extrabold ${t.tipo === "entrada" ? "text-success-deep" : "text-destructive"}`}>
                        {t.tipo === "entrada" ? "+" : "-"}{formatBRL(t.valor)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtradas.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                        Nenhuma transação encontrada
                      </TableCell>
                    </TableRow>
                  )}
                </>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </DashboardLayout>
    </>
  );
};

export default Relatorios;

import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp, TrendingDown, Wallet, AlertCircle, MessageCircle,
  ArrowUpRight, ArrowDownRight, Plus, Download, Sparkles,
  Trophy, Target, Zap, Calendar
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  CartesianGrid, XAxis, YAxis, Tooltip, Legend
} from "recharts";
import { Link } from "react-router-dom";

const fluxoCaixa = [
  { mes: "Jan", entradas: 4200, saidas: 2100 },
  { mes: "Fev", entradas: 3800, saidas: 2400 },
  { mes: "Mar", entradas: 5200, saidas: 2800 },
  { mes: "Abr", entradas: 4900, saidas: 2200 },
  { mes: "Mai", entradas: 6100, saidas: 3100 },
  { mes: "Jun", entradas: 7300, saidas: 3400 },
];

const semana = [
  { dia: "Seg", vendas: 320 },
  { dia: "Ter", vendas: 480 },
  { dia: "Qua", vendas: 290 },
  { dia: "Qui", vendas: 620 },
  { dia: "Sex", vendas: 890 },
  { dia: "Sáb", vendas: 1240 },
  { dia: "Dom", vendas: 740 },
];

const atividades = [
  { tipo: "entrada", desc: "Venda de Bolo Decorado", cliente: "Maria S.", valor: 180, hora: "Há 5 min", emoji: "🎂" },
  { tipo: "saida", desc: "Compra de Insumos", cliente: "Fornecedor A", valor: 320, hora: "Há 1h", emoji: "🛒" },
  { tipo: "entrada", desc: "Pagamento Doces Festa", cliente: "João P.", valor: 450, hora: "Há 3h", emoji: "🍰" },
  { tipo: "saida", desc: "Conta de Energia", cliente: "Despesa Fixa", valor: 145, hora: "Ontem", emoji: "⚡" },
  { tipo: "entrada", desc: "Encomenda Brigadeiros", cliente: "Ana L.", valor: 90, hora: "Ontem", emoji: "🍫" },
];

const topProdutos = [
  { nome: "Bolo Decorado", vendas: 28, total: 5040, cor: "bg-primary" },
  { nome: "Brigadeiros (cento)", vendas: 19, total: 1710, cor: "bg-success" },
  { nome: "Kit Festa", vendas: 6, total: 2700, cor: "bg-coral" },
  { nome: "Doce de Leite", vendas: 12, total: 720, cor: "bg-info" },
];

const formatBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const Index = () => {
  const hora = new Date().getHours();
  const saudacao = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";
  const metaMensal = 8000;
  const atualMensal = 7300;
  const pctMeta = Math.round((atualMensal / metaMensal) * 100);

  return (
    <DashboardLayout
      title={`${saudacao}, Maria! 👋`}
      subtitle="Aqui está o resumo do seu negócio em tempo real"
      actions={
        <>
          <Button variant="outline" className="rounded-xl">
            <Download className="h-4 w-4" /> Exportar
          </Button>
          <Button variant="hero" className="rounded-xl">
            <Plus className="h-4 w-4" /> Nova venda
          </Button>
        </>
      }
    >
      {/* KPIs */}
      <div className="grid gap-4 md:gap-5 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        <StatCard label="Faturamento Mensal" value={formatBRL(7300)} trend={19.7} hint="vs mês anterior" icon={TrendingUp} tone="primary" accent />
        <StatCard label="Total de Despesas" value={formatBRL(3400)} trend={9.7} hint="vs mês anterior" icon={TrendingDown} tone="destructive" />
        <StatCard label="Lucro Líquido" value={formatBRL(3900)} trend={28.5} hint="margem 53%" icon={Wallet} tone="success" />
        <StatCard label="DAS deste mês" value={formatBRL(75.9)} hint="vence em 12 dias" icon={AlertCircle} tone="warning" />
      </div>

      {/* Meta + Streak */}
      <div className="grid gap-5 lg:grid-cols-3 mb-6">
        <Card className="p-6 shadow-card lg:col-span-2 relative overflow-hidden border-primary/20 gradient-mesh">
          <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-primary/10 blur-3xl animate-blob" />
          <div className="relative">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Target className="h-4 w-4 text-primary" />
                  <p className="text-xs font-bold uppercase tracking-wider text-primary">Meta de Junho</p>
                </div>
                <p className="text-3xl md:text-4xl font-extrabold text-foreground">
                  {formatBRL(atualMensal)} <span className="text-lg font-medium text-muted-foreground">/ {formatBRL(metaMensal)}</span>
                </p>
              </div>
              <Badge className="gradient-success text-success-foreground border-0 font-bold shadow-success">
                {pctMeta}% 🚀
              </Badge>
            </div>
            <Progress value={pctMeta} className="h-3 mb-3" />
            <p className="text-sm text-muted-foreground">
              Faltam <span className="font-bold text-foreground">{formatBRL(metaMensal - atualMensal)}</span> para bater a meta — você está num ritmo ótimo!
            </p>
          </div>
        </Card>

        <Card className="p-6 shadow-card relative overflow-hidden gradient-coral text-primary-foreground border-0">
          <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl animate-blob" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="h-5 w-5" />
              <p className="text-xs font-bold uppercase tracking-wider">Sequência atual</p>
            </div>
            <p className="text-4xl font-extrabold">12 dias 🔥</p>
            <p className="text-sm text-primary-foreground/85 mt-1 mb-4">registrando vendas no bot</p>
            <div className="flex gap-1">
              {[...Array(7)].map((_, i) => (
                <div key={i} className={`h-2 flex-1 rounded-full ${i < 5 ? "bg-white" : "bg-white/30"}`} />
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid gap-5 lg:grid-cols-3 mb-6">
        <Card className="p-5 lg:col-span-2 shadow-card">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div>
              <h2 className="text-base font-bold text-foreground">Fluxo de Caixa</h2>
              <p className="text-xs text-muted-foreground">Entradas vs Saídas — últimos 6 meses</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-primary-soft text-primary border-0">Semestre</Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-muted">Ano</Badge>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={fluxoCaixa} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="cEntradas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="cSaidas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--coral))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--coral))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `R$${v / 1000}k`} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                    boxShadow: "var(--shadow-card)",
                  }}
                  formatter={(value: number) => formatBRL(value)}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="entradas" name="Entradas" stroke="hsl(var(--primary))" strokeWidth={3} fill="url(#cEntradas)" />
                <Area type="monotone" dataKey="saidas" name="Saídas" stroke="hsl(var(--coral))" strokeWidth={3} fill="url(#cSaidas)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5 shadow-card">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="h-4 w-4 text-info" />
            <h2 className="text-base font-bold text-foreground">Vendas da semana</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-4">Total: <span className="font-bold text-foreground">{formatBRL(4580)}</span></p>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={semana} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="cBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={1} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.9} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="dia" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => `${v}`} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px" }}
                  formatter={(v: number) => formatBRL(v)}
                />
                <Bar dataKey="vendas" fill="url(#cBar)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Atividades + Top produtos */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="p-5 shadow-card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-whatsapp-soft flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-whatsapp" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">Atividades Recentes</h2>
                <p className="text-xs text-muted-foreground">Direto do seu WhatsApp</p>
              </div>
            </div>
            <Badge className="bg-success-soft text-success-deep border-0">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse mr-1.5" />
              ao vivo
            </Badge>
          </div>
          <ul className="space-y-2">
            {atividades.map((a, i) => (
              <li
                key={i}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-smooth animate-fade-in cursor-pointer group"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="text-2xl shrink-0">{a.emoji}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-smooth">{a.desc}</p>
                  <p className="text-xs text-muted-foreground truncate">{a.cliente} · {a.hora}</p>
                </div>
                <span className={`text-sm font-bold shrink-0 ${a.tipo === "entrada" ? "text-success-deep" : "text-destructive"}`}>
                  {a.tipo === "entrada" ? "+" : "-"}{formatBRL(a.valor)}
                </span>
                <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${a.tipo === "entrada" ? "bg-success-soft text-success-deep" : "bg-destructive-soft text-destructive"}`}>
                  {a.tipo === "entrada" ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                </div>
              </li>
            ))}
          </ul>
          <Button variant="ghost" className="w-full mt-3 text-primary hover:bg-primary-soft" asChild>
            <Link to="/relatorios">Ver todas as transações →</Link>
          </Button>
        </Card>

        <Card className="p-5 shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-4 w-4 text-warning" />
            <h2 className="text-base font-bold text-foreground">Top Produtos</h2>
          </div>
          <ul className="space-y-4">
            {topProdutos.map((p, i) => {
              const max = Math.max(...topProdutos.map((x) => x.total));
              const pct = (p.total / max) * 100;
              return (
                <li key={i} className="space-y-1.5 animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="font-semibold text-foreground truncate">{p.nome}</span>
                    <span className="font-bold text-primary shrink-0">{formatBRL(p.total)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full ${p.cor} rounded-full transition-all duration-700`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">{p.vendas} vendas no mês</p>
                </li>
              );
            })}
          </ul>
          <div className="mt-5 p-3 rounded-xl bg-info-soft border border-info/20">
            <div className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-info mt-0.5 shrink-0" />
              <p className="text-xs text-foreground">
                <span className="font-bold">Dica IA:</span> seus brigadeiros vendem mais aos finais de semana. Que tal criar um combo?
              </p>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Index;

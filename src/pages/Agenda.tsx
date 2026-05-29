import { DashboardLayout } from "@/components/DashboardLayout";
import { Seo } from "@/components/Seo";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  User,
  Phone,
  CheckCircle2,
  MoreVertical,
  Pencil,
  Trash2,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { BUSINESS_CONFIGS } from "@/lib/businessTypes";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Status = "pendente" | "confirmado" | "concluido" | "cancelado";

interface Appointment {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  service_name: string;
  status: Status;
  price: number;
  notes: string | null;
  customer_id: string | null;
  product_id: string | null;
  customers?: { name: string | null; phone: string | null } | null;
}

interface Customer { id: string; name: string; phone: string | null }
interface Product { id: string; name: string; price: number }

const semanaLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const formatBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDur = (min: number) =>
  min >= 60 ? `${Math.floor(min / 60)}h${min % 60 ? (min % 60) + "min" : ""}` : `${min}min`;

const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
const endOfDay = (d: Date) => { const x = new Date(d); x.setHours(23,59,59,999); return x; };
const startOfWeek = (d: Date) => {
  const x = startOfDay(d);
  const day = x.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day; // start Monday
  x.setDate(x.getDate() + diff);
  return x;
};
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const toLocalInput = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const statusBadge = (s: Status) => {
  switch (s) {
    case "confirmado": return "bg-success-soft text-success-deep";
    case "concluido": return "bg-primary/15 text-primary";
    case "cancelado": return "bg-destructive/15 text-destructive";
    default: return "bg-warning-soft text-warning-deep";
  }
};

interface FormState {
  id?: string;
  scheduled_at: string;
  duration_minutes: number;
  service_name: string;
  status: Status;
  price: number;
  notes: string;
  customer_id: string;
  product_id: string;
}

const emptyForm = (date: Date): FormState => {
  const d = new Date(date); d.setHours(9, 0, 0, 0);
  return {
    scheduled_at: toLocalInput(d),
    duration_minutes: 60,
    service_name: "",
    status: "pendente",
    price: 0,
    notes: "",
    customer_id: "",
    product_id: "",
  };
};

export default function Agenda() {
  const { profile, user } = useAuth();
  const config = profile?.business_type ? BUSINESS_CONFIGS[profile.business_type] : null;

  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  const [weekStart, setWeekStart] = useState<Date>(startOfWeek(new Date()));
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [weekCounts, setWeekCounts] = useState<number[]>([0,0,0,0,0,0,0]);
  const [loading, setLoading] = useState(true);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm(new Date()));
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchDay = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("appointments")
      .select("id, scheduled_at, duration_minutes, service_name, status, price, notes, customer_id, product_id, customers(name, phone)")
      .eq("user_id", user.id)
      .gte("scheduled_at", startOfDay(selectedDate).toISOString())
      .lte("scheduled_at", endOfDay(selectedDate).toISOString())
      .order("scheduled_at", { ascending: true });
    if (error) toast.error("Erro ao carregar agendamentos");
    setAppointments((data as Appointment[]) || []);
    setLoading(false);
  }, [user, selectedDate]);

  const fetchWeekCounts = useCallback(async () => {
    if (!user) return;
    const start = weekStart;
    const end = endOfDay(addDays(weekStart, 6));
    const { data } = await supabase
      .from("appointments")
      .select("scheduled_at")
      .eq("user_id", user.id)
      .gte("scheduled_at", start.toISOString())
      .lte("scheduled_at", end.toISOString());
    const counts = [0,0,0,0,0,0,0];
    (data || []).forEach((r: any) => {
      const idx = Math.floor((new Date(r.scheduled_at).getTime() - start.getTime()) / 86400000);
      if (idx >= 0 && idx < 7) counts[idx]++;
    });
    setWeekCounts(counts);
  }, [user, weekStart]);

  const fetchLookups = useCallback(async () => {
    if (!user) return;
    const [c, p] = await Promise.all([
      supabase.from("customers").select("id, name, phone").eq("user_id", user.id).order("name"),
      supabase.from("products").select("id, name, price").eq("user_id", user.id).eq("active", true).order("name"),
    ]);
    setCustomers((c.data as Customer[]) || []);
    setProducts((p.data as Product[]) || []);
  }, [user]);

  useEffect(() => { fetchDay(); }, [fetchDay]);
  useEffect(() => { fetchWeekCounts(); }, [fetchWeekCounts]);
  useEffect(() => { fetchLookups(); }, [fetchLookups]);

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`appointments-rt-${user.id}`)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "appointments", filter: `user_id=eq.${user.id}` },
        () => { fetchDay(); fetchWeekCounts(); })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, fetchDay, fetchWeekCounts]);

  const openNew = () => {
    setForm(emptyForm(selectedDate));
    setDialogOpen(true);
  };

  const openEdit = (a: Appointment) => {
    setForm({
      id: a.id,
      scheduled_at: toLocalInput(new Date(a.scheduled_at)),
      duration_minutes: a.duration_minutes,
      service_name: a.service_name,
      status: a.status,
      price: Number(a.price || 0),
      notes: a.notes || "",
      customer_id: a.customer_id || "",
      product_id: a.product_id || "",
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!user) return;
    if (!form.service_name.trim()) return toast.error("Informe o serviço");
    if (!form.scheduled_at) return toast.error("Informe data e hora");
    setSaving(true);
    const payload = {
      user_id: user.id,
      scheduled_at: new Date(form.scheduled_at).toISOString(),
      duration_minutes: Number(form.duration_minutes) || 60,
      service_name: form.service_name.trim(),
      status: form.status,
      price: Number(form.price) || 0,
      notes: form.notes.trim() || null,
      customer_id: form.customer_id || null,
      product_id: form.product_id || null,
    };
    const res = form.id
      ? await supabase.from("appointments").update(payload).eq("id", form.id)
      : await supabase.from("appointments").insert(payload);
    setSaving(false);
    if (res.error) return toast.error("Erro ao salvar: " + res.error.message);
    toast.success(form.id ? "Agendamento atualizado" : "Agendamento criado");
    setDialogOpen(false);
    fetchDay(); fetchWeekCounts();
  };

  const remove = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("appointments").delete().eq("id", deleteId);
    if (error) toast.error("Erro ao excluir");
    else toast.success("Agendamento excluído");
    setDeleteId(null);
    fetchDay(); fetchWeekCounts();
  };

  const setStatus = async (id: string, status: Status) => {
    const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
    if (error) toast.error("Erro ao atualizar");
    else toast.success("Status atualizado");
  };

  const totalDia = useMemo(
    () => appointments.filter(a => a.status !== "cancelado").reduce((s, a) => s + Number(a.price || 0), 0),
    [appointments]
  );
  const totalMin = useMemo(
    () => appointments.filter(a => a.status !== "cancelado").reduce((s, a) => s + (a.duration_minutes || 0), 0),
    [appointments]
  );

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

  const onProductChange = (id: string) => {
    const p = products.find(x => x.id === id);
    setForm(f => ({
      ...f,
      product_id: id,
      service_name: f.service_name || (p?.name ?? ""),
      price: f.price || Number(p?.price ?? 0),
    }));
  };

  return (
    <>
      <Seo title="Agenda · Nexitt" description="Organize compromissos, atendimentos e lembretes do seu MEI em um único lugar integrado ao WhatsApp." path="/agenda" />
      <DashboardLayout
        title="Agenda"
        subtitle={config ? `Seus atendimentos de ${config.label.toLowerCase()}` : "Seus atendimentos"}
        actions={
          <Button variant="hero" className="rounded-xl" onClick={openNew}>
            <Plus className="h-4 w-4" /> Novo agendamento
          </Button>
        }
      >
        <div className="grid gap-4 sm:grid-cols-3 mb-6">
          <Card className="p-5 shadow-card">
            <div className="flex items-center gap-2 mb-1">
              <CalendarIcon className="h-4 w-4 text-primary" />
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Dia selecionado</p>
            </div>
            <p className="text-3xl font-extrabold">{appointments.length}</p>
            <p className="text-xs text-muted-foreground">atendimentos</p>
          </Card>
          <Card className="p-5 shadow-card">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-info" />
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tempo ocupado</p>
            </div>
            <p className="text-3xl font-extrabold">{fmtDur(totalMin)}</p>
            <p className="text-xs text-muted-foreground">somando serviços ativos</p>
          </Card>
          <Card className="p-5 shadow-card">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-4 w-4 text-success-deep" />
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Receita prevista</p>
            </div>
            <p className="text-3xl font-extrabold text-success-deep">{formatBRL(totalDia)}</p>
            <p className="text-xs text-muted-foreground">desconsidera cancelados</p>
          </Card>
        </div>

        <Card className="p-4 mb-6 shadow-card overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <Button size="sm" variant="ghost" onClick={() => setWeekStart(addDays(weekStart, -7))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <p className="text-sm font-bold">
              {weekStart.toLocaleDateString("pt-BR", { day: "numeric", month: "short" })} –{" "}
              {addDays(weekStart, 6).toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" })}
            </p>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={() => { const t = startOfDay(new Date()); setWeekStart(startOfWeek(t)); setSelectedDate(t); }}>
                Hoje
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setWeekStart(addDays(weekStart, 7))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 sm:gap-2 -mx-1 sm:mx-0">
            {weekDays.map((d, i) => {
              const ativo = sameDay(d, selectedDate);
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(d)}
                  className={`min-w-0 p-2 sm:p-3 rounded-xl text-center transition-bounce ${
                    ativo ? "gradient-primary text-primary-foreground shadow-glow" : "hover:bg-muted"
                  }`}
                >
                  <p className="text-[10px] font-bold uppercase opacity-80">{semanaLabels[d.getDay()]}</p>
                  <p className="text-lg sm:text-xl font-extrabold mt-1">{d.getDate()}</p>
                  <p className={`text-[9px] sm:text-[10px] mt-1 ${ativo ? "opacity-90" : "text-muted-foreground"}`}>
                    {weekCounts[i]} <span className="hidden sm:inline">agend.</span>
                  </p>
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="p-5 shadow-card">
          <h2 className="text-base font-bold mb-4">
            {selectedDate.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
          </h2>
          {loading ? (
            <p className="text-sm text-muted-foreground py-10 text-center">Carregando…</p>
          ) : appointments.length === 0 ? (
            <div className="text-center py-10">
              <CalendarIcon className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">Nenhum agendamento para este dia</p>
              <Button variant="hero" onClick={openNew}><Plus className="h-4 w-4" /> Criar agendamento</Button>
            </div>
          ) : (
            <ul className="space-y-3">
              {appointments.map((a, i) => (
                <li
                  key={a.id}
                  className="flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl border-2 border-border hover:border-primary/40 hover-lift transition-bounce animate-fade-in"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="text-center shrink-0">
                    <p className="text-xl font-extrabold text-primary">
                      {new Date(a.scheduled_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-medium">{fmtDur(a.duration_minutes || 60)}</p>
                  </div>
                  <div className="hidden sm:block h-12 w-px bg-border" />
                  <div className="flex-1 min-w-0 basis-[60%] sm:basis-auto">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <p className="font-bold truncate min-w-0">{a.customers?.name || "Cliente avulso"}</p>
                      <Badge className={`text-[10px] border-0 shrink-0 ${statusBadge(a.status)}`}>{a.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{a.service_name}</p>
                    {a.customers?.phone && (
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Phone className="h-3 w-3 shrink-0" /> {a.customers.phone}
                      </p>
                    )}
                  </div>
                  <div className="ml-auto sm:ml-0 text-right shrink-0 flex items-center gap-2">
                    <div>
                      <p className="font-extrabold text-success-deep">{formatBRL(Number(a.price || 0))}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(a)}><Pencil className="h-4 w-4 mr-2" /> Editar</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setStatus(a.id, "confirmado")}>Marcar confirmado</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setStatus(a.id, "concluido")}>Marcar concluído</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setStatus(a.id, "cancelado")}>
                          <XCircle className="h-4 w-4 mr-2" /> Cancelar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setDeleteId(a.id)} className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{form.id ? "Editar agendamento" : "Novo agendamento"}</DialogTitle>
              <DialogDescription>Preencha os dados do atendimento.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Data e hora</Label>
                  <Input type="datetime-local" value={form.scheduled_at}
                    onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} />
                </div>
                <div>
                  <Label>Duração (min)</Label>
                  <Input type="number" min={5} step={5} value={form.duration_minutes}
                    onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })} />
                </div>
              </div>

              <div>
                <Label>Cliente</Label>
                <Select value={form.customer_id || "none"} onValueChange={(v) => setForm({ ...form, customer_id: v === "none" ? "" : v })}>
                  <SelectTrigger><SelectValue placeholder="Selecionar cliente" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem cliente</SelectItem>
                    {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Serviço / produto</Label>
                <Select value={form.product_id || "none"} onValueChange={(v) => v === "none" ? setForm({ ...form, product_id: "" }) : onProductChange(v)}>
                  <SelectTrigger><SelectValue placeholder="Selecionar do catálogo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Personalizado</SelectItem>
                    {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Descrição do serviço</Label>
                <Input value={form.service_name} onChange={(e) => setForm({ ...form, service_name: e.target.value })} placeholder="Ex: Manicure + Pedicure" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Valor (R$)</Label>
                  <Input type="number" min={0} step="0.01" value={form.price}
                    onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as Status })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="confirmado">Confirmado</SelectItem>
                      <SelectItem value="concluido">Concluído</SelectItem>
                      <SelectItem value="cancelado">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Observações</Label>
                <Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button variant="hero" onClick={save} disabled={saving}>{saving ? "Salvando…" : "Salvar"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir agendamento?</AlertDialogTitle>
              <AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={remove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DashboardLayout>
    </>
  );
}

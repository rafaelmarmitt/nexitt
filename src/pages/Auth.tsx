import { useState, useEffect } from "react";
import { Seo } from "@/components/Seo";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Mail, Lock, User, Sparkles, Eye, EyeOff, ArrowRight, CheckCircle2 } from "lucide-react";
import mascot from "@/assets/mascot.png";
import { normalizeBrPhone } from "@/lib/phone";

export default function Auth() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<"login" | "signup">("signup");
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (!authLoading && user) {
      if (profile && !profile.onboarding_completed) navigate("/onboarding", { replace: true });
      else navigate("/dashboard", { replace: true });
    }
  }, [user, profile, authLoading, navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }
    const normalizedPhone = normalizeBrPhone(phone);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: { full_name: fullName, phone: normalizedPhone },
        },
      });
      if (error) {
        if (error.message.includes("already registered")) {
          toast.error("Este e-mail já está cadastrado. Faça login.");
          setTab("login");
        } else {
          toast.error(error.message);
        }
        return;
      }
      toast.success("Conta criada! Vamos configurar seu negócio.");
    } catch (err) {
      toast.error("Erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error(error.message.includes("Invalid") ? "E-mail ou senha incorretos." : error.message);
        return;
      }
      toast.success("Bem-vindo de volta!");
    } catch {
      toast.error("Erro ao entrar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Seo title="Entrar ou criar conta · Nexitt" description="Acesse sua conta Nexitt ou crie uma grátis em 30 segundos. Gerencie seu MEI direto pelo WhatsApp." path="/auth" />
    <div className="min-h-screen flex relative overflow-hidden bg-background">
      {/* Decorative blobs */}
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full gradient-primary opacity-20 blur-3xl animate-blob" />
      <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-success/40 blur-3xl animate-blob" style={{ animationDelay: "2s" }} />

      {/* Left – Brand panel */}
      <div className="hidden lg:flex flex-col justify-between p-12 w-1/2 relative z-10 gradient-mesh">
        <div className="flex items-center gap-3">
          <img src={mascot} alt="Nexitt" className="h-14 w-14 animate-float" />
          <div>
            <p className="text-2xl font-extrabold text-gradient-primary">Nexitt</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">ERP invisível para MEI</p>
          </div>
        </div>

        <div className="space-y-6 max-w-md">
          <h1 className="text-4xl xl:text-5xl font-extrabold leading-tight">
            Seu negócio rodando no <span className="text-gradient-primary">WhatsApp</span>.
          </h1>
          <p className="text-base text-muted-foreground">
            Registre vendas, controle despesas e nunca mais esqueça do DAS — tudo conversando com nosso bot.
          </p>
          <ul className="space-y-3">
            {[
              "Configure em 2 minutos",
              "Dashboard adaptado ao seu tipo de negócio",
              "Lembretes automáticos de impostos",
              "Relatórios mensais prontos para o contador",
            ].map((f) => (
              <li key={f} className="flex items-center gap-3 text-sm font-medium">
                <span className="h-6 w-6 rounded-full gradient-primary flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-4 w-4 text-primary-foreground" />
                </span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Nexitt · Feito para o microempreendedor brasileiro</p>
      </div>

      {/* Right – Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative z-10">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <img src={mascot} alt="Nexitt" className="h-12 w-12 animate-float" />
            <p className="text-2xl font-extrabold text-gradient-primary">Nexitt</p>
          </div>

          <Card className="p-6 md:p-8 rounded-3xl border border-border/60 shadow-glow backdrop-blur-xl bg-card/95">
            <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "signup")} className="w-full">
              <TabsList className="!flex w-full mb-7 h-12 bg-muted/70 rounded-2xl p-1 gap-1 overflow-hidden">
                <TabsTrigger
                  value="signup"
                  className="flex-1 h-full rounded-xl text-sm font-semibold transition-all data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow data-[state=inactive]:hover:text-foreground"
                >
                  Criar conta
                </TabsTrigger>
                <TabsTrigger
                  value="login"
                  className="flex-1 h-full rounded-xl text-sm font-semibold transition-all data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow data-[state=inactive]:hover:text-foreground"
                >
                  Entrar
                </TabsTrigger>
              </TabsList>

              <TabsContent value="signup" className="space-y-5 mt-0">
                <div className="space-y-1.5">
                  <h2 className="text-2xl md:text-3xl font-extrabold flex items-center gap-2 tracking-tight">
                    Comece agora
                    <Sparkles className="h-5 w-5 text-warning animate-pulse" />
                  </h2>
                  <p className="text-sm text-muted-foreground">Leva apenas 30 segundos — sem cartão de crédito.</p>
                </div>

                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-name" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Seu nome</Label>
                    <div className="relative group">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input id="signup-name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Maria Silva" required className="pl-10 h-12 rounded-xl border-border/60 focus-visible:border-primary focus-visible:ring-primary/20" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-email" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">E-mail</Label>
                    <div className="relative group">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input id="signup-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" required className="pl-10 h-12 rounded-xl border-border/60 focus-visible:border-primary focus-visible:ring-primary/20" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-phone" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Telefone (WhatsApp)</Label>
                    <div className="relative group">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input id="signup-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-0000" required className="pl-10 h-12 rounded-xl border-border/60 focus-visible:border-primary focus-visible:ring-primary/20" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-pwd" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Senha</Label>
                    <div className="relative group">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input id="signup-pwd" type={showPwd ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" required minLength={6} className="pl-10 pr-11 h-12 rounded-xl border-border/60 focus-visible:border-primary focus-visible:ring-primary/20" />
                      <button type="button" aria-label={showPwd ? "Ocultar senha" : "Mostrar senha"} onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                        {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-pwd2" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Confirmar senha</Label>
                    <div className="relative group">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input id="signup-pwd2" type={showPwd ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repita a senha" required minLength={6} className="pl-10 h-12 rounded-xl border-border/60 focus-visible:border-primary focus-visible:ring-primary/20" />
                    </div>
                  </div>
                  <Button type="submit" variant="hero" size="lg" disabled={loading} className="w-full mt-2 h-12 rounded-xl text-base font-semibold group">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Criar minha conta <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></>}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="login" className="space-y-5 mt-0">
                <div className="space-y-1.5">
                  <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Bem-vindo de volta 👋</h2>
                  <p className="text-sm text-muted-foreground">Continue de onde parou.</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="login-email" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">E-mail</Label>
                    <div className="relative group">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" required className="pl-10 h-12 rounded-xl border-border/60 focus-visible:border-primary focus-visible:ring-primary/20" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="login-pwd" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Senha</Label>
                      <Link to="#" className="text-xs font-semibold text-primary hover:underline">Esqueceu?</Link>
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input id="login-pwd" type={showPwd ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Digite sua senha" required className="pl-10 pr-11 h-12 rounded-xl border-border/60 focus-visible:border-primary focus-visible:ring-primary/20" />
                      <button type="button" aria-label={showPwd ? "Ocultar senha" : "Mostrar senha"} onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                        {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" variant="hero" size="lg" disabled={loading} className="w-full mt-2 h-12 rounded-xl text-base font-semibold group">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Entrar <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></>}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="flex items-center gap-3 my-6">
              <div className="h-px flex-1 bg-border/60" />
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">100% seguro</span>
              <div className="h-px flex-1 bg-border/60" />
            </div>

            <p className="text-[11px] text-center text-muted-foreground leading-relaxed">
              Ao continuar, você concorda com nossos <Link to="#" className="text-primary hover:underline font-medium">Termos</Link> e <Link to="#" className="text-primary hover:underline font-medium">Privacidade</Link>.
            </p>
          </Card>
        </div>
      </div>
    </div>
    </>
  );
}

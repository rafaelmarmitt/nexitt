import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

/**
 * Indica que os dados exibidos são exemplos (mockups), porque a tabela do banco está vazia.
 * Será substituído automaticamente quando o N8N começar a alimentar via WhatsApp.
 */
export function MockBadge({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <Badge variant="outline" className="border-dashed border-info/40 text-info bg-info-soft/40 text-[10px] font-medium gap-1">
      <Sparkles className="h-3 w-3" /> Dados de exemplo
    </Badge>
  );
}

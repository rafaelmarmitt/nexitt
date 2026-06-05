/**
 * Normaliza número de WhatsApp para o formato aceito pela Z-API / n8n.
 * Remove o 9 extra dos celulares brasileiros (padrão antigo de 8 dígitos após DDD).
 *
 * Exemplos:
 *  "51999237493"        -> "5199237493"   (11 dígitos, DDD + 9 + 8)
 *  "(51) 99923-7493"    -> "5199237493"
 *  "5551999237493"      -> "555199237493" (13 dígitos com DDI 55)
 *  "555199237493"       -> "555199237493" (já normalizado)
 *  "1133224455"         -> "1133224455"   (fixo, mantém)
 */
export function normalizeBrPhone(input: string): string {
  const digits = (input || "").replace(/\D/g, "");
  if (!digits) return "";

  // Com DDI 55: 55 + DDD(2) + 9 + 8 = 13 dígitos -> remover o 9 na posição 4
  if (digits.length === 13 && digits.startsWith("55") && digits[4] === "9") {
    return digits.slice(0, 4) + digits.slice(5);
  }

  // Sem DDI: DDD(2) + 9 + 8 = 11 dígitos -> remover o 9 na posição 2
  if (digits.length === 11 && digits[2] === "9") {
    return digits.slice(0, 2) + digits.slice(3);
  }

  return digits;
}

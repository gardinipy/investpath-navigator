import { useState, useRef, useEffect } from "react";
import { Send, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const FINANCIAL_RESPONSES: Record<string, string> = {
  "reserva de emergência":
    "**Reserva de Emergência** é um valor guardado para imprevistos. A recomendação é ter de **3 a 6 meses** dos seus custos fixos mensais.\n\n**Como montar:**\n1. Calcule seus custos fixos mensais\n2. Multiplique por 6 (meta ideal)\n3. Guarde um valor fixo todo mês — mesmo que pequeno\n4. Use investimentos de alta liquidez e baixo risco (ex: CDB com liquidez diária, Tesouro Selic)\n\n**Exemplo:** Se seus custos são R$ 3.000/mês, a meta é R$ 18.000.",
  "economizar salário":
    "**Como economizar parte do salário:**\n\n1. **Regra 50-30-20:** 50% necessidades, 30% desejos, 20% poupança/investimentos\n2. **Pague-se primeiro:** Assim que receber, transfira a parcela de poupança\n3. **Corte gastos invisíveis:** Assinaturas não usadas, delivery excessivo\n4. **Defina metas:** Objetivos concretos motivam a disciplina\n5. **Automatize:** Configure transferência automática no dia do pagamento",
  "juros compostos":
    "**Juros Compostos** são \"juros sobre juros\". É o principal mecanismo de crescimento de investimentos no longo prazo.\n\n**Fórmula:** FV = PV × (1 + r)^t\n\n- **FV** = Valor futuro\n- **PV** = Valor presente (investido)\n- **r** = Taxa de juros por período\n- **t** = Número de períodos\n\n**Exemplo:** R$ 1.000 a 1% ao mês por 12 meses = R$ 1.126,83\n\nO segredo é o **tempo** — quanto mais cedo começar, maior o efeito.",
  "dividend yield":
    "**Dividend Yield (DY)** mede o retorno em dividendos de um ativo em relação ao seu preço.\n\n**Fórmula:** DY = (Dividendos pagos nos últimos 12 meses / Preço atual) × 100\n\n**Exemplo:** Ação custa R$ 50 e pagou R$ 5 em dividendos → DY = 10%\n\n⚠️ Um DY alto nem sempre é positivo — pode indicar queda no preço. Analise o histórico e fundamentos.",
  "investir":
    "**Passos para começar a investir:**\n\n1. **Monte sua reserva de emergência primeiro**\n2. **Defina seus objetivos:** curto, médio ou longo prazo\n3. **Conheça seu perfil de risco:** conservador, moderado ou arrojado\n4. **Estude as opções:**\n   - Renda fixa: CDB, Tesouro Direto, LCI/LCA\n   - Renda variável: ações, FIIs, ETFs\n5. **Diversifique:** Nunca coloque tudo no mesmo ativo\n6. **Invista com consistência:** Aportes regulares importam mais que timing",
};

function getAIResponse(input: string): string {
  const lower = input.toLowerCase();

  for (const [key, response] of Object.entries(FINANCIAL_RESPONSES)) {
    if (lower.includes(key)) return response;
  }

  if (lower.includes("cdb") || lower.includes("tesouro") || lower.includes("renda fixa")) {
    return "**Renda Fixa** são investimentos com retorno previsível.\n\n- **Tesouro Selic:** Seguro, liquidez diária, ideal para reserva de emergência\n- **CDB:** Emitido por bancos, pode ter rentabilidade maior\n- **LCI/LCA:** Isentos de IR para pessoa física\n\nA escolha depende do prazo e objetivo. Para liquidez imediata, prefira Tesouro Selic ou CDB com liquidez diária.";
  }

  if (lower.includes("inflação") || lower.includes("ipca")) {
    return "**Inflação** é o aumento geral de preços. O **IPCA** é o índice oficial no Brasil.\n\nPara proteger seu dinheiro:\n- Invista em ativos que rendam **acima da inflação**\n- Tesouro IPCA+ garante rendimento real\n- Dinheiro parado na conta perde valor com o tempo";
  }

  if (lower.includes("ação") || lower.includes("ações") || lower.includes("bolsa")) {
    return "**Ações** representam frações de empresas negociadas na bolsa.\n\n⚠️ Não posso recomendar ações específicas, mas posso explicar conceitos:\n\n- **P/L (Preço/Lucro):** Mede quanto você paga por real de lucro\n- **ROE:** Retorno sobre patrimônio líquido\n- **Diversificação** reduz risco\n\nEstude antes de investir e nunca use dinheiro que vai precisar no curto prazo.";
  }

  return "Sou seu assistente financeiro educacional! Posso ajudar com:\n\n- 💰 Como economizar salário\n- 🏦 Reserva de emergência\n- 📈 Juros compostos\n- 💵 Dividend Yield\n- 📊 Como começar a investir\n- 🏠 Renda fixa (CDB, Tesouro)\n\nDigite sua pergunta sobre educação financeira!";
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Olá! Sou seu assistente de **educação financeira**. Posso explicar conceitos, ajudar a entender seus gastos e sugerir estratégias de economia.\n\n⚠️ Não recomendo investimentos específicos — apenas educação financeira baseada em matemática.\n\nComo posso ajudar?",
    },
  ]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = () => {
    if (!input.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    setTimeout(() => {
      const response = getAIResponse(userMsg.content);
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "assistant", content: response },
      ]);
    }, 500);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] md:h-[calc(100vh-4rem)]">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4">
        <h1 className="text-2xl md:text-3xl font-heading font-bold mb-1">Assistente Financeiro</h1>
        <p className="text-muted-foreground text-sm">Educação financeira e análise de gastos</p>
      </motion.div>

      <div className="flex-1 glass-card p-4 overflow-y-auto space-y-4 mb-4">
        <AnimatePresence mode="popLayout">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === "assistant" ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"}`}>
                {msg.role === "assistant" ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>
              <div className={`max-w-[80%] rounded-xl p-3 text-sm leading-relaxed ${msg.role === "user" ? "bg-primary/15 text-foreground" : "bg-secondary/70 text-foreground"}`}>
                {msg.content.split("\n").map((line, i) => (
                  <p key={i} className={line === "" ? "h-2" : ""}>
                    {line.split(/(\*\*.*?\*\*)/).map((part, j) =>
                      part.startsWith("**") && part.endsWith("**") ? (
                        <strong key={j} className="font-semibold text-primary">
                          {part.slice(2, -2)}
                        </strong>
                      ) : (
                        part
                      )
                    )}
                  </p>
                ))}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Pergunte sobre finanças..."
          className="bg-input border-border"
        />
        <Button onClick={send} size="icon" disabled={!input.trim()}>
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

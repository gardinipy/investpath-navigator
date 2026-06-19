import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import {
  askInvestmentAssistant,
  getGeminiApiKey,
  type ChatTurn,
} from "@/lib/investment-assistant";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const WELCOME_MESSAGE =
  "Olá! Sou o **consultor financeiro** do **InvestPath Navigator**. Posso tirar suas dúvidas **somente** sobre investimentos, educação financeira e organização do orçamento — como CDB, Tesouro Direto, Ações, FIIs, juros compostos e planejamento de gastos. Como posso ajudar?";

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: WELCOME_MESSAGE,
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const hasApiKey = Boolean(getGeminiApiKey());

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userText,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const history: ChatTurn[] = messages
        .filter((message) => message.id !== "welcome")
        .map((message) => ({
          role: message.role,
          content: message.content,
        }));

      const responseText = await askInvestmentAssistant(history, userText);

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: responseText,
        },
      ]);
    } catch (error) {
      console.error("Erro ao chamar o Gemini:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Não foi possível conectar ao assistente.";

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `⚠️ **Erro ao consultar a IA**\n\n${errorMessage}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] md:h-[calc(100vh-4rem)]">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-4"
      >
        <h1 className="text-2xl md:text-3xl font-heading font-bold mb-1">
          Consultor de Investimentos
        </h1>
        <p className="text-muted-foreground text-sm">
          Assistente de IA especializado em finanças — powered by Google Gemini
        </p>
      </motion.div>

      {!hasApiKey && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <p>
            Chave da API não detectada. Confirme se o arquivo <code>.env</code>{" "}
            contém <code>VITE_GEMINI_API_KEY=sua_chave</code> e reinicie o
            servidor com <code>npm run dev</code>.
          </p>
        </div>
      )}

      <div className="flex-1 glass-card p-4 overflow-y-auto space-y-4 mb-4">
        <AnimatePresence mode="popLayout">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === "assistant" ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"}`}
              >
                {msg.role === "assistant" ? (
                  <Bot className="w-4 h-4" />
                ) : (
                  <User className="w-4 h-4" />
                )}
              </div>
              <div
                className={`max-w-[80%] rounded-xl p-3 text-sm leading-relaxed prose prose-invert prose-sm max-w-none ${msg.role === "user" ? "bg-primary/15 text-foreground" : "bg-secondary/70 text-foreground"}`}
              >
                <ReactMarkdown
                  components={{
                    p: ({ children }) => (
                      <p className="mb-2 last:mb-0">{children}</p>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-semibold text-primary">
                        {children}
                      </strong>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc pl-4 mb-2 space-y-1">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal pl-4 mb-2 space-y-1">
                        {children}
                      </ol>
                    ),
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3"
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-primary/15 text-primary">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-secondary/70 text-foreground rounded-xl p-3 flex items-center gap-2 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" /> Analisando sua
                dúvida...
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ex.: Qual a diferença entre CDB e Tesouro Selic?"
          className="bg-input border-border"
          disabled={isLoading}
        />
        <Button
          onClick={send}
          size="icon"
          disabled={!input.trim() || isLoading}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

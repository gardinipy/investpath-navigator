import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { GoogleGenerativeAI } from "@google/generative-ai";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

// Inicializa a IA com a chave escondida no arquivo .env
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "");

// A instrução principal que dá a "personalidade" ao seu Chatbot
const SYSTEM_PROMPT = `Você é um assistente financeiro inteligente de um aplicativo chamado InvestPath Navigator. 
Seu objetivo é ajudar o usuário com educação financeira, explicar conceitos de forma didática (como juros compostos, CDB, Tesouro, Ações, FIIs, etc.), e dar dicas de organização de orçamento.
Seja amigável, claro e responda sempre em Português do Brasil. Use formatação em Markdown (negritos, listas) para deixar a leitura fácil. 
Se o usuário fizer uma pergunta que não tem a ver com finanças, economia ou investimentos, recuse educadamente e lembre-o do seu propósito.`;

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Olá! Sou a Inteligência Artificial do **InvestPath Navigator**. Estou aqui para te ajudar a organizar o teu orçamento e tirar todas as tuas dúvidas sobre investimentos (CDB, Ações, FIIs, etc). O que gostarias de aprender hoje?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Faz scroll para o fundo sempre que há uma nova mensagem
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || isLoading) return;

    // Guarda a mensagem do utilizador
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
      if (!apiKey) {
        throw new Error(
          "Chave da API do Gemini não encontrada no arquivo .env",
        );
      }

      // Prepara o modelo da IA
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction: SYSTEM_PROMPT,
      });

      // Prepara o histórico da conversa para a IA ter contexto
      const chatHistory = messages
        .filter((m) => m.id !== "welcome") // Ignora a mensagem de boas vindas
        .map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        }));

      // Inicia o chat com o histórico
      const chat = model.startChat({
        history: chatHistory,
      });

      // Envia a nova mensagem
      const result = await chat.sendMessage(userText);
      const responseText = result.response.text();

      // Adiciona a resposta ao ecrã
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
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content:
            "⚠️ **Erro de conexão.** Verifica se configuraste corretamente a tua chave da API no arquivo `.env` e se reiniciaste o servidor (npm run dev).",
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
          Assistente de IA
        </h1>
        <p className="text-muted-foreground text-sm">
          Alimentado por Google Gemini
        </p>
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
                className={`max-w-[80%] rounded-xl p-3 text-sm leading-relaxed ${msg.role === "user" ? "bg-primary/15 text-foreground" : "bg-secondary/70 text-foreground"}`}
              >
                {msg.content.split("\n").map((line, i) => (
                  <p key={i} className={line === "" ? "h-2" : "mb-1"}>
                    {/* Renderização simples de negritos do Markdown */}
                    {line.split(/(\*\*.*?\*\*)/).map((part, j) =>
                      part.startsWith("**") && part.endsWith("**") ? (
                        <strong key={j} className="font-semibold text-primary">
                          {part.slice(2, -2)}
                        </strong>
                      ) : (
                        part
                      ),
                    )}
                  </p>
                ))}
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
                <Loader2 className="w-4 h-4 animate-spin" /> Pensando...
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
          placeholder="Pergunta-me sobre finanças, como investir 100 reais, etc..."
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

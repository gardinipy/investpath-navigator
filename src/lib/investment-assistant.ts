import { GoogleGenerativeAI } from "@google/generative-ai";

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

const GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-1.5-flash",
] as const;

const FINANCE_KEYWORDS = [
  "invest",
  "ação",
  "ações",
  "acao",
  "acoes",
  "fii",
  "cdb",
  "tesouro",
  "dividendo",
  "provento",
  "juros",
  "bolsa",
  "renda",
  "poupança",
  "poupanca",
  "corretora",
  "carteira",
  "patrimônio",
  "patrimonio",
  "orçamento",
  "orcamento",
  "gasto",
  "despesa",
  "economia",
  "financeir",
  "dinheiro",
  "salário",
  "salario",
  "aposentadoria",
  "previdência",
  "previdencia",
  "inflação",
  "inflacao",
  "selic",
  "cdi",
  "ipca",
  "bitcoin",
  "cripto",
  "etf",
  "fundo",
  "lucro",
  "imposto",
  "come-cotas",
  "ativo",
  "passivo",
  "dívida",
  "divida",
  "crédito",
  "credito",
  "empréstimo",
  "emprestimo",
  "capital",
  "mercado",
  "cotação",
  "cotacao",
  "yield",
  "aport",
  "resgate",
  "liquidez",
  "risco",
  "diversif",
  "portfólio",
  "portfolio",
  "b3",
  "bovespa",
  "lci",
  "lca",
  "debênture",
  "debenture",
  "fidc",
  "fip",
  "fiagro",
  "bdr",
  "stock",
  "bond",
  "equity",
  "savings",
  "budget",
  "tax",
  "broker",
  "asset",
  "wealth",
  "compound",
  "interest",
  "dashboard",
  "painel",
  "gastando",
  "gasto",
  "economizar",
  "economia",
  "categoria",
  "extrato",
  "transaç",
  "transac",
  "saldo",
  "receita",
  "importar",
];

const OFF_TOPIC_PATTERNS = [
  /\bpython\b/i,
  /\bjavascript\b/i,
  /\btypescript\b/i,
  /\bjava\b/i,
  /\bc\+\+\b/i,
  /\bcódigo\b/i,
  /\bprograma(r|ção|ming)\b/i,
  /\barquivo\b/i,
  /\.py\b/i,
  /\.js\b/i,
  /\bbash\b/i,
  /\bshell\b/i,
  /\bbolo\b/i,
  /\breceita\s+(de\s+)?(bolo|torta|comida|culin)/i,
  /\bcozinha/i,
  /\bculinári/i,
  /\bfilme\b/i,
  /\bmúsica\b/i,
  /\bmusica\b/i,
  /\bjogo\b/i,
  /\bgame\b/i,
  /\bfofoca\b/i,
  /\breceita\s+médica\b/i,
  /\bremédio\b/i,
  /\bmedicina\b/i,
];

const GREETING_PATTERN =
  /^(oi|olá|ola|bom dia|boa tarde|boa noite|hey|hi|hello|e aí|eai|tudo bem)\b/i;

const THANKS_PATTERN = /^(obrigad|valeu|thanks|agradeço|agradec)/i;

export const SYSTEM_PROMPT = `Você é o Consultor Financeiro exclusivo do aplicativo InvestPath Navigator.

REGRAS OBRIGATÓRIAS (nunca quebre):
1. Você SOMENTE responde sobre: investimentos, educação financeira, mercado financeiro brasileiro, planejamento financeiro pessoal, orçamento doméstico e conceitos econômicos ligados a finanças pessoais.
2. Você NUNCA responde sobre: programação, tecnologia, culinária, entretenimento, saúde, esportes, política, relacionamentos, viagens, ou qualquer assunto fora de finanças/investimentos.
3. Se a pergunta não for sobre finanças ou investimentos, recuse imediatamente com esta mensagem (adapte levemente se necessário, mas mantenha o sentido):
   "Sou o consultor financeiro do InvestPath Navigator e só posso ajudar com dúvidas sobre investimentos, educação financeira e organização do orçamento. Por favor, reformule sua pergunta nesse contexto."
4. Nunca dê passo a passo de tarefas não financeiras (ex.: criar arquivos, fazer bolo, configurar software).
5. Não invente cotações em tempo real; se perguntarem preços atuais, explique que o usuário deve consultar o Simulador do app ou fontes oficiais.
6. Suas respostas são educativas, não constituem recomendação personalizada de investimento.
7. Responda sempre em Português do Brasil, de forma clara e amigável, usando Markdown (negritos e listas) quando útil.
8. Foque em conceitos como: CDB, Tesouro Direto, Ações, FIIs, renda fixa, renda variável, juros compostos, diversificação, reserva de emergência, inflação, Selic, CDI e organização de gastos.
9. Quando dados financeiros do dashboard do usuário forem fornecidos, use-os para personalizar suas respostas sobre gastos, categorias, economia e orçamento. Baseie-se apenas nos dados fornecidos — não invente valores ou transações.`;

export const DASHBOARD_CONTEXT_PREFIX = `DADOS FINANCEIROS DO USUÁRIO (dashboard atual do InvestPath Navigator):

`;

export const OFF_TOPIC_REFUSAL =
  "Sou o **consultor financeiro** do InvestPath Navigator e só posso ajudar com dúvidas sobre **investimentos**, **educação financeira** e **organização do orçamento**. Por favor, reformule sua pergunta nesse contexto.";

export function getGeminiApiKey(): string | undefined {
  const key = import.meta.env.VITE_GEMINI_API_KEY?.trim();
  return key || undefined;
}

export function isInvestmentRelated(text: string): boolean {
  const normalized = text.toLowerCase().trim();
  if (!normalized) return false;

  if (GREETING_PATTERN.test(normalized) || THANKS_PATTERN.test(normalized)) {
    return true;
  }

  const hasFinanceTopic = FINANCE_KEYWORDS.some((keyword) =>
    normalized.includes(keyword),
  );
  const isClearlyOffTopic = OFF_TOPIC_PATTERNS.some((pattern) =>
    pattern.test(normalized),
  );

  if (isClearlyOffTopic && !hasFinanceTopic) return false;
  if (hasFinanceTopic) return true;

  return false;
}

function formatGeminiError(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message;

    if (message.includes("API key not valid") || message.includes("API_KEY_INVALID")) {
      return "A chave da API do Google Gemini é inválida. Verifique se `VITE_GEMINI_API_KEY` no arquivo `.env` está correta e reinicie o servidor (`npm run dev`).";
    }

    if (message.includes("not found") || message.includes("404")) {
      return "O modelo de IA configurado não está disponível. Atualize o projeto e tente novamente.";
    }

    if (message.includes("quota") || message.includes("429")) {
      return "Limite de uso da API do Gemini atingido. Aguarde alguns minutos e tente novamente.";
    }

    return message;
  }

  return "Erro desconhecido ao consultar o Gemini.";
}

function buildSystemInstruction(financialContext?: string): string {
  if (!financialContext?.trim()) return SYSTEM_PROMPT;
  return `${SYSTEM_PROMPT}\n\n${DASHBOARD_CONTEXT_PREFIX}${financialContext.trim()}`;
}

async function generateWithModel(
  apiKey: string,
  modelName: string,
  history: ChatTurn[],
  userMessage: string,
  financialContext?: string,
): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: buildSystemInstruction(financialContext),
  });

  const chatHistory = history.map((turn) => ({
    role: turn.role === "assistant" ? "model" : "user",
    parts: [{ text: turn.content }],
  }));

  const chat = model.startChat({ history: chatHistory });
  const result = await chat.sendMessage(userMessage);
  const text = result.response.text()?.trim();

  if (!text) {
    throw new Error("O Gemini retornou uma resposta vazia.");
  }

  return text;
}

export async function askInvestmentAssistant(
  history: ChatTurn[],
  userMessage: string,
  financialContext?: string,
): Promise<string> {
  if (!isInvestmentRelated(userMessage)) {
    return OFF_TOPIC_REFUSAL;
  }

  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error(
      "Chave da API não encontrada. Crie um arquivo `.env` na raiz do projeto com `VITE_GEMINI_API_KEY=sua_chave` e reinicie o servidor de desenvolvimento.",
    );
  }

  let lastError: unknown;

  for (const modelName of GEMINI_MODELS) {
    try {
      return await generateWithModel(
        apiKey,
        modelName,
        history,
        userMessage,
        financialContext,
      );
    } catch (error) {
      lastError = error;
      const message =
        error instanceof Error ? error.message.toLowerCase() : "";

      const shouldTryNextModel =
        message.includes("not found") ||
        message.includes("404") ||
        message.includes("is not supported");

      if (!shouldTryNextModel) break;
    }
  }

  throw new Error(formatGeminiError(lastError));
}

import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  Transaction,
  TransactionType,
} from "@/lib/financial-utils";

export interface ParsedTransaction {
  value: number;
  category: string;
  type: TransactionType;
  description: string;
  date: string;
}

export interface ImportResult {
  transactions: ParsedTransaction[];
  skipped: number;
  warnings: string[];
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Alimentação: [
    "supermercado",
    "mercado",
    "ifood",
    "rappi",
    "restaurante",
    "padaria",
    "lanchonete",
    "açougue",
    "acougue",
    "food",
    "pizza",
    "burger",
  ],
  Moradia: [
    "aluguel",
    "condominio",
    "condomínio",
    "iptu",
    "luz",
    "energia",
    "agua",
    "água",
    "gas",
    "gás",
    "internet",
    "telefone",
  ],
  Transporte: [
    "uber",
    "99",
    "combustivel",
    "combustível",
    "posto",
    "estacionamento",
    "pedágio",
    "pedagio",
    "onibus",
    "ônibus",
    "metro",
    "metrô",
    "taxi",
    "táxi",
  ],
  Saúde: [
    "farmacia",
    "farmácia",
    "drogaria",
    "hospital",
    "clinica",
    "clínica",
    "plano de saude",
    "plano de saúde",
    "dentista",
  ],
  Educação: [
    "escola",
    "faculdade",
    "curso",
    "udemy",
    "livro",
    "livraria",
    "mensalidade",
  ],
  Lazer: [
    "cinema",
    "netflix",
    "spotify",
    "steam",
    "jogo",
    "viagem",
    "hotel",
    "ingresso",
    "bar",
    "show",
  ],
  Vestuário: [
    "roupa",
    "calcado",
    "calçado",
    "sapato",
    "renner",
    "c&a",
    "shein",
    "shopee",
  ],
  Assinaturas: [
    "assinatura",
    "mensalidade",
    "amazon prime",
    "disney",
    "hbo",
    "apple",
    "google one",
    "microsoft",
  ],
};

const INCOME_KEYWORDS = [
  "salario",
  "salário",
  "pix recebido",
  "transferencia recebida",
  "transferência recebida",
  "deposito",
  "depósito",
  "rendimento",
  "dividendo",
  "provento",
  "freelance",
  "pagamento recebido",
];

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function inferCategory(description: string, type: TransactionType): string {
  const lower = description.toLowerCase();

  if (type === "income") {
    if (lower.includes("salario") || lower.includes("salário")) return "Salário";
    if (lower.includes("freelance") || lower.includes("projeto")) return "Freelance";
    if (
      lower.includes("dividendo") ||
      lower.includes("provento") ||
      lower.includes("rendimento")
    ) {
      return "Investimentos";
    }
    return "Outros";
  }

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return category;
    }
  }

  return "Outros";
}

export function inferType(
  value: number,
  description: string,
  explicitType?: string,
): TransactionType {
  if (explicitType) {
    const t = explicitType.toLowerCase();
    if (
      t.includes("credito") ||
      t.includes("crédito") ||
      t.includes("receita") ||
      t.includes("entrada") ||
      t.includes("credit")
    ) {
      return "income";
    }
    if (
      t.includes("debito") ||
      t.includes("débito") ||
      t.includes("despesa") ||
      t.includes("saida") ||
      t.includes("saída") ||
      t.includes("debit")
    ) {
      return "expense";
    }
  }

  if (value < 0) return "expense";
  if (value > 0) {
    const lower = description.toLowerCase();
    if (INCOME_KEYWORDS.some((kw) => lower.includes(kw))) return "income";
    return "expense";
  }

  return "expense";
}

export function parseBrazilianNumber(raw: string): number | null {
  const trimmed = raw.trim().replace(/[R$\s]/g, "");
  if (!trimmed) return null;

  const normalized = trimmed.includes(",")
    ? trimmed.replace(/\./g, "").replace(",", ".")
    : trimmed;

  const num = parseFloat(normalized);
  return Number.isFinite(num) ? num : null;
}

function parseDate(raw: string): string | null {
  const trimmed = raw.trim();

  const brMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (brMatch) {
    const day = parseInt(brMatch[1], 10);
    const month = parseInt(brMatch[2], 10) - 1;
    let year = parseInt(brMatch[3], 10);
    if (year < 100) year += 2000;
    const d = new Date(year, month, day);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }

  const isoMatch = trimmed.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (isoMatch) {
    const d = new Date(
      parseInt(isoMatch[1], 10),
      parseInt(isoMatch[2], 10) - 1,
      parseInt(isoMatch[3], 10),
    );
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }

  const ofxMatch = trimmed.match(/^(\d{4})(\d{2})(\d{2})/);
  if (ofxMatch) {
    const d = new Date(
      parseInt(ofxMatch[1], 10),
      parseInt(ofxMatch[2], 10) - 1,
      parseInt(ofxMatch[3], 10),
    );
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }

  return null;
}

function detectDelimiter(line: string): string {
  const semicolons = (line.match(/;/g) || []).length;
  const commas = (line.match(/,/g) || []).length;
  const tabs = (line.match(/\t/g) || []).length;
  if (tabs >= semicolons && tabs >= commas) return "\t";
  if (semicolons >= commas) return ";";
  return ",";
}

function splitCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function findColumnIndex(headers: string[], patterns: string[]): number {
  return headers.findIndex((h) =>
    patterns.some((p) => h.toLowerCase().includes(p)),
  );
}

export function parseCsvContent(content: string): ImportResult {
  const warnings: string[] = [];
  const transactions: ParsedTransaction[] = [];
  let skipped = 0;

  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return {
      transactions: [],
      skipped: 0,
      warnings: ["Arquivo CSV vazio ou sem dados suficientes."],
    };
  }

  const delimiter = detectDelimiter(lines[0]);
  const headers = splitCsvLine(lines[0], delimiter).map((h) =>
    h.replace(/^"|"$/g, "").toLowerCase(),
  );

  const dateIdx = findColumnIndex(headers, [
    "data",
    "date",
    "dt_mov",
    "dt mov",
    "data mov",
    "data_movimentacao",
    "data movimentação",
  ]);
  const descIdx = findColumnIndex(headers, [
    "descri",
    "historico",
    "histórico",
    "lancamento",
    "lançamento",
    "memo",
    "detalhe",
    "titulo",
    "título",
    "estabelecimento",
  ]);
  const valueIdx = findColumnIndex(headers, [
    "valor",
    "value",
    "amount",
    "quantia",
    "montante",
    "vlr",
  ]);
  const typeIdx = findColumnIndex(headers, [
    "tipo",
    "type",
    "natureza",
    "operacao",
    "operação",
    "dc",
  ]);

  if (dateIdx === -1 || valueIdx === -1) {
    return {
      transactions: [],
      skipped: 0,
      warnings: [
        "Não foi possível identificar colunas de data e valor. Verifique se o CSV possui cabeçalhos como Data, Descrição e Valor.",
      ],
    };
  }

  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i], delimiter).map((c) =>
      c.replace(/^"|"$/g, ""),
    );
    const dateStr = cols[dateIdx];
    const valueRaw = cols[valueIdx];
    const description =
      descIdx >= 0 ? cols[descIdx] || "Importado" : "Importado do CSV";

    const date = parseDate(dateStr);
    const value = parseBrazilianNumber(valueRaw);

    if (!date || value === null || value === 0) {
      skipped++;
      continue;
    }

    const explicitType = typeIdx >= 0 ? cols[typeIdx] : undefined;
    const type = inferType(Math.abs(value), description, explicitType);
    const absValue = Math.abs(value);

    transactions.push({
      value: absValue,
      category: inferCategory(description, type),
      type,
      description: description.trim(),
      date,
    });
  }

  if (transactions.length === 0) {
    warnings.push("Nenhuma transação válida encontrada no CSV.");
  }

  return { transactions, skipped, warnings };
}

export function parseOfxContent(content: string): ImportResult {
  const warnings: string[] = [];
  const transactions: ParsedTransaction[] = [];
  let skipped = 0;

  const stmtTrnRegex =
    /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
  const matches = [...content.matchAll(stmtTrnRegex)];

  if (matches.length === 0) {
    return {
      transactions: [],
      skipped: 0,
      warnings: ["Nenhuma transação OFX encontrada no arquivo."],
    };
  }

  for (const match of matches) {
    const block = match[1];
    const getTag = (tag: string) => {
      const m = block.match(new RegExp(`<${tag}>([^<\\n]+)`, "i"));
      return m?.[1]?.trim() ?? "";
    };

    const dateRaw = getTag("DTPOSTED") || getTag("DTUSER");
    const amountRaw = getTag("TRNAMT");
    const description =
      getTag("MEMO") || getTag("NAME") || getTag("FITID") || "Importado do OFX";

    const date = parseDate(dateRaw);
    const value = parseBrazilianNumber(amountRaw);

    if (!date || value === null || value === 0) {
      skipped++;
      continue;
    }

    const type = inferType(value, description);
    transactions.push({
      value: Math.abs(value),
      category: inferCategory(description, type),
      type,
      description,
      date,
    });
  }

  return { transactions, skipped, warnings };
}

export function parseQifContent(content: string): ImportResult {
  const warnings: string[] = [];
  const transactions: ParsedTransaction[] = [];
  let skipped = 0;

  const entries = content.split(/^\^/m).filter((e) => e.trim());

  for (const entry of entries) {
    const lines = entry.split(/\r?\n/).filter(Boolean);
    let dateRaw = "";
    let amountRaw = "";
    let description = "Importado do QIF";
    let category = "";

    for (const line of lines) {
      const code = line[0];
      const value = line.slice(1).trim();
      switch (code) {
        case "D":
          dateRaw = value;
          break;
        case "T":
          amountRaw = value;
          break;
        case "P":
          description = value;
          break;
        case "L":
          category = value;
          break;
      }
    }

    const date = parseDate(dateRaw);
    const value = parseBrazilianNumber(amountRaw);

    if (!date || value === null || value === 0) {
      skipped++;
      continue;
    }

    const type = inferType(value, description);
    const mappedCategory =
      category && [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].includes(category as never)
        ? category
        : inferCategory(description, type);

    transactions.push({
      value: Math.abs(value),
      category: mappedCategory,
      type,
      description,
      date,
    });
  }

  if (transactions.length === 0) {
    warnings.push("Nenhuma transação válida encontrada no QIF.");
  }

  return { transactions, skipped, warnings };
}

export async function parsePdfFile(file: File): Promise<ImportResult> {
  const warnings: string[] = [];
  const transactions: ParsedTransaction[] = [];
  let skipped = 0;

  try {
    const pdfjs = await import("pdfjs-dist");

    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url,
    ).toString();

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

    let fullText = "";
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ");
      fullText += pageText + "\n";
    }

    const linePattern =
      /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\s+(.+?)\s+(-?\s*R?\$?\s*[\d.,]+)/g;
    const altPattern =
      /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\s+(.+?)\s+([\d.,]+)/g;

    const matches = [...fullText.matchAll(linePattern)];
    const altMatches =
      matches.length === 0 ? [...fullText.matchAll(altPattern)] : [];

    const allMatches = matches.length > 0 ? matches : altMatches;

    for (const match of allMatches) {
      const date = parseDate(match[1]);
      const description = match[2].trim().slice(0, 120);
      const value = parseBrazilianNumber(match[3]);

      if (!date || value === null || value === 0) {
        skipped++;
        continue;
      }

      const type = inferType(value, description);
      transactions.push({
        value: Math.abs(value),
        category: inferCategory(description, type),
        type,
        description,
        date,
      });
    }

    if (transactions.length === 0) {
      warnings.push(
        "Não foi possível extrair transações do PDF. Tente exportar em CSV ou OFX pelo internet banking — esses formatos são mais confiáveis.",
      );
    }
  } catch (error) {
    warnings.push(
      `Erro ao ler PDF: ${error instanceof Error ? error.message : "formato não suportado"}`,
    );
  }

  return { transactions, skipped, warnings };
}

export async function parseImportFile(file: File): Promise<ImportResult> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";

  if (ext === "pdf") {
    return parsePdfFile(file);
  }

  const content = await file.text();

  if (ext === "ofx" || ext === "qfx") {
    return parseOfxContent(content);
  }

  if (ext === "qif") {
    return parseQifContent(content);
  }

  return parseCsvContent(content);
}

export function parsedToTransactions(
  parsed: ParsedTransaction[],
): Omit<Transaction, "id">[] {
  return parsed.map((t) => ({
    value: t.value,
    category: t.category,
    type: t.type,
    description: t.description,
    date: t.date,
  }));
}

export { generateId };

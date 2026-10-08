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

const DATE_PATTERNS = [
  "data",
  "date",
  "dt_mov",
  "dt mov",
  "data mov",
  "data_movimentacao",
  "data movimentação",
  "data do lançamento",
  "posted",
];

const DESC_PATTERNS = [
  "descri",
  "historico",
  "histórico",
  "lancamento",
  "lançamento",
  "memo",
  "detalhe",
  "titulo",
  "título",
  "title",
  "estabelecimento",
  "transação",
  "transacao",
  "nome",
];

const VALUE_PATTERNS = [
  "valor",
  "value",
  "amount",
  "quantia",
  "montante",
  "vlr",
];

const TYPE_PATTERNS = [
  "tipo",
  "type",
  "natureza",
  "operacao",
  "operação",
  "dc",
  "d/c",
  "c/d",
];

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function inferCategory(
  description: string,
  type: TransactionType,
): string {
  const lower = description.toLowerCase();

  if (type === "income") {
    if (lower.includes("salario") || lower.includes("salário"))
      return "Salário";
    if (lower.includes("freelance") || lower.includes("projeto"))
      return "Freelance";
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
      t.includes("credit") ||
      t === "c" ||
      t === "cr"
    ) {
      return "income";
    }
    if (
      t.includes("debito") ||
      t.includes("débito") ||
      t.includes("despesa") ||
      t.includes("saida") ||
      t.includes("saída") ||
      t.includes("debit") ||
      t === "d" ||
      t === "db"
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

  const parenNegative = /^\((.+)\)$/.exec(trimmed);
  const unsigned = parenNegative ? parenNegative[1] : trimmed;
  const negativePrefix = unsigned.startsWith("-") || unsigned.startsWith("+");
  const body = negativePrefix ? unsigned.slice(1) : unsigned;
  const sign =
    parenNegative || unsigned.startsWith("-") ? -1 : 1;

  const normalized = body.includes(",")
    ? body.replace(/\./g, "").replace(",", ".")
    : body;

  const num = parseFloat(normalized);
  return Number.isFinite(num) ? num * sign : null;
}

function parseDate(raw: string): string | null {
  const trimmed = raw.trim();

  const brMatch = trimmed.match(
    /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})(?:[T\s]\d{1,2}:\d{2}(?::\d{2})?)?/,
  );
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
  if (tabs >= semicolons && tabs >= commas && tabs > 0) return "\t";
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

function normalizeHeader(header: string): string {
  return header
    .replace(/^\uFEFF/, "")
    .replace(/^"|"$/g, "")
    .trim()
    .toLowerCase();
}

function findColumnIndex(headers: string[], patterns: string[]): number {
  return headers.findIndex((h) =>
    patterns.some((p) => h.toLowerCase().includes(p)),
  );
}

function isDebitHeader(header: string): boolean {
  const h = header.toLowerCase();
  return (
    (h.includes("débito") ||
      h.includes("debito") ||
      h.includes("debit") ||
      h.includes("saída") ||
      h.includes("saida")) &&
    !h.includes("saldo")
  );
}

function isCreditHeader(header: string): boolean {
  const h = header.toLowerCase();
  return (
    (h.includes("crédito") ||
      h.includes("credito") ||
      h.includes("credit") ||
      h.includes("entrada")) &&
    !h.includes("saldo")
  );
}

function looksLikeValueHeader(header: string): boolean {
  const h = header.toLowerCase();
  if (h.includes("saldo") || h.includes("identificador")) {
    return false;
  }
  return VALUE_PATTERNS.some((p) => h.includes(p));
}

function findHeaderRow(
  lines: string[],
): { index: number; delimiter: string; headers: string[] } | null {
  const limit = Math.min(lines.length, 40);
  for (let i = 0; i < limit; i++) {
    const delimiter = detectDelimiter(lines[i]);
    const headers = splitCsvLine(lines[i], delimiter).map(normalizeHeader);
    const dateIdx = findColumnIndex(headers, DATE_PATTERNS);
    const valueIdx = headers.findIndex(looksLikeValueHeader);
    const debitIdx = headers.findIndex(isDebitHeader);
    const creditIdx = headers.findIndex(isCreditHeader);
    if (dateIdx !== -1 && (valueIdx !== -1 || debitIdx !== -1 || creditIdx !== -1)) {
      return { index: i, delimiter, headers };
    }
  }
  return null;
}

function buildParsed(
  date: string,
  description: string,
  signedValue: number,
  explicitType?: string,
  signedFile?: boolean,
): ParsedTransaction {
  let type: TransactionType;
  if (explicitType) {
    type = inferType(signedValue, description, explicitType);
  } else if (signedFile) {
    type = signedValue < 0 ? "expense" : "income";
  } else {
    type = inferType(signedValue, description);
  }

  return {
    value: Math.abs(signedValue),
    category: inferCategory(description, type),
    type,
    description: description.trim() || "Importado",
    date,
  };
}

export function parseCsvContent(content: string): ImportResult {
  const warnings: string[] = [];
  const transactions: ParsedTransaction[] = [];
  let skipped = 0;

  const lines = content
    .replace(/^\uFEFF/, "")
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

  const header = findHeaderRow(lines);
  if (!header) {
    return {
      transactions: [],
      skipped: 0,
      warnings: [
        "Não foi possível identificar colunas de data e valor. Verifique se o CSV possui cabeçalhos como Data, Descrição e Valor.",
      ],
    };
  }

  const { delimiter, headers } = header;
  const dateIdx = findColumnIndex(headers, DATE_PATTERNS);
  const descIdx = findColumnIndex(headers, DESC_PATTERNS);
  const valueIdx = headers.findIndex(looksLikeValueHeader);
  const typeIdx = findColumnIndex(headers, TYPE_PATTERNS);
  const debitIdx = headers.findIndex(isDebitHeader);
  const creditIdx = headers.findIndex(isCreditHeader);

  const dataLines = lines.slice(header.index + 1);
  const parsedRows: {
    date: string;
    description: string;
    value: number;
    explicitType?: string;
  }[] = [];

  for (const line of dataLines) {
    const cols = splitCsvLine(line, delimiter).map((c) =>
      c.replace(/^"|"$/g, ""),
    );
    const dateStr = cols[dateIdx] ?? "";
    const description =
      descIdx >= 0 ? cols[descIdx] || "Importado" : "Importado do CSV";

    let signedValue: number | null = null;
    let explicitType = typeIdx >= 0 ? cols[typeIdx] : undefined;

    if (debitIdx >= 0 || creditIdx >= 0) {
      const debitRaw = debitIdx >= 0 ? cols[debitIdx] : "";
      const creditRaw = creditIdx >= 0 ? cols[creditIdx] : "";
      const debit = debitRaw ? parseBrazilianNumber(debitRaw) : null;
      const credit = creditRaw ? parseBrazilianNumber(creditRaw) : null;
      if (credit && credit !== 0) {
        signedValue = Math.abs(credit);
        explicitType = explicitType || "crédito";
      } else if (debit && debit !== 0) {
        signedValue = -Math.abs(debit);
        explicitType = explicitType || "débito";
      }
    }

    if (signedValue === null && valueIdx >= 0) {
      signedValue = parseBrazilianNumber(cols[valueIdx] ?? "");
    }

    const date = parseDate(dateStr);
    if (!date || signedValue === null || signedValue === 0) {
      skipped++;
      continue;
    }

    parsedRows.push({
      date,
      description,
      value: signedValue,
      explicitType,
    });
  }

  const signedFile = parsedRows.some((row) => row.value < 0);

  for (const row of parsedRows) {
    transactions.push(
      buildParsed(
        row.date,
        row.description,
        row.value,
        row.explicitType,
        signedFile,
      ),
    );
  }

  if (transactions.length === 0) {
    warnings.push("Nenhuma transação válida encontrada no CSV.");
  }

  return { transactions, skipped, warnings };
}

function ofxTag(block: string, tag: string): string {
  const match = block.match(new RegExp(`<${tag}>([^<\\n\\r]+)`, "i"));
  return match?.[1]?.trim() ?? "";
}

export function parseOfxContent(content: string): ImportResult {
  const warnings: string[] = [];
  const transactions: ParsedTransaction[] = [];
  let skipped = 0;

  const normalized = content.replace(/\r\n/g, "\n");
  let blocks: string[] = [];

  const closed = [...normalized.matchAll(/<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi)];
  if (closed.length > 0) {
    blocks = closed.map((m) => m[1]);
  } else {
    blocks = normalized
      .split(/<STMTTRN>/i)
      .slice(1)
      .map((part) => part.split(/<(?:\/STMTTRN|STMTTRN|\/BANKTRANLIST|BANKTRANLIST)/i)[0]);
  }

  if (blocks.length === 0) {
    return {
      transactions: [],
      skipped: 0,
      warnings: ["Nenhuma transação OFX encontrada no arquivo."],
    };
  }

  for (const block of blocks) {
    const dateRaw = ofxTag(block, "DTPOSTED") || ofxTag(block, "DTUSER");
    const amountRaw = ofxTag(block, "TRNAMT");
    const description =
      ofxTag(block, "MEMO") ||
      ofxTag(block, "NAME") ||
      ofxTag(block, "FITID") ||
      "Importado do OFX";
    const trnType = ofxTag(block, "TRNTYPE");

    const date = parseDate(dateRaw);
    const value = parseBrazilianNumber(amountRaw);

    if (!date || value === null || value === 0) {
      skipped++;
      continue;
    }

    transactions.push(buildParsed(date, description, value, trnType, true));
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

    const mapped =
      category &&
      [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].includes(category as never)
        ? category
        : null;

    const parsed = buildParsed(date, description, value, undefined, true);
    transactions.push({
      ...parsed,
      category: mapped ?? parsed.category,
    });
  }

  if (transactions.length === 0) {
    warnings.push("Nenhuma transação válida encontrada no QIF.");
  }

  return { transactions, skipped, warnings };
}

type PdfTextItem = {
  str?: string;
  transform?: number[];
};

function pdfItemsToLines(items: PdfTextItem[]): string[] {
  const rows = new Map<number, { x: number; text: string }[]>();

  for (const item of items) {
    const text = item.str?.replace(/\s+/g, " ").trim();
    if (!text || !item.transform) continue;
    const y = Math.round(item.transform[5]);
    const x = item.transform[4] ?? 0;
    const list = rows.get(y) ?? [];
    list.push({ x, text });
    rows.set(y, list);
  }

  return [...rows.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([, parts]) =>
      parts
        .sort((a, b) => a.x - b.x)
        .map((p) => p.text)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter(Boolean);
}

function parseStatementLines(lines: string[]): {
  transactions: ParsedTransaction[];
  skipped: number;
} {
  const transactions: ParsedTransaction[] = [];
  let skipped = 0;
  const rowPattern =
    /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})\s+(.+?)\s+(-?\(?\s*R?\$?\s*[\d.]+,[\d]{2}\)?|-?\(?\s*R?\$?\s*[\d,]+\.[\d]{2}\)?)\s*([DCdc])?/;

  for (const line of lines) {
    const match = line.match(rowPattern);
    if (!match) continue;

    const date = parseDate(match[1]);
    const description = match[2].trim().slice(0, 120);
    const value = parseBrazilianNumber(match[3]);
    const dc = match[4];

    if (!date || value === null || value === 0) {
      skipped++;
      continue;
    }

    const signed =
      dc?.toUpperCase() === "C"
        ? Math.abs(value)
        : dc?.toUpperCase() === "D"
          ? -Math.abs(value)
          : value;

    transactions.push(buildParsed(date, description, signed, dc, true));
  }

  return { transactions, skipped };
}

export async function parsePdfFile(file: File): Promise<ImportResult> {
  const warnings: string[] = [];
  let skipped = 0;
  let transactions: ParsedTransaction[] = [];

  try {
    const pdfjs = await import("pdfjs-dist");
    const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

    const lines: string[] = [];
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      lines.push(
        ...pdfItemsToLines(textContent.items as PdfTextItem[]),
      );
    }

    const parsed = parseStatementLines(lines);
    transactions = parsed.transactions;
    skipped = parsed.skipped;

    if (transactions.length === 0) {
      const fallback = parseStatementLines([lines.join(" ")]);
      transactions = fallback.transactions;
      skipped += fallback.skipped;
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

function looksGarbled(text: string): boolean {
  const replacement = (text.match(/\uFFFD/g) || []).length;
  return replacement > 0 || /Ã.|�/.test(text.slice(0, 400));
}

async function readTextFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const utf8 = new TextDecoder("utf-8").decode(buffer);
  if (looksGarbled(utf8)) {
    return new TextDecoder("windows-1252").decode(buffer);
  }
  return utf8;
}

export function parseImportContent(
  content: string,
  ext = "",
): ImportResult {
  const trimmed = content.trim();
  const lowerExt = ext.toLowerCase();

  if (
    lowerExt === "ofx" ||
    lowerExt === "qfx" ||
    /OFXHEADER|<OFX>/i.test(trimmed)
  ) {
    return parseOfxContent(content);
  }

  if (lowerExt === "qif" || /^!Type:/im.test(trimmed)) {
    return parseQifContent(content);
  }

  return parseCsvContent(content);
}

export async function parseImportFile(file: File): Promise<ImportResult> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";

  if (ext === "pdf") {
    return parsePdfFile(file);
  }

  const content = await readTextFile(file);
  return parseImportContent(content, ext);
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

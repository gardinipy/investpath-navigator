import { describe, expect, it } from "vitest";
import {
  inferCategory,
  inferType,
  parseBrazilianNumber,
  parseCsvContent,
  parseImportContent,
  parseOfxContent,
  parseQifContent,
} from "@/lib/transaction-import";
import { buildFinancialContext } from "@/lib/financial-context";
import { generateDemoTransactions } from "@/lib/financial-utils";

describe("parseBrazilianNumber", () => {
  it("parseia valores brasileiros", () => {
    expect(parseBrazilianNumber("1.234,56")).toBe(1234.56);
    expect(parseBrazilianNumber("R$ 50,00")).toBe(50);
    expect(parseBrazilianNumber("-120,50")).toBe(-120.5);
  });
});

describe("inferCategory", () => {
  it("identifica categorias por palavras-chave", () => {
    expect(inferCategory("Supermercado Extra", "expense")).toBe("Alimentação");
    expect(inferCategory("Uber viagem", "expense")).toBe("Transporte");
    expect(inferCategory("Salário mensal", "income")).toBe("Salário");
  });
});

describe("inferType", () => {
  it("identifica receita e despesa", () => {
    expect(inferType(-50, "Compra")).toBe("expense");
    expect(inferType(5500, "Salário recebido")).toBe("income");
    expect(inferType(100, "Compra no mercado")).toBe("expense");
  });
});

describe("parseCsvContent", () => {
  it("parseia CSV com cabeçalhos brasileiros", () => {
    const csv = `Data;Descrição;Valor
01/06/2026;Supermercado Extra;-150,00
05/06/2026;Salário recebido;5500,00`;

    const result = parseCsvContent(csv);
    expect(result.transactions).toHaveLength(2);
    expect(result.transactions[0].type).toBe("expense");
    expect(result.transactions[0].value).toBe(150);
    expect(result.transactions[1].type).toBe("income");
  });
});

describe("parseOfxContent", () => {
  it("parseia transações OFX", () => {
    const ofx = `
<OFX>
<STMTTRN>
<DTPOSTED>20260601
<TRNAMT>-89.90
<MEMO>Netflix Assinatura
</STMTTRN>
</OFX>`;

    const result = parseOfxContent(ofx);
    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].category).toBe("Lazer");
    expect(result.transactions[0].value).toBe(89.9);
  });
});

describe("parseQifContent", () => {
  it("parseia transações QIF", () => {
    const qif = `D06/01/2026
T-45.00
PUber
^`;

    const result = parseQifContent(qif);
    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].category).toBe("Transporte");
  });
});

describe("buildFinancialContext", () => {
  it("gera resumo com dados do dashboard", () => {
    const context = buildFinancialContext(generateDemoTransactions());
    expect(context).toContain("RESUMO DO MÊS ATUAL");
    expect(context).toContain("GASTOS POR CATEGORIA");
    expect(context).toContain("Moradia");
  });

  it("lida com lista vazia", () => {
    expect(buildFinancialContext([])).toContain("não possui transações");
  });
});

describe("parseImportDate via CSV", () => {
  it("aceita datas em formatos comuns", () => {
    const csv = `Data;Valor;Descrição
2026-06-15;100,00;Teste
15/06/2026;200,00;Teste2`;

    const result = parseCsvContent(csv);
    expect(result.transactions).toHaveLength(2);
  });

  it("aceita data com horário e BOM", () => {
    const csv = `\uFEFFData;Valor;Descrição
15/06/2026 14:30:00;-80,00;Padaria`;

    const result = parseCsvContent(csv);
    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].category).toBe("Alimentação");
  });

  it("ignora linhas extras antes do cabeçalho", () => {
    const csv = `Agência;0001
Conta;12345-6

Data;Histórico;Valor
01/06/2026;Uber;-25,90`;

    const result = parseCsvContent(csv);
    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].category).toBe("Transporte");
  });

  it("classifica receita pelo sinal quando o extrato é assinado", () => {
    const csv = `date,title,amount
2026-06-01,Pix recebido,200.00
2026-06-02,Mercado,-80.00`;

    const result = parseCsvContent(csv);
    expect(result.transactions).toHaveLength(2);
    expect(result.transactions[0].type).toBe("income");
    expect(result.transactions[1].type).toBe("expense");
  });
});

describe("parseOfxContent extra", () => {
  it("aceita OFX sem tags de fechamento", () => {
    const ofx = `OFXHEADER:100
<OFX>
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20260601120000[-3:BRT]
<TRNAMT>-45.00
<MEMO>Uber
<STMTTRN>
<TRNTYPE>CREDIT
<DTPOSTED>20260605
<TRNAMT>1200.00
<MEMO>Pix recebido
`;

    const result = parseOfxContent(ofx);
    expect(result.transactions).toHaveLength(2);
    expect(result.transactions[0].type).toBe("expense");
    expect(result.transactions[1].type).toBe("income");
  });
});

describe("parseImportContent", () => {
  it("detecta OFX em arquivo .txt", () => {
    const ofx = `<OFX><STMTTRN>
<DTPOSTED>20260601
<TRNAMT>-10.00
<MEMO>Teste
</STMTTRN></OFX>`;
    const result = parseImportContent(ofx, "txt");
    expect(result.transactions).toHaveLength(1);
  });
});

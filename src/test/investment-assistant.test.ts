import { describe, expect, it } from "vitest";
import { isInvestmentRelated } from "@/lib/investment-assistant";

describe("isInvestmentRelated", () => {
  it("aceita perguntas sobre investimentos", () => {
    expect(isInvestmentRelated("Qual a diferença entre CDB e Tesouro?")).toBe(
      true,
    );
    expect(isInvestmentRelated("Como investir 100 reais em FIIs?")).toBe(true);
  });

  it("aceita cumprimentos", () => {
    expect(isInvestmentRelated("Olá")).toBe(true);
    expect(isInvestmentRelated("Bom dia")).toBe(true);
  });

  it("recusa assuntos fora de finanças", () => {
    expect(isInvestmentRelated("Como fazer um bolo de chocolate?")).toBe(false);
    expect(isInvestmentRelated("Como criar um arquivo em Python?")).toBe(
      false,
    );
    expect(isInvestmentRelated("Qual a capital da França?")).toBe(false);
  });
});

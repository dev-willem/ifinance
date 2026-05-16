# iFinance — Documentação Consolidada

**Versão:** 1.0 — estado atual do sistema  
**Autor:** Willemberg Filho  
**Stack:** Java 25 · Spring Boot 4.0.6 · PostgreSQL · Arquitetura Hexagonal  
**Repositório:** `ifinance_api/` (mesmo diretório que este arquivo)

---

## Sumário

**Parte I — Produto**
1. [Identidade do produto](#1-identidade-do-produto)
2. [Hierarquia de funcionalidades](#2-hierarquia-de-funcionalidades)
3. [Tipos de cálculo suportados](#3-tipos-de-cálculo-suportados)

**Parte II — Arquitetura Técnica**
4. [Stack e decisões técnicas](#4-stack-e-decisões-técnicas)
5. [Arquitetura hexagonal](#5-arquitetura-hexagonal)
6. [Motor de cálculo financeiro](#6-motor-de-cálculo-financeiro)
7. [Módulos implementados](#7-módulos-implementados)
8. [API REST](#8-api-rest)
9. [Banco de dados](#9-banco-de-dados)
10. [Configuração multi-ambiente](#10-configuração-multi-ambiente)
11. [Testes](#11-testes)

**Parte III — Roadmap**
12. [O que está implementado](#12-o-que-está-implementado)
13. [O que falta](#13-o-que-falta)
14. [Roadmap de versões](#14-roadmap-de-versões)

---

## Parte I — Produto

---

## 1. Identidade do produto

O **iFinance** é uma plataforma de simulação financeira de precisão profissional, construída sobre um motor matemático com aritmética de ponto fixo (`BigDecimal`) — o mesmo padrão adotado por sistemas bancários reais.

### Proposta de valor

A maioria dos simuladores financeiros disponíveis online opera com `double`, não exibe o CET real, não permite comparar cenários lado a lado e não aplica correção monetária por índices de mercado. O iFinance resolve isso sistematicamente:

| Problema do mercado | Solução do iFinance |
|---|---|
| Erros de arredondamento com `float/double` | `BigDecimal` com `MathContext.DECIMAL128` em todo o pipeline |
| CET calculado de forma simplificada | TIR do fluxo de caixa real via Newton-Raphson |
| Simuladores de parcela única, sem comparação | Histórico persistido, comparação de até 5 cenários |
| Índices econômicos estáticos ou desatualizados | Integração com BCB SGS em tempo real com cache Caffeine |
| Sem exportação estruturada | PDF (iText 9) e Excel (Apache POI 5) com tabela de amortização completa |

### Perfil de usuário principal (v1)

O usuário primário do v1 é alguém avaliando um financiamento — imobiliário, de veículo ou crédito pessoal — que quer entender o custo real da operação antes de assinar o contrato. Ele não precisa ser contador, mas precisa de números corretos.

O v2 expande para o investidor de renda fixa que quer comparar CDB, LCI, Tesouro IPCA+ e poupança em uma única tela, com IR calculado corretamente por prazo.

O v3 é voltado para uso profissional: gestores financeiros, contadores e analistas de projetos.

---

## 2. Hierarquia de funcionalidades

A tabela abaixo organiza todas as funcionalidades por versão e indica o status atual de implementação.

| Versão | Funcionalidade | Status |
|---|---|:---:|
| **v1** | Motor de cálculo com `BigDecimal` / `HALF_EVEN` | ✅ |
| **v1** | Amortização SAC | ✅ |
| **v1** | Amortização PRICE | ✅ |
| **v1** | Amortização Americana | ✅ |
| **v1** | Amortização Alemã | ✅ |
| **v1** | Amortização SAM (mista) | ✅ |
| **v1** | CET via TIR (Newton-Raphson + bissecção) | ✅ |
| **v1** | Encargos CET (IOF, seguros, tarifas) | ✅ |
| **v1** | Correção monetária por IPCA / IGP-M / CDI / SELIC / TR | ✅ |
| **v1** | Integração BCB SGS (Banco Central) | ✅ |
| **v1** | Cache de índices econômicos (Caffeine, 60 min TTL) | ✅ |
| **v1** | Persistência de simulações no PostgreSQL | ✅ |
| **v1** | Histórico de simulações (paginado) | ✅ |
| **v1** | Comparação de até 5 simulações | ✅ |
| **v1** | Exportação PDF (iText 9) | ✅ |
| **v1** | Exportação Excel / XLSX (Apache POI 5) | ✅ |
| **v1** | API REST documentada (OpenAPI 3 / Swagger UI) | ✅ |
| **v1** | Autenticação OAuth2 (Google) | ✅ |
| **v1** | Versionamento de simulações por snapshots | ✅ |
| **v2** | Renda fixa — CDB, LCI, LCA, Debêntures | ✅ |
| **v2** | Renda fixa — Tesouro Selic e IPCA+ | ✅ |
| **v2** | Renda fixa — Pré-fixado | ✅ |
| **v2** | IR regressivo por prazo (22,5% / 20% / 17,5% / 15%) | ✅ |
| **v2** | Comparação de até 5 investimentos | ✅ |
| **v2** | Histórico de investimentos (paginado) | ✅ |
| **v2** | VPL como endpoint exposto | ✅ |
| **v2** | TIR como endpoint exposto | ✅ |
| **v2** | Payback simples e descontado | ✅ |
| **v2** | Liquidação antecipada com desconto | ✅ |
| **v2** | Simulation snapshots expostos (histórico de versões) | ✅ |
| **v2** | Comparação direta de produtos de renda fixa | ✅ |
| **v2** | Planejamento de aposentadoria (FIRE / regra dos 4%) | ✅ |
| **v2** | Calculadora de reserva de emergência | ✅ |
| **v3** | Métricas de risco (Sharpe, drawdown, beta, alpha) | ❌ |
| **v3** | Simulação de Monte Carlo | ❌ |
| **v3** | DRE simulado, ponto de equilíbrio, markup | ❌ |
| **v3** | Depreciação de ativos | ❌ |
| **v3** | Simulação de regimes tributários (Simples, Presumido, Real) | ❌ |
| **v3** | Módulo trabalhista (FGTS, rescisão, IRRF, INSS) | ❌ |
| **v3** | GitHub OAuth2 | ❌ |
| **v2** | Frontend (Vue 3 + Vite + TailwindCSS v4) | ✅ |

**Legenda:** ✅ implementado · ⚠️ parcialmente · ❌ não implementado

---

## 3. Tipos de cálculo suportados

### 3.1 Crédito e financiamento

| Cálculo | Fórmula / Método | Status |
|---|---|:---:|
| Juros simples | `J = C · i · n` | ✅ |
| Juros compostos | `M = C(1 + i)ⁿ` | ✅ |
| Amortização SAC | `A = PV/n`; `J_t = Saldo_t × i`; parcelas decrescentes | ✅ |
| Amortização PRICE | `PMT = PV · [i(1+i)ⁿ] / [(1+i)ⁿ − 1]`; parcelas fixas | ✅ |
| Amortização Americana | Juros periódicos + balão no vencimento | ✅ |
| Amortização Alemã | `A = PV/n`; juros sobre saldo original; total constante | ✅ |
| Amortização SAM | `PMT_SAM_t = (PMT_SAC_t + PMT_PRICE) / 2` | ✅ |
| CET via TIR | Fluxo real com encargos; Newton-Raphson + bissecção | ✅ |
| Correção monetária | Aplicada sobre saldo devedor por índice do BCB | ✅ |
| Conversão de taxas | Nominal ↔ Efetiva; Anual ↔ Periódica; Fisher | ✅ |
| Liquidação antecipada | Valor presente das parcelas futuras + desconto | ✅ |
| Capacidade de crédito | Comprometimento de renda (30%) | ❌ |
| Desconto simples/composto | Racional (por dentro) e comercial (por fora) | ❌ |

### 3.2 Investimentos e renda fixa

| Cálculo | Descrição | Status |
|---|---|:---:|
| CDB / Pré-fixado | Taxa fixa, IR regressivo | ✅ |
| CDB / CDI% | Percentual do CDI diário, anualizado (252 dias úteis) | ✅ |
| LCI / LCA | Isento de IR; mesma base CDI ou pré | ✅ |
| Debêntures | Tributação normal; CDI ou pré | ✅ |
| Tesouro Selic | SELIC% diária, anualizada | ✅ |
| Tesouro IPCA+ | IPCA mensal + spread real; composto | ✅ |
| Retorno bruto / líquido | Com e sem IR calculado corretamente | ✅ |
| IR regressivo | 22,5% (≤180d) / 20% (≤360d) / 17,5% (≤720d) / 15% (>720d) | ✅ |
| VPL | Somatório de fluxos descontados a valor presente | ✅ |
| TIR | Taxa que torna VPL = 0 (Newton-Raphson) | ✅ |
| Payback simples | Período de recuperação do investimento | ✅ |
| Payback descontado | Payback considerando valor do dinheiro no tempo | ✅ |
| Índice de Sharpe | `(R − Rf) / σ` | ❌ |
| Drawdown máximo | Queda máxima em período | ❌ |
| Beta e Alpha | Sensibilidade e retorno excedente ao benchmark | ❌ |
| Monte Carlo | Múltiplas iterações com variância nos retornos | ❌ |

### 3.3 Índices econômicos

| Índice | Fonte (BCB SGS) | Periodicidade | Código | Status |
|---|---|---|---|:---:|
| IPCA | IBGE via BCB | Mensal | 433 | ✅ |
| IGP-M | FGV via BCB | Mensal | 189 | ✅ |
| CDI | CETIP via BCB | Diário | 12 | ✅ |
| SELIC | BCB | Diário | 11 | ✅ |
| TR | BCB | Mensal | 226 | ✅ |

### 3.4 Planejamento pessoal

| Cálculo | Descrição | Status |
|---|---|:---:|
| Reserva de emergência | 6–12 meses de custos fixos | ❌ |
| Aposentadoria FIRE | Montante para retirada perpétua (regra dos 4%) | ❌ |
| Comparação de cenários | Salvar e comparar múltiplas simulações | ✅ |

### 3.5 Empresarial e tributário

| Cálculo | Descrição | Status |
|---|---|:---:|
| DRE simulado | Margem bruta, EBITDA, lucro líquido | ❌ |
| Ponto de equilíbrio | `Qtd = CF / (PV − CV)` | ❌ |
| Markup | Índice sobre custo para cobrir despesas e lucro | ❌ |
| Depreciação | Linear e acelerada | ❌ |
| Simples Nacional | Alíquotas progressivas por faixa de receita | ❌ |
| Lucro Presumido / Real | Comparativo de regimes tributários | ❌ |
| Folha de pagamento | INSS, IRRF, FGTS, férias, 13º, rescisão | ❌ |

---

## Parte II — Arquitetura Técnica

---

## 4. Stack e decisões técnicas

### 4.1 Tecnologias

| Categoria | Tecnologia | Versão | Papel |
|---|---|---|---|
| Linguagem | Java | 25 | Linguagem principal |
| Framework | Spring Boot | 4.0.6 | Aplicação, DI, autoconfig |
| ORM | Spring Data JPA / Hibernate | 7.2 | Persistência |
| Banco de dados | PostgreSQL | 16+ | Armazenamento principal |
| Migrações | Flyway | (boot) | Versionamento do schema |
| Cache | Caffeine | 3.x | Cache em memória de índices |
| Segurança | Spring Security + OAuth2 | (boot) | Autenticação delegada |
| HTTP Client | Spring RestClient | (boot) | Chamadas ao BCB |
| PDF | iText Core | 9.1.0 | Relatórios de amortização |
| Excel | Apache POI | 5.4.0 | Planilhas XLSX |
| Documentação | springdoc-openapi | 3.0.2 | Swagger UI / OpenAPI 3 |
| Config Server | Spring Cloud Config | 2025.1.1 | Configuração externalizada |
| Mapeamento | MapStruct | 1.6.3 | DTO ↔ domínio (gerado em compile-time) |
| Boilerplate | Lombok | (boot) | @Getter, @Slf4j, @Builder |
| Testes | JUnit 5 + Mockito | (boot) | Unitários e mocks |
| Testes IT | Testcontainers | 1.21.0 | PostgreSQL real nos testes |

### 4.2 Decisões de design

**BigDecimal em todo o pipeline.** Nenhum `double` ou `float` é usado em cálculos financeiros. Constantes são sempre `new BigDecimal("0.01")`, nunca `BigDecimal.valueOf(0.01)` — que herdaria o erro de representação binária do IEEE 754.

**Arredondamento HALF_EVEN (bancário).** Ao arredondar 0,5, o sistema escolhe o inteiro par mais próximo, reduzindo o viés acumulado em séries longas de parcelas. Taxas intermediárias usam 10 casas decimais; valores monetários finais usam 2.

**MapStruct gerado em compile-time.** As implementações dos mappers (`*MapperImpl.java`) são geradas pelo processador de anotações durante a compilação (`mvn compile`), não em runtime via reflection. Isso elimina custo de inicialização e garante type-safety.

**Cache persistido de índices.** O BCB retorna IPCA, CDI, SELIC etc. como percentuais (ex.: `0.67` significa `0,67%`). Antes de qualquer cálculo, o sistema divide por 100. Os valores são persistidos na tabela `index_rates` para reprodutibilidade histórica.

**Sem auto-DDL.** O `ddl-auto` é sempre `validate` em todos os ambientes. O Flyway controla o schema — jamais o Hibernate.

---

## 5. Arquitetura hexagonal

```
┌──────────────────────────────────────────────────────────────┐
│  api/                                                        │
│  Controllers · DTOs · MapStruct Mappers · OpenAPI · Advice   │
├──────────────────────────────────────────────────────────────┤
│  application/                                                │
│  Casos de uso · Orquestração · Exceções de aplicação         │
├──────────────────────────────────────────────────────────────┤
│  domain/                                                     │
│  Motor de cálculo · Entidades · Value Objects · Portas       │
│  (zero imports de Spring — Java puro, testável isolado)      │
├──────────────────────────────────────────────────────────────┤
│  infrastructure/                                             │
│  JPA · Flyway · Caffeine · BCB API · iText · POI · Security  │
└──────────────────────────────────────────────────────────────┘
```

**Regra de dependência:** cada camada só importa as camadas abaixo. O `domain` não conhece Spring. O `application` não conhece JPA. As inversões são resolvidas por interfaces definidas no domínio e implementadas na infraestrutura.

### Fluxo completo de uma simulação

```
POST /api/v1/simulations
  └── SimulationController               (api)
        └── RunSimulationUseCase         (application)
              ├── AmortizationEngine     (domain/math) ← SAC, PRICE, etc.
              ├── RateConverter          (domain/math) ← nominal → efetiva
              ├── InflationCorrectionEngine (domain/math) ← se habilitado
              ├── IrrCalculator          (domain/math) ← CET, se habilitado
              │     └── NpvCalculator    (domain/math)
              ├── BcbIndexRateAdapter    (infrastructure/bcb) ← índices BCB
              │     └── Caffeine cache  → BCB SGS API
              └── SimulationRepository  (domain porta)
                    └── SimulationRepositoryAdapter (infrastructure/persistence)
                          └── SimulationJpaRepository (Spring Data JPA)
```

### Estrutura de pacotes

```
src/main/java/com/willembergfilho/ifinance/
│
├── domain/
│   ├── math/
│   │   ├── AmortizationEngine.java       ← 5 sistemas de amortização
│   │   ├── IrrCalculator.java            ← TIR: Newton-Raphson + bissecção
│   │   ├── NpvCalculator.java            ← VPL e derivada para TIR
│   │   ├── PaybackCalculator.java        ← payback simples e descontado
│   │   ├── RateConverter.java            ← conversões de taxa
│   │   ├── InflationCorrectionEngine.java ← correção por índice
│   │   ├── MonetaryRounding.java         ← constantes de arredondamento
│   │   └── CalculationException.java
│   ├── simulation/
│   │   ├── Simulation.java               ← aggregate root
│   │   ├── SimulationParameters.java     ← record (VO)
│   │   ├── AmortizationSchedule.java     ← tabela calculada
│   │   ├── Installment.java              ← record (VO) por período
│   │   ├── PrepaymentResult.java         ← record (VO): liquidação antecipada
│   │   ├── SimulationSnapshot.java       ← record (VO): snapshot de parâmetros
│   │   ├── AmortizationSystem.java       ← enum: SAC, PRICE, AMERICAN, GERMAN, SAM
│   │   ├── Periodicity.java              ← enum: MONTHLY(12), QUARTERLY(4), ANNUAL(1)
│   │   ├── RateType.java                 ← enum: NOMINAL, EFFECTIVE
│   │   ├── CetCharge.java                ← record (VO): encargo individual
│   │   ├── CetResult.java                ← record (VO): resultado do CET
│   │   ├── SimulationRepository.java     ← porta (interface)
│   │   └── SnapshotRepository.java       ← porta (interface)
│   ├── investment/
│   │   ├── Investment.java               ← aggregate root
│   │   ├── InvestmentParameters.java     ← record (VO)
│   │   ├── InvestmentResult.java         ← record (VO)
│   │   ├── InvestmentType.java           ← enum: CDB, LCI, LCA, DEBENTURE, TESOURO_*
│   │   ├── RateBasis.java                ← enum: CDI_PERCENT, SELIC_PERCENT, IPCA_PLUS, PRE_FIXADO
│   │   └── InvestmentRepository.java     ← porta (interface)
│   ├── index/
│   │   ├── EconomicIndex.java            ← enum com código SGS do BCB
│   │   ├── IndexRate.java                ← record (VO)
│   │   └── IndexRateRepository.java      ← porta (interface)
│   └── export/
│       └── SimulationExporter.java       ← porta (interface)
│
├── application/
│   ├── simulation/
│   │   ├── RunSimulationUseCase.java
│   │   ├── GetSimulationHistoryUseCase.java
│   │   ├── CompareSimulationsUseCase.java
│   │   ├── ExportSimulationUseCase.java
│   │   ├── PrepaymentUseCase.java          ← liquidação antecipada
│   │   ├── GetSnapshotsUseCase.java
│   │   ├── CreateSnapshotUseCase.java
│   │   └── SimulationNotFoundException.java
│   ├── analysis/
│   │   └── FinancialAnalysisUseCase.java   ← VPL, TIR, payback
│   ├── investment/
│   │   ├── RunInvestmentUseCase.java
│   │   ├── GetInvestmentHistoryUseCase.java
│   │   ├── CompareInvestmentsUseCase.java
│   │   └── InvestmentNotFoundException.java
│   └── index/
│       └── FetchIndexRateUseCase.java
│
├── infrastructure/
│   ├── persistence/
│   │   ├── entity/  (SimulationEntity, InvestmentEntity, InstallmentEntity,
│   │   │             CetChargeEntity, IndexRateEntity, SimulationSnapshotEntity,
│   │   │             UserEntity)
│   │   ├── mapper/  (SimulationMapper, InvestmentMapper)
│   │   ├── SimulationJpaRepository.java
│   │   ├── InvestmentJpaRepository.java
│   │   ├── IndexRateJpaRepository.java
│   │   ├── SimulationSnapshotJpaRepository.java
│   │   ├── UserJpaRepository.java
│   │   ├── SimulationRepositoryAdapter.java
│   │   ├── InvestmentRepositoryAdapter.java
│   │   ├── IndexRateRepositoryAdapter.java
│   │   └── SimulationSnapshotAdapter.java  ← JSONB ↔ SimulationParameters
│   ├── bcb/
│   │   ├── BcbClient.java                ← RestClient → SGS do BCB
│   │   ├── BcbIndexRateAdapter.java      ← implementa IndexRateRepository
│   │   └── BcbIndexResponse.java
│   ├── export/
│   │   ├── PdfExporter.java              ← iText 9
│   │   ├── ExcelExporter.java            ← Apache POI 5
│   │   └── SimulationExporterAdapter.java
│   ├── cache/
│   │   └── CaffeineConfig.java
│   └── security/
│       ├── SecurityConfig.java
│       ├── UserContextHolder.java
│       ├── UserSyncService.java
│       └── DevUserInitializer.java
│
└── api/
    ├── simulation/
    │   ├── SimulationController.java     ← inclui prepayment e snapshots
    │   ├── SimulationRequest.java        ← @NotBlank, @NotNull, @Positive
    │   ├── SimulationResponse.java
    │   ├── CetChargeRequest.java
    │   ├── CetResultResponse.java
    │   ├── InstallmentResponse.java
    │   ├── PrepaymentResponse.java
    │   ├── SnapshotResponse.java
    │   └── SimulationRequestMapper.java  ← @Mapper MapStruct
    ├── analysis/
    │   ├── AnalysisController.java       ← POST /api/v1/analysis
    │   ├── AnalysisRequest.java
    │   └── AnalysisResponse.java
    ├── investment/
    │   ├── InvestmentController.java
    │   ├── InvestmentRequest.java
    │   ├── InvestmentResponse.java
    │   └── InvestmentRequestMapper.java  ← @Mapper MapStruct
    ├── index/
    │   └── IndexController.java
    ├── export/
    │   └── ExportController.java
    ├── advice/
    │   ├── GlobalExceptionHandler.java   ← scoped to api package
    │   └── ApiError.java                ← {timestamp, status, error, message, path}
    └── OpenApiConfig.java
```

---

## 6. Motor de cálculo financeiro

O motor vive inteiramente em `domain/math` sem nenhuma dependência de framework.

### 6.1 Precisão monetária

```java
// MonetaryRounding.java
public static final MathContext MC   = MathContext.DECIMAL128; // 34 dígitos
public static final RoundingMode MODE = RoundingMode.HALF_EVEN;

public static BigDecimal round(BigDecimal value) {
    return value.setScale(2, MODE);      // valores monetários: 2 casas
}
public static BigDecimal roundRate(BigDecimal rate) {
    return rate.setScale(10, MODE);      // taxas intermediárias: 10 casas
}
```

A separação entre `round` e `roundRate` é deliberada. Arredondar taxas prematuramente gera erro acumulativo em financiamentos de 360 parcelas.

### 6.2 Sistemas de amortização

| Sistema | Parcela | Característica |
|---|---|---|
| **SAC** | Decrescente | `A = PV/n` fixo; juros caem com o saldo |
| **PRICE** | Constante | `PMT = PV · i(1+i)ⁿ / [(1+i)ⁿ−1]`; amortização cresce |
| **Americano** | Juros + balão | Períodos 1..n-1: só juros; período n: principal + juros |
| **Alemão** | Constante | `A = PV/n` + juros sobre o principal original (não o saldo) |
| **SAM** | Levemente decrescente | Média aritmética entre SAC e PRICE em cada período |

### 6.3 CET — Custo Efetivo Total

O CET é a taxa que iguala o valor presente dos pagamentos futuros ao valor **líquido** efetivamente recebido. Não é uma soma de percentuais — é a TIR do fluxo real.

```
0 = −Valor líquido recebido + Σ [ (Parcela_t + Encargos_t) / (1 + CET)^t ]
```

**Encargos suportados:**

| Tipo | Aplicação |
|---|---|
| IOF | Percentual ou fixo, na contratação (período 0) |
| Seguro MIP | Percentual sobre saldo devedor, mensal |
| Seguro DFI | Fixo mensal |
| Tarifa de cadastro | Fixo, uma vez (período 0) |
| Tarifa de avaliação | Fixo, uma vez (período 0) |
| Tarifa de administração | Fixo ou percentual mensal |

**Algoritmo:**
1. Newton-Raphson com chute inicial de 10%
2. Fallback para bissecção quando a derivada converge para zero
3. Precisão de convergência: `10⁻¹⁰`

### 6.4 Conversão de taxas

```java
// Nominal mensal → Efetiva anual
// (1 + i_mensal)^12 − 1
BigDecimal effective = base.pow(periods, MC).subtract(ONE, MC);

// Taxa efetiva anual → Taxa por período
// (1 + i_anual)^(1/n) − 1
BigDecimal periodic = effectiveAnnual.add(ONE, MC)
    .pow(1.0 / periodsPerYear)  // via Math.pow para expoente fracionário
    .subtract(ONE, MC);

// Taxa real (Fórmula de Fisher)
// (1 + r_real) = (1 + r_nominal) / (1 + inflação)
BigDecimal real = num.divide(den, MC).subtract(ONE, MC);
```

### 6.5 Correção monetária por índice

O `InflationCorrectionEngine` recebe o cronograma calculado e uma lista de taxas periódicas (vindas do BCB). A correção é aplicada ao `additionalCharges` de cada parcela — o saldo devedor é reajustado pelo índice acumulado.

**Atenção ao formato BCB:** o BCB retorna valores percentuais (`0.67` = `0,67%`). O sistema divide por 100 antes de qualquer operação matemática.

---

## 7. Módulos implementados

### 7.1 Simulação de financiamentos

Endpoint central: `POST /api/v1/simulations`

Recebe: sistema de amortização, valor, taxa (nominal ou efetiva), prazo, periodicidade, encargos CET (opcional), índice de correção (opcional).

Produz: tabela completa de amortização linha a linha, totalPaid, CET (se habilitado), parcelas corrigidas (se habilitado).

### 7.2 Investimentos de renda fixa

Endpoint: `POST /api/v1/investments`

Suporta 7 tipos de produto e 4 bases de taxa. Busca automaticamente o índice mais recente do BCB (CDI, SELIC, IPCA) quando necessário. Aplica IR regressivo por prazo automaticamente. LCI e LCA são marcados como `isTaxExempt = true` no domínio.

**CDI anualizado:** `(1 + CDI_diário)^252 − 1`  
**SELIC anualizado:** `(1 + SELIC_diária)^252 − 1`  
**IPCA anualizado:** `(1 + IPCA_mensal)^12 − 1`

### 7.3 Índices econômicos

Endpoint: `GET /api/v1/indexes/{index}/current` e `GET /api/v1/indexes/{index}`

O `BcbIndexRateAdapter` implementa a estratégia cache-aside:
1. Consulta `index_rates` no banco
2. Se não encontrar, chama a API SGS do BCB
3. Persiste o resultado para uso futuro
4. O `@Cacheable` do Spring com Caffeine adiciona uma camada de cache em memória com TTL de 60 min

Para períodos futuros, o sistema usa a última taxa disponível como projeção e marca `isProjection = true` no `IndexRate`.

### 7.4 Exportação

Endpoint: `GET /api/v1/simulations/{id}/export?format=pdf|xlsx`

**PDF (iText 9):** capa com parâmetros da simulação, tabela de amortização completa com formatação pt-BR (R$, vírgula decimal), subtotais por grupo.

**Excel (Apache POI 5):** 2 abas — "Parâmetros" com metadados da simulação e "Cronograma" com todas as colunas da tabela de amortização.

---

## 8. API REST

Todos os endpoints estão sob o prefixo `/api/v1`. A documentação interativa está disponível em `/swagger-ui.html`.

### Simulações

| Método | Endpoint | Descrição | Status HTTP |
|---|---|---|---|
| `POST` | `/api/v1/simulations` | Executa nova simulação | 201 Created |
| `GET` | `/api/v1/simulations/{id}` | Busca simulação por ID | 200 OK / 404 |
| `GET` | `/api/v1/simulations/history` | Histórico paginado do usuário | 200 OK |
| `GET` | `/api/v1/simulations/compare?ids=...` | Compara até 5 simulações | 200 OK |
| `GET` | `/api/v1/simulations/{id}/export` | Exporta PDF ou Excel | 200 OK / 404 |
| `GET` | `/api/v1/simulations/{id}/prepayment?period={n}` | Liquidação antecipada com desconto | 200 OK / 404 |
| `GET` | `/api/v1/simulations/{id}/snapshots` | Lista snapshots de parâmetros | 200 OK / 404 |
| `POST` | `/api/v1/simulations/{id}/snapshots` | Salva snapshot dos parâmetros atuais | 201 Created / 404 |

### Investimentos

| Método | Endpoint | Descrição | Status HTTP |
|---|---|---|---|
| `POST` | `/api/v1/investments` | Calcula retorno de investimento | 201 Created |
| `GET` | `/api/v1/investments/{id}` | Busca investimento por ID | 200 OK / 404 |
| `GET` | `/api/v1/investments/history` | Histórico paginado do usuário | 200 OK |
| `GET` | `/api/v1/investments/compare?ids=...` | Compara até 5 investimentos salvos | 200 OK |
| `POST` | `/api/v1/investments/compare-direct` | Compara até 5 produtos sem salvar | 200 OK |

### Planejamento pessoal

| Método | Endpoint | Descrição | Status HTTP |
|---|---|---|---|
| `POST` | `/api/v1/planning/retirement` | Planejamento FIRE (regra dos 4%) | 200 OK |
| `POST` | `/api/v1/planning/emergency` | Calculadora de reserva de emergência | 200 OK |

### Análise financeira

| Método | Endpoint | Descrição | Status HTTP |
|---|---|---|---|
| `POST` | `/api/v1/analysis` | VPL, TIR, payback simples e descontado | 200 OK |

**Request:**
```json
{
  "cashFlows": [-100000, 30000, 35000, 40000, 45000],
  "discountRate": 0.10
}
```

**Response:**
```json
{
  "npv": 17986.44,
  "npvPositive": true,
  "irrPercent": 23.14,
  "irrDecimal": 0.2314,
  "paybackAchieved": true,
  "simplePayback": 3.11,
  "simplePaybackPeriod": 4,
  "discountedPayback": 3.68,
  "discountedPaybackPeriod": 4
}
```

### Índices econômicos

| Método | Endpoint | Descrição | Status HTTP |
|---|---|---|---|
| `GET` | `/api/v1/indexes/{index}/current` | Taxa atual do índice | 200 OK |
| `GET` | `/api/v1/indexes/{index}` | Taxas em período | 200 OK |

### Formato de erro

Todos os erros retornam o envelope:

```json
{
  "timestamp": "2026-05-15T12:34:56.789Z",
  "status": 400,
  "error": "Validation Error",
  "message": "name: must not be blank",
  "path": "/api/v1/simulations"
}
```

| Situação | HTTP | `error` |
|---|---|---|
| Campos inválidos (`@NotBlank`, `@Positive`) | 400 | `Validation Error` |
| JSON malformado | 400 | `Bad Request` |
| Recurso não encontrado | 404 | `Not Found` |
| Erro de cálculo (TIR não convergiu) | 422 | `Calculation Error` |
| Acesso negado | 403 | `Forbidden` |
| Erro interno | 500 | `Internal Server Error` |

### Exemplo — POST /api/v1/simulations

**Request:**
```json
{
  "name": "Financiamento Imobiliário",
  "amortizationSystem": "SAC",
  "principal": 350000,
  "interestRate": 11.75,
  "rateType": "NOMINAL",
  "term": 360,
  "periodicity": "MONTHLY",
  "cetEnabled": true,
  "inflationCorrectionEnabled": true,
  "inflationIndex": "IPCA",
  "charges": [
    { "description": "Seguro MIP", "chargeType": "PERCENTAGE", "amount": 0.003, "appliesOnPeriod": null },
    { "description": "Tarifa de Cadastro", "chargeType": "FIXED", "amount": 1500, "appliesOnPeriod": 0 }
  ]
}
```

**Response (201 Created):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Financiamento Imobiliário",
  "amortizationSystem": "SAC",
  "principal": 350000.00,
  "interestRate": 11.75,
  "term": 360,
  "totalPaid": 812345.67,
  "cet": { "monthlyRate": 0.0102, "annualRate": 0.1295 },
  "installments": [
    {
      "periodNumber": 1,
      "principalBalanceBefore": 350000.00,
      "amortization": 972.22,
      "interest": 3307.29,
      "additionalCharges": 1050.00,
      "total": 5329.51,
      "principalBalanceAfter": 349027.78
    }
    ...
  ]
}
```

---

## 9. Banco de dados

Sete migrações Flyway criam o schema. Todos os valores monetários usam `NUMERIC` sem escala fixa — mapeia diretamente para `BigDecimal`.

### Diagrama de relacionamentos

```
users ─────┬──── simulations ─────┬──── installments
           │                      ├──── cet_charges
           │                      └──── simulation_snapshots
           │
           └──── investments

index_rates (independente — cache do BCB)
```

### Tabelas

#### `users` (V1)
| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | UUID PK | — |
| `subject_id` | VARCHAR UNIQUE | `sub` do token OAuth2 |
| `email` | VARCHAR UNIQUE | — |
| `name` | VARCHAR | Nome de exibição |
| `provider` | VARCHAR | `google`, `github` |
| `created_at`, `updated_at` | TIMESTAMPTZ | — |

#### `simulations` (V2)
| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | UUID PK | — |
| `user_id` | UUID FK | → users |
| `name` | VARCHAR | Rótulo do usuário |
| `amortization_system` | VARCHAR | SAC / PRICE / AMERICAN / GERMAN / SAM |
| `principal` | NUMERIC | Valor financiado |
| `interest_rate` | NUMERIC | Taxa por período |
| `rate_type` | VARCHAR | NOMINAL / EFFECTIVE |
| `term` | INTEGER | Número de períodos |
| `periodicity` | VARCHAR | MONTHLY / QUARTERLY / ANNUAL |
| `cet_enabled` | BOOLEAN | — |
| `inflation_correction_enabled` | BOOLEAN | — |
| `inflation_index` | VARCHAR | IPCA / IGP_M / CDI / null |
| `total_paid` | NUMERIC | Total calculado |
| `effective_cost_rate` | NUMERIC | CET final (null se desabilitado) |
| `status` | VARCHAR | DRAFT / CALCULATED / EXPORTED |

#### `installments` (V3)
| Coluna | Tipo | Descrição |
|---|---|---|
| `simulation_id` | UUID FK | → simulations |
| `period_number` | INTEGER | 1..n |
| `principal_balance_before` | NUMERIC | Saldo antes |
| `amortization` | NUMERIC | Amortização do período |
| `interest` | NUMERIC | Juros do período |
| `additional_charges` | NUMERIC | Encargos + correção monetária |
| `total` | NUMERIC | Soma das colunas acima |
| `principal_balance_after` | NUMERIC | Saldo após |
| `corrected_total` | NUMERIC | Parcela corrigida (null se não habilitado) |

#### `cet_charges` (V4)
| Coluna | Tipo | Descrição |
|---|---|---|
| `simulation_id` | UUID FK | → simulations |
| `description` | VARCHAR | IOF, Seguro MIP, etc. |
| `charge_type` | VARCHAR | FIXED / PERCENTAGE |
| `amount` | NUMERIC | Valor ou alíquota |
| `applies_on_period` | INTEGER | null = todas; 0 = contratação; n = período n |

#### `index_rates` (V5)
| Coluna | Tipo | Descrição |
|---|---|---|
| `index_code` | VARCHAR | IPCA / CDI / SELIC / TR / IGP_M |
| `reference_date` | DATE | Mês de referência |
| `rate` | NUMERIC | Valor em % (ex.: 0.67 = 0,67%) |
| `source` | VARCHAR | BCB_SGS / manual |
| `fetched_at` | TIMESTAMPTZ | Quando foi buscado |

Constraint: `UNIQUE(index_code, reference_date)` — nenhum índice é duplicado.

#### `simulation_snapshots` (V6)
| Coluna | Tipo | Descrição |
|---|---|---|
| `simulation_id` | UUID FK | → simulations |
| `parameters_snapshot` | JSONB | Estado completo (imutável) |
| `snapshot_at` | TIMESTAMPTZ | — |

Índice GIN no `parameters_snapshot` para filtros em campos JSONB.

#### `investments` (V7)
| Coluna | Tipo | Descrição |
|---|---|---|
| `user_id` | UUID FK | → users |
| `name` | VARCHAR | — |
| `investment_type` | VARCHAR | CDB / LCI / LCA / DEBENTURE / TESOURO_* |
| `rate_basis` | VARCHAR | CDI_PERCENT / SELIC_PERCENT / IPCA_PLUS / PRE_FIXADO |
| `rate_value` | NUMERIC | Percentual ou taxa |
| `principal` | NUMERIC | Valor investido |
| `term_days` | INTEGER | Prazo em dias corridos |
| `start_date` | DATE | Data de início |
| `is_tax_exempt` | BOOLEAN | LCI/LCA = true |
| `gross_return` | NUMERIC | Rendimento bruto |
| `net_return` | NUMERIC | Rendimento líquido (após IR) |
| `ir_rate` | NUMERIC | Alíquota efetiva aplicada |
| `ir_amount` | NUMERIC | Valor do IR |
| `gross_annual_rate` | NUMERIC | Taxa bruta anual equivalente |
| `net_annual_rate` | NUMERIC | Taxa líquida anual equivalente |
| `index_rate_used` | NUMERIC | Índice BCB utilizado (null para pré-fixado) |
| `status` | VARCHAR | CALCULATED |

---

## 10. Configuração multi-ambiente

| Profile | Ativo em | Porta | Pool | Swagger | Log |
|---|---|---|---|---|---|
| `local` | Desenvolvimento | 8888 | 5 | ✅ habilitado | DEBUG |
| `docker` | Containers | 8080 | 10 | ✅ habilitado | DEBUG |
| `prod` | Produção | `${SERVER_PORT}` | 20 | ❌ desabilitado | INFO/WARN |
| `test` | Testes CI | — (Testcontainers) | — | ❌ | INFO |

**Cache Caffeine:**
- local/docker: `maximumSize=500, expireAfterWrite=60m`
- prod: `maximumSize=2000, expireAfterWrite=60m`
- test: `maximumSize=100, expireAfterWrite=5m`

**Variáveis de ambiente (prod):**

| Variável | Descrição |
|---|---|
| `DB_HOST` | Host do PostgreSQL |
| `DB_PORT` | Porta (padrão 5432) |
| `DB_NAME` | Nome do banco |
| `DB_USERNAME` | Usuário |
| `DB_PASSWORD` | Senha |
| `SERVER_PORT` | Porta HTTP (padrão 8080) |

---

## 11. Testes

### Cobertura atual — 54 testes

| Classe | Testes | Escopo |
|---|---|---|
| `AmortizationEngineTest` | 22 | SAC, PRICE, AMERICAN, GERMAN, SAM + validações |
| `RunInvestmentUseCaseTest` | 8 | CDB, LCI, pré-fixado, IPCA+, 4 faixas de IR |
| `RateConverterTest` | 10 | Conversões nominal ↔ efetiva, taxa real |
| `IrrCalculatorTest` | 6 | TIR com convergência numérica |
| `SimulationControllerIT` | 7 | POST/GET com PostgreSQL real (Testcontainers) |
| `IfinanceApplicationTests` | 1 | Context load (inclui novos use cases e endpoints) |

Os testes de integração (`SimulationControllerIT`) usam `@Testcontainers(disabledWithoutDocker = true)` — são pulados automaticamente quando o Docker não está disponível e executados normalmente em CI.

### Lacunas de teste (o que não está coberto)

| Área | Situação |
|---|---|
| Exportação PDF/Excel | Sem testes — saídas binárias difíceis de assertar |
| Endpoints de índices BCB | Sem mock do BCB Client |
| Simulações com correção monetária | Sem teste de ponta a ponta |
| Simulações com CET | Sem teste de integração |
| OAuth2 / segurança | Sem testes com `@WithMockUser` |
| Simulation snapshots | Use cases e endpoints implementados, sem testes unitários |
| CompareSimulationsUseCase | Sem testes unitários |

---

## Parte III — Roadmap

---

## 12. O que está implementado

O sistema entrega hoje um **simulador de financiamento e renda fixa de precisão profissional**, com:

- **5 sistemas de amortização** com aritmética `BigDecimal`
- **CET real** calculado via TIR do fluxo de caixa com encargos
- **7 tipos de produto de renda fixa** com IR automático por prazo
- **Correção monetária** por 5 índices econômicos em tempo real (BCB)
- **Histórico e comparação** de simulações e investimentos
- **Exportação** em PDF e Excel com formatação financeira
- **API REST** versionada (`/api/v1`) com Swagger UI completo (5 grupos: simulação, investimento, exportação, índices, análise)
- **Segurança OAuth2** (Google)
- **Banco de dados** com 7 tabelas, precisão NUMERIC, schema versionado por Flyway
- **Cache** Caffeine em memória com persistência de índices no PostgreSQL
- **Arquitetura hexagonal** — domínio completamente isolado, testável sem Spring

---

## 13. O que falta

### Curto prazo (complementos naturais do v1/v2)

| Item | Impacto | Status |
|---|---|---|
| ~~Endpoint VPL/TIR~~ | Alto | ✅ implementado |
| ~~Payback simples e descontado~~ | Médio | ✅ implementado |
| ~~Liquidação antecipada com desconto~~ | Alto | ✅ implementado |
| ~~Simulation snapshots expostos~~ | Médio | ✅ implementado |
| ~~Comparador direto de renda fixa~~ | Alto | ✅ implementado |
| ~~Planejamento de aposentadoria (FIRE)~~ | Alto | ✅ implementado |
| ~~Calculadora de reserva de emergência~~ | Alto | ✅ implementado |
| Testes de exportação PDF/Excel | Médio — qualidade | pendente |
| Testes de integração para índices | Médio — qualidade | pendente |

### Médio prazo (v3)

| Item | Impacto | Esforço estimado |
|---|---|---|
| Análise de capacidade de crédito | Médio | Médio |
| GitHub OAuth2 | Baixo | Baixo |

### Longo prazo (v3)

| Item | Impacto | Esforço estimado |
|---|---|---|
| Simulação de Monte Carlo | Alto — análise de risco | Alto |
| Métricas de risco (Sharpe, drawdown, beta) | Alto — profissional | Alto |
| Módulo empresarial (DRE, ponto de equilíbrio) | Médio | Alto |
| Tributação (Simples, Presumido, Real) | Médio | Alto |
| Módulo trabalhista | Baixo (produto diferente) | Muito alto |
| Frontend | Necessário para produto final | Muito alto |

---

## 14. Roadmap de versões

```
v1 — Simulador de financiamento   [IMPLEMENTADO]
──────────────────────────────────────────────────
✅ Motor BigDecimal / HALF_EVEN
✅ SAC, PRICE, AMERICAN, GERMAN, SAM
✅ CET via TIR
✅ Correção por IPCA, IGP-M, CDI, SELIC, TR
✅ Exportação PDF e Excel
✅ Histórico e comparação de cenários
✅ OAuth2 Google
✅ API REST /api/v1 + Swagger

v2 — Plataforma financeira pessoal [IMPLEMENTADO]
──────────────────────────────────────────────────
✅ Renda fixa (CDB, LCI, LCA, Tesouro, pré-fixado)
✅ IR regressivo automático
✅ Histórico e comparação de investimentos
✅ Endpoint VPL/TIR/Payback (POST /api/v1/analysis)
✅ Liquidação antecipada (GET /{id}/prepayment?period=n)
✅ Snapshots de simulação (GET/POST /{id}/snapshots)
✅ Comparador direto de produtos (POST /api/v1/investments/compare-direct)
✅ Planejamento de aposentadoria FIRE (POST /api/v1/planning/retirement)
✅ Calculadora de reserva de emergência (POST /api/v1/planning/emergency)
✅ Frontend Vue 3 + Vite + TailwindCSS v4 (todas as páginas v2)

v3 — Módulos profissionais         [PLANEJADO]
──────────────────────────────────────────────────
❌ Métricas de risco (Sharpe, drawdown, beta, alpha)
❌ Monte Carlo
❌ DRE, ponto de equilíbrio, markup
❌ Regimes tributários (Simples, Presumido, Real)
❌ Controle de acesso por perfil
❌ Frontend
```

---

*Documento atualizado em maio/2026 — inclui VPL/TIR/Payback, Liquidação antecipada e Snapshots implementados.*

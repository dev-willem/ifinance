# CI Fixes — Backend e Frontend

## Problema 1: Backend — SimulationControllerIT

### Causa raiz

Spring Boot 4.0.6 + Spring Framework 7.0.7: quando `SimulationControllerIT` cria um novo contexto Spring (por ter `@AutoConfigureMockMvc`, que diferencia sua cache key), o `JacksonAutoConfiguration` não registra o bean `ObjectMapper` nesse contexto. O `IfinanceApplicationTests` passa porque reutiliza um contexto de outro teste.

### Solução aplicada

- Removido `@Autowired ObjectMapper` e `@Autowired WebApplicationContext`
- Removido `@BeforeEach setup()` com `MockMvcBuilders`
- `MockMvc` injetado diretamente via `@Autowired` (padrão com `@AutoConfigureMockMvc`)
- `ObjectMapper` criado localmente no único método que o usa

**Arquivo:** `ifinance_api/src/test/java/com/willembergfilho/ifinance/api/SimulationControllerIT.java`

---

## Problema 2: Frontend — ESLint

### Causa raiz

`eslint-plugin-vue@10.9.1` alterou a API de flat config. A chave `flat/vue3-strongly-recommended` retorna `undefined` nessa versão, causando `TypeError: not iterable`.

O pacote `@vue/eslint-config-typescript@14.5.0` (já presente no `package.json`) fornece um helper `vueTsEslintConfig()` que resolve a compatibilidade Vue + TypeScript + eslint-plugin-vue@10 de forma testada e oficial.

### Solução aplicada

- `eslint.config.mjs` reescrito usando `@vue/eslint-config-typescript`

**Arquivo:** `ifinance/eslint.config.mjs`

---

## Verificação

```bash
# Após o push, rodar manualmente:
# GitHub Actions → CI — Backend → Run workflow
# GitHub Actions → CI — Frontend → Run workflow
# Deploy dispara automaticamente quando ambos passam
```

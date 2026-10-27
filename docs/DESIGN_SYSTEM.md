# Design System — checkLoss (2026-10-27)

## Princípios
1. **Clareza:** indicadores e valores precisam ser compreendidos antes de elementos decorativos.
2. **Confiança:** deixar visível a origem dos dados (demonstração ou importação local).
3. **Acessibilidade:** contraste, elementos semânticos, alvos de toque e foco de teclado.
4. **Responsividade:** nenhuma ação principal escondida por overflow; a tabela rola horizontalmente no mobile.
5. **Privacidade:** não solicitar identificação nem publicar informações importadas.

## Tokens de Taste Skill
Aplicados em `styles.css` por variáveis de raiz:
- Superfícies: `--bg: #0b1220`, `--surface: #131f32`, `--surface-soft: #192942`.
- Texto: `--text: #eaf0fa`, `--muted: #a7b6cb`.
- Destaques: `--accent: #58d6c6`, `--accent-strong: #7ff0df`; foco: `--focus: #f7d778`.
- Raio: `--radius: 18px`. Escala de espaçamento de 4, 8, 12, 16, 24, 32 e 48 px.
- Layout: container máximo 1160 px; grid de 4 métricas, 2 em telas intermediárias e celulares.
- Tipografia: fonte do sistema, números tabulares em tabelas e gráficos.

## Componentes e estados
- `topbar`: marca e explicação de privacidade.
- `hero`: proposta de valor, importação, download do exemplo e exportação.
- `metrics`: quatro indicadores com números legíveis.
- `filters`: selects e inputs nativos com labels explícitos.
- `bar-chart`: escala relativa ao valor máximo e rótulos com valores completos.
- `insights`: dados derivados, sem recomendações automatizadas não fundamentadas.
- `records`: tabela com cabeçalhos e região rolável, até 500 linhas na visualização.
- Estados: carregando, demonstração, dados importados, erro e nenhum resultado.

## Web Design Guidelines / acessibilidade
- Link de pular para conteúdo; `aria-live` em status e erros; `role=region` nomeado na tabela.
- Controles nativos de filtro e arquivo; `:focus-visible` com borda contrastante.
- `prefers-reduced-motion` remove transições e scroll suave.
- Usar `textContent` para exibir campos importados, evitando HTML injetado.
- Não depender apenas de barras coloridas: mostrar valor numérico ao lado.

## Image to Code
A interface é composta de HTML/CSS nativos e um ícone SVG vetorial; não há conversão automática de mockup nem alegação de fidelidade visual a uma referência ausente. Iterações futuras devem comparar screenshots Playwright (390×844 e 1440×900) com referências aprovadas antes de mudar a identidade.

## Regressão / QA
Cobertura prioritária: rotas estáticas, CSV e JSON, limites de importação, filtros combinados, no-connection mode, overflow, erros de runtime e estado vazio. Implementação: `tests/smoke.spec.cjs`, `playwright.config.cjs` e Action do Pages.

## Ajustes de acessibilidade e deploy (27/10/2026)
- Importação usa `button` HTML nativo e não mais `label role="button"`, evitando depender de emulação manual de Enter/Espaço. O arquivo permanece ligado ao botão por `aria-controls` e a ajuda por `aria-describedby`.
- O campo file, acionado pelo botão, usa `tabindex="-1"` para oferecer um único ponto de foco; Playwright testa Enter/Espaço, importação real de JSON, indicadores atualizados e overflow em desktop/mobile.
- Para GitHub Pages em modo branch `gh-pages`, o workflow só publica assets depois que o QA da `main` conclui com sucesso; o job de sincronização tem permissão limitada de escrita no repositório. Para Pages em modo Actions, a publicação continua pelo job de artefato atual. Não armazenar segredos ou dados reais.

## Feedback de período inválido (27/10/2026)
O painel explicita quando Data inicial é posterior à Data final com um alerta semântico e bordas de erro nas duas datas (`aria-invalid`). Nessa condição, a tabela e os indicadores deixam de exibir valores enganadores e o CSV é desabilitado. Ao corrigir o período ou clicar em Limpar filtros, os resultados voltam imediatamente. Playwright testa o comportamento no desktop e celular.

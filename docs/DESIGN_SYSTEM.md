# checkLoss — Design System

## Taste Skill: escala e tokens
- Fundo #f5f7fb, superfície branca e cabeçalho #101b33.
- Texto principal #1b2a41, apoio #667690, ação #346be8 e foco #145aca.
- Borda #e0e7f1, raio 16px e espaçamento 4, 8, 12, 16, 24, 32, 48px.
- Escala tipográfica fluida para título; fonte nativa do sistema para leveza.

## Web Design Guidelines
- Elementos semânticos, labels reais, skip-link, anúncio de feedback role=status.
- Controles acessíveis por teclado, modal HTML nativo, foco restaurado e erros explícitos.
- Gráfico com texto de setor e valor, sem depender apenas da cor.
- Foco visível, responsividade, redução de movimento.
- Conteúdo importado adicionado com textContent, nunca via HTML interpolado.
- Exclusões e importações substitutivas passam por confirmação.

## Awesome Design / Image to Code
- Interface funcional e editável, transformada em CSS/HTML (não uma captura estática).
- Cartões de KPIs, gráfico proporcional, tabela responsiva e painel de filtros.
- Espaço em branco, hierarquia de títulos e paleta contida para reduzir fadiga visual.

## Arquitetura sem banco
- localStorage por origem no navegador, sem contas, API ou sincronização.
- Exportação CSV e JSON, importação JSON validada até 500 itens e 1 MB.
- Exemplos sintéticos apenas; não usar dados internos ou pessoais na demo.

## QA Playwright CLI
- Testes para criar/excluir registro, persistir após reload, buscar, filtrar e exportar CSV.
- Screenshots de 360, 390, 768, 1366 e 1600px.
- Falha em JavaScript error ou overflow horizontal.
- GitHub Actions publica apenas quatro arquivos permitidos.

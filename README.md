# checkLoss — painel local de perdas

Experimento de análise de perdas para navegador, sem login, PHP, banco de dados ou envio de arquivos a servidores. **Os dados iniciais são fictícios**; este repositório não contém indicadores reais de qualquer loja.

## Abrir
- GitHub Pages (publicação por branch validada no Actions): https://helioconde.github.io/checkLoss/
- Local: execute `python -m http.server 4173` na raiz e abra `http://localhost:4173`.

**Estado da publicação em 27/10/2026:** a branch `gh-pages` foi publicada com sucesso pelo GitHub em [Actions #40481493661](https://github.com/HelioConde/checkLoss/actions/runs/40481493661). A demo é estática, sem servidor ou banco. O workflow alternativo de `main` continua disponível para QA e publicação por Actions.

## Funcionalidades
- Indicadores de valor total, quantidade, ocorrências e setores.
- Filtros combinados por setor, período e pesquisa; gráfico de perdas por setor e destaques.
- Importação de JSON até 5 MB e 5.000 registros com validação de dados.
- Persistência somente no **localStorage deste navegador**, com opção de apagar dados importados e restaurar o exemplo.
- Exportação dos registros filtrados em CSV (UTF-8, separador ponto e vírgula), incluindo valores em reais.
- Layout responsivo, navegação por teclado, foco visível e respeito a movimento reduzido.

## Esquema JSON
O arquivo deve conter uma lista de objetos ou `{"records":[...]}`. Exemplo:

```json
[
  {"date":"2026-10-01","sector":"Hortifruti","reason":"Avaria","quantity":12,"amount":189.40},
  {"date":"2026-10-03","sector":"Padaria","reason":"Vencimento","quantity":18,"amount":76.50}
]
```

Campos obrigatórios: `date` (AAAA-MM-DD), `sector` e `reason` (texto), `amount` (valor não negativo em BRL). `quantity` é opcional e assume zero. Os registros são fictícios e estão em `sample-data.json`. O antigo `data.json` permanece intocado como artefato histórico vazio.

### Limites e privacidade
- Esta é uma ferramenta exploratória, **não um sistema de contabilidade ou auditoria oficial**.
- A soma de quantidades só é apropriada se os registros utilizarem a mesma unidade de medida.
- O site não transmite arquivos para uma API. O GitHub Pages entrega apenas arquivos estáticos, mas terceiros com acesso ao dispositivo/perfil de navegador podem acessar dados guardados localmente.
- **Não importe nem publique dados confidenciais de empresa sem autorização.**
- `localStorage` pode ser limpo pelo navegador; use a exportação CSV para manter uma cópia.

## Testes
```bash
npm install
npx playwright install chromium
npm test
```

Valida em Chromium desktop/mobile, com capturas, importação, filtros, prevenção de overflow e erros de JavaScript. O workflow testa PRs e, após sucesso na `main`, sincroniza automaticamente os cinco arquivos estáticos com a branch `gh-pages` quando ela é a fonte do GitHub Pages. Se Pages estiver em modo GitHub Actions, usa o deploy por artefato. Não há banco ou servidor de aplicação.

## Design
Consulte [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md). Tokens seguem Taste Skill; semântica, foco e redução de movimento seguem Web Design Guidelines; composição modular implementa Awesome Design e Image to Code.

Projeto de estudo de [Hélio Conde](https://github.com/HelioConde).

## Exportação CSV segura

A exportação CSV apresenta textos informados pelo usuário como texto literal em planilhas, prefixando com apóstrofo os campos de setor e motivo que poderiam ser interpretados como fórmulas (`=`, `+`, `-`, `@` após espaços ou controles). O conteúdo original continua visível no painel. Esta proteção reduz o risco de interpretação inesperada por softwares de planilha, mas **não substitui avaliação de segurança ao abrir dados externos**. Os testes Playwright verificam esse comportamento.

## Importação acessível e publicação sem comandos adicionais
O botão nativo **Importar arquivo JSON** aceita mouse, toque, Enter e Espaço; o seletor de arquivo fica fora da ordem de tabulação para evitar foco duplicado. O Playwright testa as duas teclas nos layouts desktop/mobile. Após o QA da `main`, o workflow sincroniza `index.html`, `app.js`, `styles.css`, `sample-data.json` e `favicon.svg` na `gh-pages` quando esse é o modo de publicação do repositório. Publicações via GitHub Actions continuam suportadas em alternativa, sem credenciais na página e sem banco de dados.

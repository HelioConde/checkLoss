# checkLoss — Painel de perdas demonstrativo

**Status:** nova interface estática em HTML, CSS e JavaScript, preparada para GitHub Pages sem backend, banco de dados ou login.

[Abrir demo no GitHub Pages](https://helioconde.github.io/checkLoss/)

## Recursos
- Painel com valor total, número de ocorrências, quantidade perdida e setor de maior valor.
- Gráfico por setor, busca por texto e filtro de setor.
- Criação, edição e exclusão de ocorrências com confirmação.
- Validação de datas, quantidades e valores em BRL.
- Persistência em localStorage (somente no navegador), exportação CSV e backup/importação JSON.
- Testes Playwright em cinco resoluções, verificação de erros JS e capturas automáticas.
- Estilos responsivos, foco visível e respeito a movimento reduzido.

A interface inicia com **oito exemplos inteiramente fictícios**. O arquivo histórico data.json continua preservado, mesmo estando vazio; ele não é consumido pela demo.

## Privacidade e dados
**Não envie relatórios, nomes reais, vendas ou dados internos de lojas para este repositório público.** A demonstração é local e não fornece autenticação, backup remoto, criptografia nem colaboração. Mesmo em localStorage, dados reais ou sensíveis não devem ser introduzidos sem os controles apropriados.

O botão Backup JSON guarda uma cópia local; a importação valida os dados, limita o arquivo a 1 MB e pede confirmação antes de substituir os registros.

## Executar
Na raiz do repositório, execute:

~~~bash
python -m http.server 8444
~~~

Abra http://localhost:8444.

## Testar

~~~bash
npm install
npx playwright install chromium
npm run qa
~~~

O workflow em .github/workflows/pages.yml testa o app e publica **somente index.html, styles.css, app.js e favicon.svg** quando a main recebe um commit e os testes passam. Em Settings → Pages, a fonte deve estar definida como GitHub Actions. Capturas ficam nos artefatos dos workflows.

Consulte docs/DESIGN_SYSTEM.md para regras de interface e docs/IMPLEMENTATION_PLAN.md para o roteiro de validação.

Projeto de estudo de [Hélio Conde](https://github.com/HelioConde).

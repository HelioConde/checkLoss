# Como publicar checkLoss no GitHub Pages

## Situação verificada — 27/10/2026
O workflow `CheckLoss QA e GitHub Pages` passou nos testes do navegador, mas o deploy falhou em `actions/configure-pages@v5` com `Resource not accessible by integration` ao tentar criar um site Pages pela API.

Esse erro **não indica falha do código da interface**. É necessário que as configurações do GitHub permitam Pages para este repositório; o token automático do Actions não conseguiu criar Pages sozinho.

## Passos necessários (uma vez só)
1. Abra **Settings → Pages** do repositório `HelioConde/checkLoss`.
2. Em **Build and deployment**, selecione **GitHub Actions**.
3. Em **Actions**, execute `CheckLoss QA e GitHub Pages` com **Run workflow** (ou envie um novo commit à `main`).

Depois disso, o workflow verifica a existência da configuração via API. Se disponível, publica apenas `index.html`, `styles.css`, `app.js`, `sample-data.json`, `favicon.svg` e `.nojekyll` — sem PHP nem banco de dados.

## Validação
- Link esperado: https://helioconde.github.io/checkLoss/
- Confira a execução e o artefato `checkloss-playwright`, que contém capturas e relatório.
- Se o workflow mostrar aviso de Pages indisponível, a publicação **não aconteceu**. O QA pode continuar aprovado, mas isso não equivale a uma implantação online.
- Se a configuração estiver habilitada e o deploy ainda falhar, reveja as permissões do GitHub Actions no próprio repositório e a mensagem exata do job.

# Como publicar checkLoss no GitHub Pages

## Situação verificada — 27/10/2026
A configuração inicial do workflow encontrou `Resource not accessible by integration` ao tentar criar Pages, mas a **publicação automática da branch `gh-pages` foi aprovada posteriormente**, na [execução #40481493661](https://github.com/HelioConde/checkLoss/actions/runs/40481493661). O site estático está implantado. Os passos de ativação abaixo ficam como instruções de recuperação ou troca de método.

Esse erro **não indica falha do código da interface**. É necessário que as configurações do GitHub permitam Pages para este repositório; o token automático do Actions não conseguiu criar Pages sozinho.

## Passos necessários (uma vez só)
1. Se precisar refazer a configuração, abra **Settings → Pages** do repositório `HelioConde/checkLoss`.
2. Em **Build and deployment**, selecione **GitHub Actions**.
3. Em **Actions**, execute `CheckLoss QA e GitHub Pages` com **Run workflow** (ou envie um novo commit à `main`).

Depois disso, o workflow verifica a existência da configuração via API. Se disponível, publica apenas `index.html`, `styles.css`, `app.js`, `sample-data.json`, `favicon.svg` e `.nojekyll` — sem PHP nem banco de dados.

## Validação
- Link esperado: https://helioconde.github.io/checkLoss/
- Confira a execução e o artefato `checkloss-playwright`, que contém capturas e relatório.
- Se o workflow mostrar aviso de Pages indisponível, a publicação **não aconteceu**. O QA pode continuar aprovado, mas isso não equivale a uma implantação online.
- Se a configuração estiver habilitada e o deploy ainda falhar, reveja as permissões do GitHub Actions no próprio repositório e a mensagem exata do job.


## Alternativa independente do workflow: branch gh-pages

A branch `gh-pages` foi criada como **pacote mínimo e separado** (index.html, styles.css, app.js, favicon.svg, sample-data.json e .nojekyll), sem `data.json`, arquivos de configuração, ferramentas de testes ou dados de empresa.

1. Entre em **Settings → Pages**.
2. Escolha **Deploy from a branch**.
3. Selecione branch **gh-pages** e diretório **/(root)**; salve.
4. Confirme a publicação no GitHub e abra https://helioconde.github.io/checkLoss/ — já houve uma implantação bem-sucedida.

A ativação por interface do proprietário pode ser necessária: criar um branch e passar testes não é garantia de implantação. Como `app.js` busca `./sample-data.json`, os caminhos funcionam no prefixo de subpasta `/checkLoss/`. Novas alterações em `main` **não sincronizam automaticamente** com `gh-pages`; a publicação alternativa deve ser atualizada de forma intencional.

## Privacidade
Os dados de exemplo são fictícios. Não publique JSON real ou arquivos importados em commits. A importação do navegador usa armazenamento local, portanto não sincroniza entre dispositivos.

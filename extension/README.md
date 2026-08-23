# Montador de Decks Commander 500

Uma extensão de navegador que adiciona controle de orçamento e verificação de legalidade de formato às páginas de deck do LigaMagic, para os formatos brasileiros Commander 500 e Commander 500 Duel.

## O que ela faz

- Lê a página de deck do LigaMagic aberta no momento diretamente do HTML dela (sem precisar de conta ou acesso à API do LigaMagic) — comandante(s), deck principal, e maybeboard, o preço mais baixo listado de cada carta, e a arte de cada carta (o próprio LigaMagic já embute isso na página para seu recurso de pré-visualização ao passar o mouse).
- Abre o montador de decks em sua própria aba do navegador (clique no ícone da extensão na barra de ferramentas em uma página de deck do LigaMagic) em vez de uma sobreposição apertada na própria página, para haver espaço para trabalhar no deck.
- Enriquece as cartas capturadas com dados de tipo/cor/CMC e legalidade no Commander 500 chamando diretamente a [API pública do Scryfall](https://scryfall.com/docs/api) pelo navegador (em lote, não uma requisição por carta) — nenhum backend nosso envolvido. A arte das cartas vem da própria página do LigaMagic, então a visão Visual continua mostrando arte de verdade mesmo se o Scryfall estiver inacessível.
- Oferece tanto uma visão em Lista (linhas compactas) quanto uma visão Visual (miniaturas com a arte das cartas) para cada zona, com um eixo de agrupamento selecionável (Tipo, Cor ou Custo de Mana).
- Mostra gráficos da curva de mana, distribuição de cor e distribuição de tipo do Deck Principal, recalculados ao vivo conforme você edita o deck.
- Calcula o orçamento do deck no Commander 500 (menor preço somando o Deck Principal e o comandante parceiro, excluindo o comandante principal, o Maybeboard e terrenos básicos) contra o teto de R$500, com feedback visual ao vivo.
- Mostra, ao vivo, um aviso visual quando o deck ultrapassa o limite de 99 cartas do Commander, contado nas mesmas zonas do orçamento (Deck Principal e Comandante Parceiro).
- Verifica cada carta contra a lista de banidos do formato ativo: Commander 500 lê os dados de legalidade do próprio Commander do Scryfall ao vivo; Commander 500 Duel lê um conjunto de dados empacotado com a extensão (com curadoria a partir do [duelcommander.org](https://www.duelcommander.org/banlist/), já que esse formato não tem API pública).
- Permite arrastar cartas entre zonas — com uma cópia semitransparente da carta acompanhando o cursor durante o arraste — editar quantidades, ver uma pré-visualização da arte ao passar o mouse sobre uma carta na visão em Lista, e exportar o deck como texto simples — tanto no formato exato que o próprio importador/exportador do LigaMagic usa, quanto em uma versão legível por humanos com rótulos de zona.

## Requisitos

- Node.js 18+ e npm.
- Google Chrome (ou outro navegador baseado em Chromium) para carregar a extensão descompactada.

## Configuração

```bash
npm install
npm run build
```

Isso gera `dist/`, contendo a extensão descompactada (`manifest.json`, `background.js`, `content.js`, `tab.html`/`tab.js`, ícones).

## Carregando a extensão no Chrome

1. Rode `npm run build` (ou `node scripts/build.mjs --watch` enquanto estiver desenvolvendo).
2. Abra `chrome://extensions`.
3. Ative o "Modo de desenvolvedor" (canto superior direito).
4. Clique em "Carregar sem compactação" e selecione o diretório `dist/` deste projeto.
5. Abra uma página de deck do LigaMagic (`https://www.ligamagic.com.br/?view=dks/deck&id=<n>`) ou de coleção, e então clique no ícone da extensão na barra de ferramentas — o montador de decks abre em sua própria aba. Clicar no ícone novamente enquanto essa aba ainda está aberta apenas foca nela em vez de abrir uma duplicata; se você fechar a aba de origem do LigaMagic, a aba de visualização continua mostrando seu último estado conhecido com um indicador de "não sincronizado".

Rode `npm run build` novamente após qualquer mudança no código-fonte e clique no ícone de recarregar no card da extensão em `chrome://extensions` para aplicá-la.

## Rodando os testes

```bash
npm test          # roda uma vez
npm run test:watch
npm run typecheck
```

Os testes são de nível unitário/componente (Vitest + jsdom) e rodam contra fixtures em `test/fixtures/`, não contra a rede ao vivo — nenhum acesso ao Scryfall ou ao LigaMagic é necessário para rodar a suíte.

## Verificação manual no navegador

`scripts/verify-*.mjs` são scripts Playwright independentes usados durante o desenvolvimento para checar a extensão contra o **site real do LigaMagic, ao vivo**: carregamento da extensão, arrastar e soltar, exibição de orçamento/legalidade, exportação, e a visão em aba disparada pelo ícone da barra de ferramentas. Eles não fazem parte do `npm test` e não são necessários para o desenvolvimento normal, mas são úteis ao mudar qualquer coisa que toque em raspagem de página, chamadas ao Scryfall, ou a UI.

Para usá-los, o Playwright precisa estar presente (deliberadamente não é uma dependência permanente, já que ele empacota um download completo do Chromium):

```bash
npm install --no-save playwright
npx playwright install chromium   # apenas na primeira vez
node scripts/verify-load.mjs      # carregamento + relay de captura + controle de ativação (nenhuma sobreposição é injetada)
node scripts/verify-drag.mjs      # um arraste real com o ponteiro entre zonas
node scripts/verify-legality.mjs  # troca de formato + resumo de legalidade
node scripts/verify-export.mjs    # ambos os formatos de exportação via área de transferência
node scripts/verify-tab-view.mjs  # visão em aba pelo ícone da barra de ferramentas: captura via relay, arte na visão Visual, renderização de gráficos
node scripts/verify-tab-view-lifecycle.mjs  # fechar a aba de origem mostra o indicador de "não sincronizado"
node scripts/verify-bugfixes.mjs  # escopo do orçamento, volume de enriquecimento em lote, legalidade, cobertura de arte, eixos de agrupamento
```

Nenhum dos dois scripts de visão em aba consegue clicar em um ícone real da barra de ferramentas do Chrome — é UI nativa do navegador, fora do DOM de qualquer página, e (confirmado ao construir isso) nem sequer alcançável por um atalho de teclado vinculado, já que o Chrome despacha os aceleradores de comando de extensão no nível do chrome do navegador, abaixo de qualquer coisa que a automação via CDP consiga injetar. Ambos os scripts, em vez disso, perguntam ao service worker de background o id da aba de origem e navegam diretamente para a URL `tab.html?sourceTabId=…&deckId=…` que um clique abriria, exercitando a mesma página de aba contra dados reais retransmitidos. A própria fiação de "o clique despacha uma aba" (incluindo o ramo de "focar a aba de visualização existente em vez de abrir uma duplicata") é coberta pelos testes unitários do `service-worker.test.ts`. Fechar a aba de origem, por outro lado, não precisa de nenhum clique simulado — `verify-tab-view-lifecycle.mjs` fecha uma página real do Playwright, o que dispara um `chrome.tabs.onRemoved` genuíno, e confirma que a aba de visualização mostra seu último estado conhecido com o indicador de "não sincronizado".

Esses scripts acessam a API real do Scryfall para enriquecer as cartas do deck de exemplo. O enriquecimento é feito em lote (`ScryfallClient.lookupCards`, em `src/lib/scryfall/client.ts`) contra o endpoint `/cards/collection` do Scryfall — um deck de ~90 cartas resolve em um punhado de requisições, não uma por carta, bem dentro do limite de uso justo do Scryfall (menos de 10 requisições/segundo). Uma busca fuzzy por carta individual (`/cards/named?fuzzy=`) só roda como alternativa para o que a chamada em lote não conseguiu resolver diretamente, então raramente é exercitada na prática. Se você encontrar um 429 transitório iterando rápido demais, ele se resolve sozinho (veja a [documentação deles](https://scryfall.com/docs/api)) — não é sinal de um bug.

## Atualizando a lista de banidos empacotada do Commander 500 Duel

O Commander 500 Duel não tem API pública para sua lista de banidos, então ela é distribuída como um retrato com curadoria dos mantenedores: `src/lib/banlist/commander-500-duel-data.json`. Para atualizá-la depois de uma mudança real na lista de banidos:

1. Confira a lista atual em <https://www.duelcommander.org/banlist/>.
2. Atualize os quatro arrays em `commander-500-duel-data.json` (`bannedAsCompanion`, `bannedAsCommander`, `bannedInDeck`, `bannedForOffensiveContent`) e sua data `asOf`.
3. As entradas de `bannedForOffensiveContent` são dobradas em "banida no deck" no momento da consulta (`commander-500-duel.ts`), já que não podem ser usadas em nenhum lugar do deck; mantê-las em seu próprio array serve apenas para documentar *por que* uma carta é banida.
4. Rode `npm test` — `commander-500-duel.test.ts` exercita a consulta contra algumas cartas conhecidas, então uma edição malformada (categoria errada, nome digitado errado) costuma falhar ruidosamente.
5. Publique uma nova versão da extensão. Essa é uma troca real de ainda não ter um backend (veja `openspec/changes/commander-500-deckbuilder/design.md`): uma atualização da lista de banidos só chega aos usuários na próxima versão, não ao vivo.

O Commander 500 (não-Duel) não precisa desse tipo de atualização — ele lê os dados de legalidade do próprio Commander do Scryfall ao vivo, que já acompanha a lista de banidos oficial do Commander Rules Committee.

## Lacunas conhecidas / suposições declaradas

- **A análise da página de coleção (`src/lib/capture/collection-page-parser.ts`) não foi verificada contra marcação real.** A página de coleção do LigaMagic exige uma conta autenticada, o que não estava disponível durante a construção disto. Ela foi modelada a partir das convenções de marcação confirmadas da página de deck, como melhor esforço; veja o comentário no topo do arquivo antes de confiar nela em produção.
- **Um backend e banco de dados hospedados pelo projeto propositalmente ainda não foram construídos** (veja "Decisions and Open Questions" em `design.md`) — isso troca cache centralizado e atualizações de lista de banidos independentes de versão por uma v1 mais simples, sem infraestrutura para rodar.

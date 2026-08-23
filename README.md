# Montador de Decks Commander 500

Uma extensão de navegador que transforma qualquer página de deck do [LigaMagic](https://www.ligamagic.com.br/) em um montador de decks completo para os formatos brasileiros **Commander 500** e **Commander 500 Duel** — controle de orçamento (teto de R$500), verificação de legalidade, organização por zonas com arrastar e soltar, e gráficos de composição do deck, tudo client-side, sem servidor próprio.

## O que é isto

O LigaMagic é o principal site brasileiro de compra/venda de cartas e montagem de decks de Magic, mas seu editor de decks não conhece as regras do Commander 500 nem do Commander 500 Duel — formatos de orçamento populares na comunidade brasileira, com teto de R$500 no deck e suas próprias listas de banidos. Esta extensão lê a página de deck já aberta no LigaMagic e adiciona, por cima dela, o que falta:

- Orçamento do Commander 500 (menor preço somando Deck Principal e Comandante Parceiro, excluindo o comandante principal e o Maybeboard) contra o teto de R$500, com feedback visual ao vivo.
- Verificação de legalidade: Commander 500 usa a lista de banidos oficial do Commander (via Scryfall, ao vivo); Commander 500 Duel usa a lista do Duel Commander, sem API própria, então é mantida como um dataset com curadoria.
- Organização em quatro zonas (Comandante, Comandante Parceiro, Deck Principal, Maybeboard) com arrastar e soltar, visões em Lista e Visual (com arte), e agrupamento por Tipo/Cor/Custo de Mana.
- Aviso ao vivo quando o deck ultrapassa o limite de 99 cartas do Commander.
- Gráficos de curva de mana, cor e tipo do Deck Principal.
- Exportação em texto simples, tanto no formato exato que o próprio LigaMagic importa quanto em uma versão legível com rótulos de zona.

É uma ferramenta pessoal de montagem de deck — não um sistema de torneio, não um serviço hospedado, e não afiliada ao LigaMagic.

## Instalação

Este repositório tem um único pacote, `extension/`. O passo a passo completo de instalação e desenvolvimento — build, carregar como extensão descompactada no Chrome, rodar os testes, e os scripts de verificação manual contra o site real — está em **[`extension/README.md`](extension/README.md)**.

## Arquitetura, em poucas palavras

Extensão Chrome (Manifest V3), sem backend próprio, em três partes:

1. **Content script** — só ativo em páginas do LigaMagic; lê o HTML da página (deck ou coleção) e captura cartas/zonas/preços/arte, sem injetar nenhuma UI na própria página.
2. **Service worker de background** — retransmite a captura para a aba de visualização (via `chrome.storage.session`, já que o content script não tem acesso direto a esse storage) e faz as chamadas à API pública do Scryfall para enriquecer as cartas (tipo, cor, CMC, legalidade) e resolver a lista de banidos do Duel Commander.
3. **Aba completa** (`tab.html`) — onde a UI de fato vive: organizador, orçamento, legalidade, gráficos e exportação, renderizados a partir dos dados retransmitidos, sem depender do documento da página de origem continuar aberto.

Nenhum servidor é mantido por este projeto. Os únicos serviços externos chamados são o próprio LigaMagic (via leitura de DOM, não API) e a API pública do Scryfall (para atributos de carta e legalidade — nunca para preço, que vem sempre do LigaMagic).

## Decisões técnicas

Esta seção é um registro vivo — é atualizada sempre que uma decisão arquitetural relevante é tomada, e não só quando uma funcionalidade é adicionada. O racional completo de cada uma, com alternativas consideradas e riscos aceitos, vive no `design.md` da mudança correspondente em `openspec/changes/` (mudanças em andamento) ou `openspec/changes/archive/` (já concluídas) — esta seção é o resumo executivo, não o substituto.

### Sem backend próprio, por enquanto

A extensão chama a API pública do Scryfall diretamente do navegador do usuário, com cache local, em vez de rotear por um servidor próprio. Isso evita ter infraestrutura para manter, ao custo de não poder cachear resultados entre usuários e de acoplar a atualização da lista de banidos do Duel Commander (abaixo) ao ciclo de releases da extensão. Um backend próprio continua sendo a evolução mais provável se esse custo pesar na prática.

### Captura isolada em um único módulo adaptador por tipo de página

Todo o código que toca o DOM do LigaMagic vive em `deck-page-parser.ts`/`collection-page-parser.ts`, com um contrato de saída bem definido e testado contra fixtures de HTML real. Nada mais na extensão acessa `document` diretamente. Como o LigaMagic não tem API e pode mudar sua marcação a qualquer momento, isolar essa superfície significa que uma quebra vira uma falha de teste localizada em um módulo, não um bug espalhado silenciosamente pelo resto do app.

### Lista de banidos do Commander 500 Duel: dataset estático com curadoria, não uma fonte ao vivo

O Duel Commander não é um formato reconhecido pelo Scryfall e não tem API própria, então sua lista de banidos é empacotada como um JSON versionado dentro da extensão, com curadoria manual a partir de duelcommander.org e uma data "atualizado em" sempre visível ao usuário. O Commander 500 "normal" não precisa disso — sua lista de banidos é a mesma do Commander oficial, que o Scryfall já espelha ao vivo.

### Arte das cartas: prioriza o próprio DOM do LigaMagic, Scryfall como reserva

O LigaMagic já embute a arte de cada carta na própria página (para seu recurso de pré-visualização ao passar o mouse), sem requisição extra. A visão Visual e a pré-visualização ao passar o mouse na Lista usam essa imagem primeiro, caindo para a arte do Scryfall só quando a página não tem uma. Isso desacopla a arte inteiramente do enriquecimento do Scryfall — uma carta mostra arte de verdade mesmo se o Scryfall estiver fora do ar.

### Enriquecimento em lote no Scryfall, não uma requisição por carta

Um deck de ~90 cartas resolve em um punhado de requisições ao endpoint `/cards/collection` do Scryfall, não uma por carta — evitando rate-limiting (confirmado em teste real: 26 de 87 requisições individuais retornavam HTTP 429 antes dessa mudança). Uma busca fuzzy por carta continua existindo, mas só como reserva para o que o lote não resolveu diretamente.

### Visão em aba completa, não uma sobreposição injetada na página

A UI inteira roda em sua própria aba da extensão (`tab.html`), alimentada por dados retransmitidos via `chrome.storage.session`, em vez de uma sobreposição React injetada na própria página do LigaMagic. Isso dá espaço de verdade para trabalhar no deck e sobrevive ao service worker de background sendo suspenso pelo Chrome (comum em Manifest V3) — o mapeamento aba-de-origem ↔ aba-de-visualização também vive em `chrome.storage.session`, não em memória, pelo mesmo motivo.

### Arrastar e soltar: `@dnd-kit` com `DragOverlay` + `pointerWithin`

O arraste mostra uma cópia semitransparente da carta acompanhando o cursor (`DragOverlay`), e a zona de destino é resolvida pela posição literal do ponteiro (`pointerWithin`), não pela caixa delimitadora do elemento arrastado. Isso importa porque, ao segurar uma carta longe do seu centro (por exemplo, pela borda inferior de um card visual alto), a estratégia de colisão padrão do dnd-kit resolveria a zona errada — `pointerWithin` a torna independente de onde exatamente a carta foi agarrada.

### Sideboard removido, absorvido pelo Maybeboard

O Commander 500 não usa o conceito de Sideboard; a zona foi removida da extensão, e cartas que o LigaMagic lista sob um cabeçalho "Sideboard" são capturadas diretamente como Maybeboard. O fold acontece em um único ponto (`zoneForHeaderLabel`), então o resto do app não precisou de lógica especial.

### Português brasileiro fixo na interface, sem camada de i18n

Toda a base de usuários captura decks do LigaMagic, um site em português — não existe público que precise trocar de idioma. As strings da UI são traduzidas diretamente no código, sem biblioteca de internacionalização nem catálogo de mensagens. Nomes de carta nunca são traduzidos. Rótulos de zona que o próprio LigaMagic exibe em inglês na sua página ("Maybeboard") permanecem exatamente como estão lá; "Deck Principal" (rótulo inventado por este app, sem equivalente no LigaMagic) foi traduzido.

## Estrutura do repositório

```text
extension/           a extensão em si — código-fonte, testes, scripts de build e verificação
  src/lib/            lógica pura, sem UI (captura, orçamento, legalidade, organização, exportação)
  src/ui/             componentes React
  src/tab/            a página de aba completa e seus hooks de dados
  src/background/     service worker
  src/content/        content script
  test/fixtures/      HTML real capturado do LigaMagic, usado nos testes
  scripts/            build e scripts de verificação manual via Playwright
openspec/            especificações e histórico de decisões
  specs/               o comportamento atual do sistema, por capacidade
  changes/             mudanças em andamento (proposta, specs delta, design, tarefas)
  changes/archive/     mudanças já concluídas e mescladas às specs principais
```

## Testes e verificação

`npm test`/`npm run typecheck` (unitário/componente, sem rede) e os scripts de verificação manual via Playwright contra o site real estão documentados em [`extension/README.md`](extension/README.md#rodando-os-testes).

## Mantendo este documento atualizado

Este README acompanha o projeto: sempre que uma mudança introduzir ou revisar uma decisão arquitetural (não apenas uma funcionalidade nova), a seção "Decisões técnicas" acima deve ganhar uma entrada — resumida aqui, detalhada no `design.md` da mudança correspondente.

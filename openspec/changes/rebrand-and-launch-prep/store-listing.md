# Texto para as lojas de extensão

Referência para colar nos dashboards do Chrome Web Store, Firefox AMO e
Edge Add-ons — não é parte do bundle da extensão nem do README do GitHub,
porque os limites de tamanho e o formato (sem markdown) são diferentes dos
dois. Ver `design.md` — Decisions para o porquê deste arquivo existir
separado do README.

## Nome do item (manifest `name`)

```
CMD500 Deck Builder - LigaMagic Deck Enhancer
```

47 caracteres — bem abaixo do limite de 75 caracteres do Chrome para o
campo `name` do manifest.

## Resumo curto (Chrome Web Store "Summary", limite de 132 caracteres)

```
Transforma um deck do LigaMagic em um montador completo para Commander 500 e Commander 500 Duel: orçamento, banidos e organização.
```

130 caracteres. Confira o limite atual no próprio dashboard antes de
colar — esses limites já mudaram no passado.

## Descrição detalhada

```
O LigaMagic é o principal site brasileiro de compra/venda de cartas e
montagem de decks de Magic, mas seu editor não conhece as regras do
Commander 500 nem do Commander 500 Duel — formatos de orçamento
populares na comunidade brasileira, com teto de R$500 no deck e suas
próprias listas de banidos. O CMD500 Deck Builder lê a página do seu
deck, já aberta no LigaMagic, e adiciona por cima dela exatamente o
que falta para jogar nesses formatos.

REQUISITO: você precisa já ter um deck montado no editor do LigaMagic.
Esta extensão não cria decks do zero — ela melhora a página de um deck
que você já montou lá.

COMO FUNCIONA
1. Monte ou edite seu deck normalmente no LigaMagic.
2. Com a página do deck aberta, clique no ícone da extensão na barra
   de ferramentas do navegador.
3. O CMD500 Deck Builder abre em sua própria aba, já com seu deck
   carregado.
4. Organize, verifique orçamento/legalidade e exporte de volta para o
   LigaMagic quando terminar.

O QUE ELE ADICIONA AO SEU DECK DO LIGAMAGIC
• Orçamento do Commander 500 ao vivo, contra o teto de R$500
• Verificação de legalidade (Commander 500 via Scryfall; Commander 500
  Duel via lista curada do Duel Commander)
• Quatro zonas organizáveis com arrastar e soltar, ordem customizável
  e zonas recolhíveis
• Visões em Lista e Visual (com arte), agrupáveis por Tipo, Cor ou
  Custo de Mana
• Aviso ao vivo ao ultrapassar o limite de 99 cartas do Commander
• Gráficos de curva de mana, cor e tipo do Deck Principal
• Edição inline de quantidade e preço
• Exportação em texto simples, no formato exato que o importador do
  LigaMagic espera, ou em uma versão legível com rótulos de zona

CASOS DE USO
• Montar um Commander 500 dentro do orçamento, com feedback de preço
  em tempo real enquanto você troca cartas
• Conferir a legalidade do deck antes de um evento de Commander 500
  ou Commander 500 Duel
• Encontrar buracos na curva de mana com a visão Visual agrupada por
  Custo de Mana
• Reorganizar o deck livremente e exportar de volta para o LigaMagic
  sem perder nada

Este é um projeto pessoal e de código aberto (licença GPL-3.0), não
afiliado, endossado ou patrocinado pelo LigaMagic, pela Wizards of the
Coast ou pelo Commander Rules Committee. Não coleta, armazena ou
transmite nenhum dado pessoal — todo o processamento acontece
localmente, no seu navegador.

Código-fonte: https://github.com/lucasfsanti/CMD500-Deck-Builder
```

## Categoria sugerida

Produtividade (Chrome) / Ferramentas de produtividade (Edge) — não há uma
categoria "jogos de tabuleiro/cartas físicas" nas três lojas, e esta
extensão não é um jogo.

## Idioma primário

Português (Brasil) — o público-alvo é 100% de usuários do LigaMagic, um
site brasileiro. O nome do item (acima) fica em inglês deliberadamente
(ver design.md — Decisions); resumo e descrição ficam em português.

## Aviso de não afiliação (obrigatório nas 3 lojas — política de marca)

Incluído como último parágrafo da descrição detalhada acima. Repetir
também em qualquer material promocional adicional (marquee, tile) se o
espaço permitir — as políticas de marca do Chrome Web Store e da AMO
exigem que o uso nominativo de "LigaMagic" e "Commander" não implique
afiliação ou endosso.

## Política de privacidade

Nenhum dado do usuário é coletado, armazenado ou transmitido por esta
extensão — todo o processamento (captura do deck, cálculo de orçamento,
verificação de legalidade) acontece localmente no navegador do usuário.
A única comunicação de rede que a extensão faz é com a API pública do
Scryfall (para atributos de carta e legalidade), sem enviar nenhum dado
identificável do usuário.

Texto sugerido para a página de política de privacidade (URL obrigatória
no dashboard do Chrome e da AMO, mesmo declarando "nenhum dado
coletado"):

```
Política de Privacidade — CMD500 Deck Builder

Esta extensão não coleta, armazena ou transmite nenhum dado pessoal.
Todo o processamento acontece localmente, no navegador do usuário:

- A extensão lê a página de deck do LigaMagic que o usuário já tem
  aberta, para capturar cartas, zonas e preços. Nenhum dado de
  navegação ou de conta é acessado ou enviado a terceiros.
- A extensão consulta a API pública do Scryfall (scryfall.com) para
  obter tipo, cor, custo de mana e legalidade das cartas capturadas.
  Nenhum dado identificável do usuário é enviado nessa consulta.
- Nenhum backend próprio é operado por este projeto. Nenhum dado sai
  do navegador do usuário além das consultas públicas ao Scryfall
  descritas acima.

Código-fonte aberto (GPL-3.0):
https://github.com/lucasfsanti/CMD500-Deck-Builder
```

Hospedagem sugerida: publicar este texto como uma página do GitHub
Pages do repositório, ou usar a URL do `PRIVACY.md` renderizado
diretamente pelo GitHub (`https://github.com/lucasfsanti/CMD500-Deck-Builder/blob/main/PRIVACY.md`)
— ambas satisfazem o requisito de "URL pública alcançável" das lojas.
Nenhuma das duas opções foi provisionada por esta mudança (ver tasks.md
— 5.1/5.3); é uma ação manual antes da submissão.

## Justificativa de permissões (aba "Privacy practices" do Chrome)

- **`storage`**: retransmite os dados do deck capturado entre o content
  script e a aba de visualização via `chrome.storage.session`. Os dados
  nunca saem do dispositivo do usuário.
- **`host_permissions` para `ligamagic.com.br`**: lê a página de deck que
  o usuário já tem aberta, para capturar cartas/zonas/preços/arte.
  Acesso somente leitura — nenhuma escrita na página.
- **`host_permissions` para `api.scryfall.com`**: consultas públicas de
  metadados de carta (tipo, cor, custo de mana, legalidade). Nenhum dado
  do usuário é enviado nessas consultas.

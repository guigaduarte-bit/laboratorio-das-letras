# Conceito do jogo — Laboratório das Letras

## Propósito

O Laboratório das Letras é um jogo curto de exploração para crianças no início da alfabetização. A experiência transforma o reconhecimento de letras e palavras em uma descoberta concreta, sem punição por erro e sem pressão de tempo.

## Princípios

- Aprender explorando e experimentando.
- Apresentar uma tarefa pequena por sessão.
- Associar letras a palavras concretas e visualmente reconhecíveis.
- Reforçar tentativas com feedback positivo e orientações suaves.
- Manter letras estáveis, grandes e legíveis.
- Aceitar teclado e toque com controles amplos.
- Reproduzir voz, efeitos e música apenas depois de uma interação inicial explícita.
- Usar áudio como orientação e reforço suave, nunca como punição.

## Primeiro produto

O primeiro produto valida apenas o ciclo essencial:

1. Entrar no jogo pela tela inicial.
2. Mover um personagem provisório por um cenário simples.
3. Encontrar quatro letras.
4. Formar uma palavra.
5. Receber uma pequena celebração final.

A primeira palavra de validação é **SAPO**.

## Fora do escopo inicial

- Mais de uma palavra ou fase.
- Pontuação, vidas, cronômetros ou telas de derrota.
- Cadastro, perfis, progresso persistente ou ranking.
- Assets definitivos, loja, moedas ou itens colecionáveis adicionais.
- Reprodução de áudio antes da interação inicial do usuário.

## Evolução arquitetural do Marco 3

Após a validação da vertical slice, a lógica jogável passa a receber uma definição de nível separada da cena. `SAPO` continua sendo a palavra principal; `PATO` entra somente como segundo conteúdo técnico para provar que outra palavra pode usar a mesma cena, os mesmos sistemas e o mesmo HUD.

A presença de uma palavra no catálogo técnico não equivale à sua aprovação pedagógica. A sequência apresentada ao Ben será definida conforme o trabalho de alfabetização realizado no período.

## Direção visual do Marco 4

O primeiro mundo passa a ser o **Bosque-Laboratório**, uma estação de pesquisa integrada à natureza. O personagem é **Lumi**, um pequeno robô-pesquisador cuja antena reage às descobertas.

O Marco 4 substitui os placeholders geométricos por uma linguagem vetorial própria desenhada no Phaser. Cenário, personagem, cartões e celebração continuam sem assets externos, mas agora seguem um sistema visual documentado em `docs/DIRECAO_ARTE.md`.

As letras permanecem estáveis e legíveis. Somente o cartão e os elementos ao redor recebem brilho, pequena mudança de escala, balanço discreto e partículas.

## Mascote-guia do Marco 5

O mascote-guia será um **vagalume-cientista**, com o nome de trabalho **Pisco**. Ele não substitui Lumi e não participa da física ou da exploração do mundo. Sua função é acompanhar as instruções na camada React e reagir de maneira curta e positiva às ações da criança.

Pisco será animado por uma máquina de estados Rive somente depois da aprovação do conceito e da criação de um arquivo `.riv` próprio. A comunicação seguirá `Phaser → EventBus → React → Rive`.

## Progresso local do Marco 6

O primeiro progresso persistente permanece restrito ao dispositivo e ao navegador usados pela criança. Não há conta, login, Supabase, identificação pessoal, ranking ou sincronização em nuvem.

São registrados somente níveis concluídos, quantidade de sessões iniciadas, última atividade e contagens de acertos e dicas por letra. Esses dados servem para retomar o percurso e identificar letras que precisam de mais apoio, sem criar pontuação ou punição.

## Expedição das Letras — 2026-09-05

Adaptação original do ciclo de corrida, coleta e crescimento solicitado como referência. Lumi avança pela pista em perspectiva do Bosque-Laboratório e acumula anéis em seu equipamento ao encontrar as letras de SAPO. Pisco acompanha cada descoberta.

- A pista para diante das alternativas, sem limite de tempo para escolher.
- A primeira escolha tem duas alternativas; as seguintes têm três. As posições variam, mantendo todas as letras com a mesma aparência.
- Esquerda/direita (ou A/D) escolhem o caminho; seta para cima (ou W, espaço/Enter) faz o personagem avançar até a letra. A coleta acontece na chegada.
- No touchscreen, botões grandes de esquerda/direita e AVANÇAR reproduzem os controles do teclado. Também é possível tocar diretamente na letra ou deslizar para os lados e para cima.
- Escolher outra letra preserva todas as descobertas e ilumina a letra esperada. Também é possível pedir dica.
- A palavra modelo permanece visível. A atividade pratica reconhecimento e pareamento; não presume leitura autônoma nem mede domínio de alfabetização.
- Quatro letras completam a invenção. A criança escolhe repetir ou encerrar a sessão.
- Pausa manual e pausa ao ocultar a página preservam a escolha atual.

A raiz abre a nova experiência. O protótipo de plataformas permanece em `?mode=explore`. Na entrega de 2026-09-05, o conteúdo era restrito a SAPO; a ampliação está registrada abaixo.

### Ajuste de jogabilidade — 2026-09-07

A parada diante das alternativas permanece sem limite de tempo. O avanço até a letra torna a decisão visível: após uma escolha diferente da esperada, o personagem volta ao ponto de escolha e a dica permanece, preservando as letras já encontradas. O controle por toque funciona sem teclado conectado. A pista adapta sua altura para deixar os botões disponíveis na vertical e na horizontal.

## Missões da escola e voz humana — 2026-09-08

A pedido do usuário, a expedição agora inclui **SAPO, ONÇA, TUCANO e MACACO**, as quatro palavras registradas na atividade escolar em `PROJETO_LABORATORIO_DAS_LETRAS_BEN.md`. PATO continua apenas no protótipo técnico de plataformas.

A criança escolhe um animal ilustrado, coleta as letras em ordem e vê novamente o animal com a palavra completa. Ao terminar, pode descobrir o próximo animal, repetir ou voltar ao início. Todas as fases estão disponíveis, sem bloqueios ou punições. O histórico identifica cada palavra separadamente.

Cada letra acrescenta três anéis ao corpo do explorador. A pilha acompanha o personagem e o rosto sobe com ela. A escala considera a altura da tela para preservar o espaço das letras.

A síntese do navegador foi retirada da corrida. A área de acompanhamento permite ao responsável gravar ou carregar os 16 trechos do roteiro, ouvi-los e salvá-los. **Ainda não há um pacote humano pré-gravado incorporado.** Somente os trechos preparados no navegador são narrados; os demais mantêm apoio visual e efeitos. As gravações ficam no aparelho, sem envio a servidores.

## Habitats e encontro com os animais — 2026-09-08

Após a aprovação visual do 3D, cada palavra passa a levar a um ambiente próprio: lagoa na Mata Atlântica, Pantanal, Cerrado e Amazônia. O cenário muda com a missão e mantém a pista e as letras desobstruídas. As escolhas e referências estão em `BIOMAS_EXPEDICAO.md`.

O final é um encontro: explorador e animal olham um para o outro, o explorador acena e o animal responde com seu gesto. O trajeto fica mais ágil, preservando a parada sem prazo para reconhecer cada letra. Áudio e narração permanecem adiados conforme o pedido do usuário.

## Áudio da aventura — 2026-09-08

A expedição ganha uma trilha instrumental original alegre, um brilho metálico ao acertar, um som grave breve para orientar outra tentativa e uma fanfarra no encontro final. O erro permanece sem punição. A música baixa enquanto uma pessoa fala as letras ou instruções e os volumes podem ser ajustados separadamente.

O roteiro humano passa a 19 falas, com apresentação, convite, nomes das letras, palavras e reforços. Ainda é necessário receber ou gravar esses trechos: o jogo não apresenta voz sintetizada como humana. O estúdio permite levar as gravações ao tablet em um pacote, mantendo-as sob controle da pessoa que acompanha.

## Narração recebida — 2026-09-12

O roteiro gravado enviado pelo usuário passa a acompanhar a expedição em 19 trechos: apresentação, convite, 11 nomes de letras, quatro palavras e dois reforços. Funciona em um navegador novo, sem importar ou gravar novamente. A pessoa pode substituir falas localmente e restaurar a voz incluída.

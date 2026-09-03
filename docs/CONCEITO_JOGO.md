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

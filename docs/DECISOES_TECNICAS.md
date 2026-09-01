# Decisões técnicas — Laboratório das Letras

## Base do projeto

- Base existente do template oficial `phaserjs/template-nextjs`.
- Phaser 4 para o mundo jogável.
- React para tela inicial e elementos externos ao canvas.
- TypeScript em todo o código da aplicação.
- Next.js para desenvolvimento, build estático e futura publicação.

## Organização

- O React inicia a experiência e controla a camada de interface externa.
- O Phaser controla cenário, personagem, movimento, letras e celebração.
- A comunicação entre React e Phaser ocorre pelo EventBus do template.
- O Marco 1 nasceu com o fluxo `BootScene` → `PreloadScene` → `MenuScene` → `LevelSapoScene` → `CelebrationScene`.
- A partir do Marco 3, `LevelScene` substitui `LevelSapoScene` e recebe um `levelId`; a cena consulta `src/game/content/levels.ts` e não conhece uma palavra específica.
- `PlayerController`, `LetterCollector` e `WordProgress` concentram as lógicas reutilizáveis do ciclo jogável.
- O conteúdo da palavra fica em arquivo separado da lógica da cena.

## Conteúdo orientado por dados no Marco 3

- Cada `LevelDefinition` possui `id`, `word`, `displayName`, `imageKey`, áudios, letras, posições, ponto inicial e plataformas.
- `LetterCollector` recebe `letters` da definição ativa; não mantém um alfabeto fixo.
- O Howler resolve instrução, fonema e palavra pelos caminhos declarados no nível e mantém apenas efeitos e música compartilhados.
- `CelebrationScene` recebe `levelId` e usa `imageKey` para escolher um placeholder geométrico.
- `forest-sapo` é o nível padrão. `forest-pato` é um teste técnico acessível no preview com `?level=forest-pato`, sem tela de seleção definitiva.
- Novas palavras devem entrar como dados. Uma nova cena só se justifica quando houver mecânica realmente diferente.

## Exibição e entrada

- Canvas-base em proporção 16:9 com `Phaser.Scale.FIT` e centralização.
- Renderização com `Phaser.AUTO` para permitir fallback de WebGL para Canvas.
- Movimento por setas/A e D; salto por seta para cima/W/espaço.
- Três controles grandes de toque permitem esquerda, pulo e direita.
- Nenhum áudio é reproduzido automaticamente.

## Eventos do Marco 1

- `start-game`: React solicita o início da fase ao `MenuScene`.
- `control-left`, `control-right` e `control-jump`: React envia os controles de toque ao Phaser.
- `letter-collected`: emitido ao coletar uma letra correta.
- `letter-mismatch`: emitido ao tocar em uma letra fora da sequência.
- `word-completed`: emitido ao completar `SAPO`.
- `celebration-ready`: Phaser informa ao React que a celebração começou.

## Assets

- Personagem, cenário, letras e celebração iniciais são desenhados por código.
- Nenhum asset externo é necessário nesta entrega.
- Assets futuros só podem entrar após registro em `docs/LICENCAS_ASSETS.md`.

## Responsabilidades do Marco 2

- Phaser continua responsável apenas pelo mundo jogável: personagem, plataformas, letras, partículas, câmera e colisões.
- Motion anima a interface React: menu, botão `COMEÇAR`, barra da palavra, cartões de missão e transições externas ao canvas.
- Motion não deve ser usado dentro do canvas do Phaser; animações do mundo usam os tweens e sistemas nativos do Phaser.
- Howler concentra voz, sons de letras, efeitos e música ambiente em `src/audio/GameAudio.ts`.
- A interface usa Lexend Variable carregada localmente por Fontsource, sem dependência de fonte remota.

## Fluxo de áudio do Marco 2

- O clique em `COMEÇAR` chama a liberação do contexto de áudio durante a própria interação do usuário.
- `level-started` inicia a música em volume baixo e a orientação falada da missão.
- `letter-collected` interrompe uma orientação ainda ativa, fala a letra coletada e depois toca o efeito leve de coleta.
- `letter-mismatch` mantém o progresso e toca apenas uma dica suave, sem punição.
- `word-completed` reduz a música e acrescenta à fila, sem sobreposição: som da letra final, coleta, voz `SAPO`, efeito de conclusão e liberação da celebração.
- A cena mantém um fallback curto para chegar à celebração caso um arquivo de áudio falhe ou o navegador o bloqueie.

## Eventos acrescentados no Marco 2

- `level-started`: o Phaser informa ao React/Howler que a fase começou.
- `word-audio-completed`: o Howler informa ao Phaser que a palavra já foi falada e a celebração pode começar.

## Sistema visual do Marco 4

- A direção de arte está registrada em `docs/DIRECAO_ARTE.md`.
- O Bosque-Laboratório é construído por camadas vetoriais em `src/game/visuals/ForestLabArt.ts`.
- Paleta e fonte do canvas são centralizadas em `src/game/visuals/palette.ts`.
- Lumi é um rig vetorial reutilizável em `src/game/visuals/PlayerAvatar.ts`.
- O sprite físico do jogador fica invisível e separado do rig visual; colisão e aparência podem evoluir sem acoplamento.
- Os estados `idle`, `walk`, `jump`, `land`, `collect` e `celebrate` usam tweens nativos do Phaser.
- Cartões de letras usam `LetterCardView`; a hitbox física invisível permanece estável e independente do balanço visual.
- Partículas usam texturas próprias geradas em tempo de execução por `PreloadScene`; nenhuma mídia externa foi adicionada.
- Motion continua restrito ao React. Toda animação no canvas usa tweens, formas e partículas do Phaser.

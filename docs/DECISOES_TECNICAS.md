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

## Preparação do Rive no Marco 5

- O mascote-guia é um vagalume-cientista com o nome de trabalho `Pisco`.
- Pisco pertence à camada React e não participa do mundo físico do Phaser.
- Lumi continua sendo o personagem explorador controlado pelo Phaser.
- A comunicação seguirá `Phaser → EventBus → componente React → máquina de estados Rive`.
- O artboard previsto é `Mascot` e a máquina de estados prevista é `MascotState`.
- O runtime `@rive-app/react-canvas` foi instalado após a aprovação do conceito; ele só será renderizado quando houver um `.riv` próprio pronto para integração.
- O React manterá texto acessível separado; o Rive será visual e não substituirá mensagens ou regiões `aria-live`.
- A preferência `prefers-reduced-motion` deverá oferecer uma representação estática ou reduzir os ciclos contínuos.
- `MascotGuide.tsx` concentra os listeners do EventBus e converte eventos do jogo nos seis estados visuais de Pisco.
- `RiveMascot.tsx` é carregado dinamicamente, fora da renderização no servidor, e usa View Model Properties em vez dos inputs legados da máquina de estados.
- Os triggers de data binding são `listen`, `think`, `hint`, `happy`, `celebrate` e `reset`; `reducedMotion` é uma propriedade booleana.
- `pisco.riv` é o asset principal do mascote e foi exportado pelo editor Rive para `public/assets/rive/`.
- `pisco-fallback.svg` permanece como recuperação automática se o arquivo ou o runtime não puderem ser carregados.
- O primeiro preview remoto revelou fundo opaco e enquadramento deslocado no export de `pisco.riv`.
- `RIVE_ASSET_READY` permanece desativado temporariamente; o vetor próprio foi incorporado ao componente React para manter Pisco visível e reativo sem depender do carregador de imagens até o `.riv` ser reexportado e validado.

## Persistência local do Marco 6

- O progresso inicial usa somente `localStorage`; não há Supabase, conta, login ou sincronização entre dispositivos.
- A chave versionada é `laboratorio-das-letras:progress:v1`, permitindo uma migração futura sem confundir formatos.
- `LocalProgressStore` concentra leitura, validação e escrita. Dados ausentes ou corrompidos voltam a uma estrutura vazia sem interromper o jogo.
- Se o navegador bloquear o armazenamento, a partida continua e mantém apenas um fallback em memória durante a página atual.
- Uma sessão é contada no evento `level-started`, depois de a criança acionar `COMEÇAR` e a fase realmente iniciar.
- `letter-collected` incrementa `correct` para a letra coletada; `letter-mismatch` incrementa `hints` para a letra esperada, não para a letra tocada por engano.
- `word-completed` adiciona o identificador do nível a `completedLevels` sem duplicatas.
- `lastPlayedAt` recebe data e hora ISO em cada uma dessas atividades.
- O total de tentativas com dica é derivado pela soma de `letterStats[*].hints`, evitando informação duplicada.
- O fluxo permanece `Phaser → EventBus → React → LocalProgressStore → localStorage`.

## Expedição das Letras — 2026-09-05

- `RunnerScene` implementa a nova mecânica e `RunnerWorld` desenha a perspectiva 2.5D no Phaser 4. `RunnerApp` cuida dos controles, HUD e acompanhamento em React. O modo de plataformas permanece disponível.
- Estados: `ready → travel → choose → collect → travel/finish → celebrate`. `choose` não expira. Pausa congela avanço e tweens. A coleta usa `WordProgress` e bloqueia novos toques antes de emitir eventos.
- `Scale.RESIZE` adapta a pista ao contêiner; o modo de plataformas mantém `Scale.FIT`. Fontes são aguardadas antes de criar o canvas. React recebe mudanças de estado, sem atualizações por frame. Paisagem parada reutiliza a geometria desenhada. Movimento reduzido é respeitado.
- Howler cuida dos efeitos. A narração desta experiência usa a API de voz do navegador, somente com voz `pt-BR`, priorizando serviço local. Essa adaptação sem nova dependência evita reutilizar os MP3 Flite de voz não validados. Não há gravação da criança; apenas textos fixos do jogo são enviados à API. Algumas vozes do navegador podem depender do serviço remoto do fornecedor.
- A narração usa **nomes de letras**, não fonemas. Começa somente após interação, com pausa, mute e cancelamento. A disponibilidade depende do dispositivo ([getVoices](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis/getVoices)). Ausência de voz mantém o jogo visual e desativa Ouvir. Conferir a pronúncia no aparelho real continua necessário.
- O progresso mantém chave e formato do marco 6. Dicas são atribuídas à letra procurada. SAPO usa `forest-sapo`, preservando o histórico da palavra entre modalidades.
- Verificação: `node tests/runner-invariants.cjs`, typecheck, lint e build existentes. Nenhuma dependência foi adicionada ou atualizada.

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
- Estados: `ready → travel → choose → approach → collect → travel/finish → celebrate`. Uma alternativa incorreta segue `approach → retry → choose`. `choose` não expira. Pausa congela avanço e tweens. A coleta usa `WordProgress` na chegada; `approach` bloqueia entradas simultâneas antes de qualquer evento de coleta.
- `Scale.RESIZE` adapta a pista ao contêiner; o modo de plataformas mantém `Scale.FIT`. Fontes são aguardadas antes de criar o canvas. React recebe mudanças de estado, sem atualizações por frame. Paisagem parada reutiliza a geometria desenhada. Movimento reduzido é respeitado.
- Howler cuida dos efeitos. A narração desta experiência usa a API de voz do navegador, somente com voz `pt-BR`, priorizando serviço local. Essa adaptação sem nova dependência evita reutilizar os MP3 Flite de voz não validados. Não há gravação da criança; apenas textos fixos do jogo são enviados à API. Algumas vozes do navegador podem depender do serviço remoto do fornecedor.
- A narração usa **nomes de letras**, não fonemas. Começa somente após interação, com pausa, mute e cancelamento. A disponibilidade depende do dispositivo ([getVoices](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis/getVoices)). Ausência de voz mantém o jogo visual e desativa Ouvir. Conferir a pronúncia no aparelho real continua necessário.
- O progresso mantém chave e formato do marco 6. Dicas são atribuídas à letra procurada. SAPO usa `forest-sapo`, preservando o histórico da palavra entre modalidades.
- Verificação: `node tests/runner-invariants.cjs`, typecheck, lint e build existentes. Nenhuma dependência foi adicionada ou atualizada.

### Teclado e touchscreen — 2026-09-07

- `runner-move` recebe a direção lateral e `runner-advance` confirma o caminho. Toque em uma letra, teclado e gestos usam a mesma ação de avanço em `RunnerScene`.
- Seta para cima/W avançam; esquerda/direita/A/D mudam o caminho. Espaço/Enter continuam como alternativas, preservando a ativação nativa de botões em foco. Setas funcionam após clicar na interface, sem capturar campos de texto ou diálogos e sem rolar a página durante a partida.
- Toque nos cartões é avaliado no `pointerup`. O gesto guarda o identificador do dedo; deslizar não dispara coleta por acidente. Saída do canvas e pausa cancelam o gesto pendente.
- A área sensível dos Containers compensa `displayOriginX/Y`, conforme o `InputManager` do Phaser 4. Os cartões ficam separados nas telas menores. Botões externos de direção/avanço têm pelo menos 52 × 58 px; botões de letra, 58 × 56 px.
- `ResizeObserver` atualiza o ScaleManager quando o contêiner muda de tamanho, incluindo entrada na partida, rotação e reorganização dos controles. A altura usa `svh`; em telas horizontais baixas os controles ficam ao lado da pista.
- `tests/runner-controls.cjs` exercita a cena real com substitutos apenas para renderização: setas após foco em botões, avanço até a letra, pausa, repetição, áreas de toque, tap/swipe, dois dedos, cancelamento e ciclo completo de SAPO. Não substitui a inspeção visual ou o teste em tablet físico.

### Correção do recorte no desktop — 2026-09-07

- O print de validação revelou letras cortadas e o explorador abaixo da área visível. O teste com o `ScaleManager` real reproduziu a falha: após a moldura encolher de 570 para 354 px, `refresh()` usava o tamanho antigo para desenhar e atualizava o cache de medidas somente ao final; a verificação periódica já não detectava a diferença.
- `syncRunnerViewport` chama `getParentBounds()` antes de `refresh()` e preserva as dimensões anteriores no evento de redimensionamento. Ignora o período anterior à criação do canvas e medidas transitoriamente zeradas.
- O contêiner do canvas ocupa a moldura com `position: absolute; inset: 0`, sem depender das dimensões intrínsecas do canvas. O Phaser continua responsável pelo tamanho do próprio canvas.
- A câmera da corrida acompanha explicitamente os eventos de redimensionamento; não depende de ainda ter as dimensões do menu.
- No desktop com altura disponível, os controles ficam em uma linha, liberando 76 px de altura para a pista. A disposição de toque em telas menores é preservada.
- `node tests/runner-viewport.cjs` reproduz a versão defeituosa e verifica a correção com o gerenciador de escala real do Phaser 4, incluindo as dimensões aproximadas do print, mudança de tamanho, retorno ao menu e rotação de tablet. O teste não renderiza pixels e não substitui a conferência no navegador.

### Quatro missões, pilha no corpo e gravações — 2026-09-08

- `schoolLevels` mantém o catálogo escolar separado do exemplo técnico PATO. `runner-start` e `runner-home` aceitam um `levelId`; o snapshot inclui identificador e palavra. HUD, instruções, contagem, conclusão e registro local consultam a fase ativa. A cedilha é preservada e as repetições de MACACO são coletadas individualmente.
- `PlayerAvatar` possui duas camadas de anéis no próprio rig, uma atrás e outra à frente do tronco. A cabeça acompanha o crescimento até 18 anéis. Posição, escala e movimento reduzido são compartilhados; o equipamento lateral saiu de `RunnerWorld`. A escala reserva espaço entre rosto e letras nas telas baixas.
- `HumanVoice` guarda Blobs em IndexedDB, base `laboratorio-human-voice`, versão 1. Nenhum áudio é enviado à rede. Erros de gravação/armazenamento são apresentados sem anunciar um salvamento que falhou. A área informa que os áudios precisam ser preparados em cada navegador.
- `VoiceStudio` usa microfone somente após um clique em Gravar. A captura para ao sair da área, ao ocultar a página ou após 8 segundos. Upload permite MP3, M4A, WAV, OGG e WebM de até 2 MB e 10 segundos. O arquivo precisa decodificar antes de habilitar o salvamento. A pessoa pode ouvir e substituir cada trecho.
- `RunnerAudio` usa apenas Howler e os áudios gravados. A fila cancela falas anteriores, ignora callbacks antigos e respeita pausa, mute e interação inicial. Letras ausentes não disparam convites incompletos. Não há fallback para Web Speech ou Flite.
- A voz humana está **preparada para integração**, mas nenhum locutor ou pacote de gravações foi fornecido: não apresentar esta entrega como narração humana completa. O roteiro inclui 10 nomes de letras (incluindo cê cedilha), quatro palavras e duas frases.
- `AnimalPortrait` contém quatro desenhos vetoriais originais. Seleção de missões e conclusão têm altura própria e podem rolar com a página; a pista mantém o redimensionamento corrigido anteriormente.
- Verificação: build/lint/tipos; testes de invariantes, quatro ciclos da cena, viewport, geometria dos anéis e fila de áudio. A gravação de microfone, qualidade da pronúncia e renderização em tablet físico ainda precisam de conferência no preview acessível ao usuário.

### Expedição em 3D — 2026-09-08

- A solicitação de volume real para personagem, objetos e ambiente motivou o Three.js 0.185.1 (MIT), carregado dinamicamente. Phaser 4 continua no protótipo de plataformas e na versão leve acionada pelo usuário se WebGL2 falhar. React, Howler, palavras escolares e armazenamento local são reaproveitados. Esta iteração não altera áudio ou narração.
- `RunnerController` concentra estados, alternativas, aproximação, pausa e `WordProgress`, sem depender do renderizador. React recebe somente mudanças de estado; o loop 3D consulta um frame e limita o delta após interrupções. `eventemitter3` 5.0.4, já usado pelo Phaser, passa a dependência direta para evitar carregar o Phaser junto ao novo jogo.
- `RunnerWorld3D` cria geometria real, iluminação hemisférica e direcional, sombras suaves, neblina, caminho, árvores, água e laboratório. Nuvens, copas, pequenas partículas e parallax acompanham o percurso. A velocidade desacelera antes da escolha; o pequeno afastamento da câmera é amortecido pela velocidade. Letras usam Lexend em texturas locais sobre blocos sólidos, sem oscilar ou deformar enquanto a escolha está aberta.
- `Explorer3D` é um rig original, com pernas, braços, visor, mochila, antena e 18 anéis toroidais ao redor do tronco telescópico. Caminhada, respiração, coleta, crescimento e celebração compartilham a posição do personagem. `Animals3D` contém os quatro animais com volume real e movimentos sutis.
- `RunnerCamera3D` calcula a projeção de todos os extremos dos portais e do personagem crescido, incluindo aproximação e caminhos laterais. Mantém a inclinação, reserva pelo menos 22% de altura para o HUD (até 112 px nas telas baixas) e 5% nas demais bordas e adapta a câmera ao contêiner via ResizeObserver. A conclusão coloca os animais ao lado do cartão no desktop e acima dele em telas menores.
- Toque utiliza raycasting contra os blocos visíveis, confirmado na soltura do mesmo gesto; swipe lateral escolhe e swipe para cima avança. Teclado preserva botões, campos e diálogos, ignora repetição e só confirma na fase de escolha. Pausa e dois dedos cancelam gestos pendentes. Não há cronômetro de escolha ou perda de letras.
- Pixel ratio limitado a 1,5, uma sombra de 1024², partículas, piso e flores instanciados, geometrias e materiais compartilhados, sem pós-processamento ou assets externos. A preferência de movimento reduzido remove ciclos e partículas decorativas; movimentos necessários para jogar permanecem. Falha de criação/contexto oferece explicitamente a versão leve. Listeners, RAF, observador, geometrias, materiais, texturas e mapas de sombra são descartados.
- Validação automatizada: controlador com as quatro palavras, cedilha/repetições, pausa, deduplicação e ausência de limite na escolha; câmera com 2.296 cantos em sete proporções; testes de interação do componente com DOM/renderizador substituídos; build, lint e tipos. Testes de geometria e raycasting não substituem a medição de FPS ou inspeção de pixels em aparelho real. O navegador disponível bloqueou o endereço de desenvolvimento, e o preview exige login da Vercel.

- Teste do mundo usa Three.js real com substituição apenas de WebGLRenderer e Canvas 2D: 784 escolhas por Raycaster, sete viewports, quatro animais, pilha, transições, pausa e descarte de 152 recursos. A revisão reduziu o piso e flores para seis lotes; estimativa com frustum real passou de 464+212 para 238+129 chamadas de cena/sombra em 1000×420, sem medição de FPS.

### Habitats, ritmo e encontro final — 2026-09-08

- `runnerPace.ts` centraliza o ritmo do controlador e da versão leve: viagem 1.700 ms, aproximação 500 ms, retorno 600 ms, coleta 850 ms e chegada 2.200 ms. A velocidade máxima 3D passa de 5,8 para 8,2 unidades/s, com cadência das pernas ajustada e desaceleração proporcional à etapa. As animações de uma palavra ficam cerca de 25% mais curtas; a fase de escolha não tem prazo.
- `AnimalEncounter3D` coordena posições e relógio contínuo entre finish/celebrate. A rotação usa a direção real para o parceiro e o menor arco angular, corrigindo o explorador de costas para o animal. Ambos os rigs compartilham o relógio do cumprimento e respeitam pausa/movimento reduzido. O aceno do explorador é seguido pela resposta própria de cada animal, com intervalo entre os ciclos.
- A disposição final consulta o mesmo breakpoint de 900 px da interface, considerando a largura da janela em vez de apenas a largura do canvas. Isso mantém os personagens fora do cartão de conclusão quando o canvas é menor que 900 px em uma janela de desktop.
- `BiomeWorld3D` substitui o bosque único por quatro ambientes com geometrias diferentes, definidos em `content/biomes.ts`. Somente o destino ativo permanece na cena; ao trocar de fase, geometrias, materiais e instâncias anteriores são descartados. Paleta de fundo, neblina e iluminação acompanham o ambiente, mantendo a aparência das letras.
- Todos os componentes repetidos dos habitats são instanciados: 20 a 24 lotes de cena e 4 a 9 lotes de sombra por bioma, sem bibliotecas ou assets externos adicionais. Escolha de missão e conclusão mostram o nome do bioma.
- Verificação: build, tipos, lint, ciclos das quatro palavras, toque por raycasting, orientação mútua, continuidade/pausa do encontro, troca e descarte dos habitats, cadência e movimento reduzido. Os testes de geometria não renderizam pixels nem medem FPS; a prévia autenticada continua sendo o ponto de conferência visual pelo usuário.

### Música, efeitos e narração — 2026-09-08

- `RunnerAudio` concentra três volumes independentes no Howler: música 24%, efeitos 85% e voz 100%, ajustáveis na área de acompanhamento e preservados localmente. A trilha original tem 32 s/120 BPM; MP3 inclui informações de reprodução sem intervalo. Os quatro arquivos somam cerca de 509 KB.
- Música inicia somente após interação e durante a aventura, preserva a posição na pausa e para no início/saída da página. Mute cancela efeitos, falas, timers e reprodução em download; uma tentativa de reprodução bloqueada aguarda outra interação. Efeitos ainda não carregados são omitidos para não chegar depois da escolha.
- Acerto toca um brilho metálico original; erro toca duas notas graves distintas; pedir dica não produz som de erro. O ataque do efeito precede a voz em 210–240 ms. A fanfarra antecede a palavra por 650 ms no encontro final. Não há perda de letras ou efeito punitivo.
- A música desce para 45% do volume escolhido durante efeitos e 18% durante a fala; efeitos descem para 45% enquanto uma gravação fala. Fade de 100 ms ao baixar e 450 ms ao retomar, com volume de grupo consistente. A voz tem prioridade: a próxima escolha aguarda a apresentação/reforço, mantendo somente o convite mais recente. Uma nova missão cancela a anterior.
- `HumanVoice` mantém os IDs anteriores e acrescenta E, apresentação da missão e nova tentativa, total de 19 falas. `VoiceStudio` avança ao próximo trecho faltante e exporta/importa pacote JSON com áudios em base64, até 50 MB/2 MB por trecho. Esquema/IDs/tipos/base64/limites são conferidos, e todos os trechos precisam decodificar com duração de até 10 s antes de uma única transação IndexedDB. Uma falha preserva as gravações existentes. Não há upload automático de voz.
- Não foi incorporado um pacote humano pronto: a pesquisa não forneceu todas as palavras e instruções. O roteiro para gravar está em `ROTEIRO_NARRACAO.md`; a interface informa a quantidade real de trechos disponíveis. Não usar Flite/Web Speech/TTS como se fosse locução humana.
- Validação: testes de fila, prioridade, mute/pausa, palavra no encontro, volumes e importação atômica; testes com Howler real e substitutos apenas de relógio/rede/WebAudio para carregamento tardio e fade; regras/controles das quatro palavras, lint, tipos e build. MP3 verificados por decodificação/amplitude, sem clipping. Audição perceptual, microfone e alto-falantes do tablet ainda exigem conferência na prévia.

### Integração da narração gravada — 2026-09-12

- Gravação enviada nesta conversa dividida na ordem do roteiro em 19 MP3 mono de 96 kbps, cerca de 318 KB no total. Cortes preservam margens silenciosas; filtro de 70 Hz e ganho constante por trecho equilibram o volume sem alterar velocidade, altura ou identidade da voz. Nenhuma síntese ou clonagem.
- `BUNDLED_VOICE` aponta para arquivos versionados em `public/assets/audio/narration/recorded-v1/`. `HumanVoice.get` prioriza substituições locais e usa a voz incluída nos demais casos; remover uma substituição restaura a gravação padrão. `availableCount` e `count` distinguem narração disponível de personalizações. Falha no IndexedDB não desativa a narração incluída.
- Roteiro e arquivos conferidos por quantidade, sequência e transcrição automática das frases/palavras; reconhecimento automático de letras isoladas é limitado e não equivale à revisão auditiva/pedagógica. Todos os MP3 decodificados, duração preservada e sem clipping. Testes de disponibilidade sem armazenamento, prioridade/restauração, fila, pausa e mixagem aprovados; build/lint/tipos aprovados. Audição no aparelho segue com o usuário.
- Preparação reprodutível por `scripts/prepare-recorded-narration.py`; cortes, ganhos e hashes em `NARRACAO_GRAVADA_METRICAS.json`. Original permanece fora do repositório; somente trechos destinados ao jogo são distribuídos. Ferramentas Python de conferência são externas ao app; nenhuma dependência do jogo foi adicionada.

### Oito fases e escolha de personagem — 2026-09-12

- `content/levels.ts` amplia o catálogo da expedição com PREGUIÇA, SUCURI, CAPIVARA e ARARA. Mantém SAPO, ONÇA, TUCANO e MACACO na ordem anterior e reaproveita a mesma lógica de escolha/coleta nos dois renderizadores. PATO permanece técnico no protótipo de plataformas.
- `content/characters.ts` define `CharacterId` (`lumi`, `unicorn`, `dog`), nomes e preferência local versionada em `laboratorio-das-letras:character:v1`. Armazenamento ausente ou bloqueado não impede jogar. A seleção pertence ao menu; o evento `runner-character` atualiza o renderizador e não troca o personagem durante uma partida.
- `Explorer3D` e `PlayerAvatar` fornecem rigs originais para os três exploradores. Unicórnio tem chifre, crina e cauda; cachorro tem focinho, orelhas e cauda. Os anéis continuam presos ao corpo e a cabeça acompanha o crescimento. A capacidade passa a 24 anéis, três por letra, cobrindo palavras de até oito letras. A versão leve reutiliza as partes do rig ao alternar o personagem e encerra também os tweens da cauda em movimento reduzido e no descarte.
- `RunnerCamera3D` reserva a envoltória do explorador até 3,25 unidades de altura, incluindo pilha e chifre. A escala do avatar leve considera sua anatomia e mantém a face fora das alternativas. Não há alteração das letras para acomodar o personagem.
- `Animals3D` amplia a modelagem e os cumprimentos: braço lento da preguiça, inclinação de cabeça da sucuri, cabeça/pata da capivara e asas da arara. O relógio compartilhado do encontro continua preservando orientação mútua, pausa e redução de movimento.
- O mapeamento de `content/biomes.ts` associa as quatro fases novas a Mata Atlântica, Pantanal, Pantanal e Cerrado. Reutiliza os ambientes existentes; não adiciona uma cena ou dependência por palavra. `AnimalPortrait` e `CharacterPortrait` desenham os retratos em SVG original.
- `RunnerApp` retira Pisco da expedição principal e mantém as instruções textuais/acessíveis e a narração. `App` e o modo `?mode=explore` preservam o mascote histórico.
- `HumanVoice` separa o roteiro gravado de 19 trechos do roteiro ampliado de 27. `BUNDLED_VOICE` continua apontando somente para os 19 MP3 existentes. G, I, R, V e as quatro palavras novas ficam pendentes de gravação, sem URLs fictícias ou síntese automática. O estúdio aceita os novos IDs e conserva a prioridade de substituições locais.
- Build aprovado e testes de controle com as oito palavras, seleção de personagem, geometria dos rigs/anéis, enquadramento, encontros e descarte de recursos. A prévia pede login da Vercel no navegador de verificação; os testes não comprovam pixels, FPS, pronúncia nem comportamento em tablet físico.

## Segundo pacote humano — 2026-09-12

O suplemento `recorded-v2` contém oito MP3 mono/48 kHz/96 kbps (~125 KB), derivados do segundo áudio enviado para o jogo. Reutiliza o processamento offline de `prepare-recorded-narration.py --supplement`, com hash de origem, cortes nas pausas, filtro de 70 Hz, ganho constante e fades de borda. A fala intermediária fora do roteiro, antes de CAPIVARA, foi excluída dos assets; o original não foi modificado nem incluído no repositório. Sem alteração de velocidade/altura e sem síntese/clonagem.

`BUNDLED_VOICE` resolve os 19 IDs antigos em `recorded-v1` e os oito novos em `recorded-v2`. Os 27 trechos funcionam sem IndexedDB; personalizações locais continuam prioritárias e sua remoção restaura a gravação incluída. Métricas/hashes em `NARRACAO_COMPLEMENTAR_METRICAS.json`. Transcrição automática local confirma a sequência geral do roteiro, mas não substitui avaliação auditiva/pedagógica no aparelho.

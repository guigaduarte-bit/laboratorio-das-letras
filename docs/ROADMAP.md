# Roadmap — Laboratório das Letras

## Marco 1 — Vertical slice jogável: SAPO

Status: **concluído para preview e validação**.

Objetivo: validar se a exploração, o movimento por plataformas e a coleta sequencial de letras são compreensíveis e agradáveis em uma sessão curta.

### Funcionalidades concluídas

- [x] Tela inicial em React com `LABORATÓRIO DAS LETRAS` e `COMEÇAR`.
- [x] Fluxo com `BootScene`, `PreloadScene`, `MenuScene`, `LevelSapoScene` e `CelebrationScene`.
- [x] Cenário em gradiente, plataformas, personagem, cartões de letras e sapo desenhados somente com formas geométricas.
- [x] Movimento para esquerda e direita por setas ou A/D.
- [x] Pulo por seta para cima, W ou espaço.
- [x] Controles grandes de toque para esquerda, pulo e direita.
- [x] Letras S, A, P e O distribuídas pelo cenário e coletadas na ordem da palavra.
- [x] Progresso iniciado como `S _ _ _` e preenchido durante a coleta.
- [x] Orientação suave ao tocar em uma letra fora da sequência, sem punição.
- [x] Eventos do EventBus para letra coletada, tentativa fora da sequência e palavra concluída.
- [x] Celebração curta ao completar `SAPO`.
- [x] Escala responsiva em proporção 16:9 para desktop e tablet.
- [x] Lint, verificação de tipos e build executados com sucesso.
- [x] Artefato de preview local gerado antes de qualquer publicação em produção.

### Arquivos criados para o Marco 1

- `src/game/scenes/BootScene.ts`
- `src/game/scenes/PreloadScene.ts`
- `src/game/scenes/MenuScene.ts`
- `src/game/scenes/LevelSapoScene.ts`
- `src/game/scenes/CelebrationScene.ts`
- `src/game/systems/PlayerController.ts`
- `src/game/systems/LetterCollector.ts`
- `src/game/systems/WordProgress.ts`
- `src/game/content/levels.ts`
- `.eslintignore`
- `docs/CONCEITO_JOGO.md`
- `docs/DECISOES_TECNICAS.md`
- `docs/LICENCAS_ASSETS.md`
- `docs/ROADMAP.md`

Também foram ajustados `src/App.tsx`, `src/PhaserGame.tsx`, `src/game/EventBus.ts`, `src/game/main.ts`, a configuração do Next.js, os estilos e os scripts de validação.

### Limitações atuais

- Existe apenas uma palavra e uma fase: `SAPO`.
- Personagem, cenário, letras, plataformas e sapo ainda são placeholders geométricos.
- Não há áudio, narração, persistência de progresso ou seleção de níveis.
- A celebração não oferece reinício; o ciclo termina na palavra completa.
- O equilíbrio do salto, das plataformas e da posição das letras ainda precisa de teste de uso com o público infantil.
- Nenhuma versão foi publicada em produção.

## Marco 2 — interface guiada e camada de áudio

Status: **concluído para preview remoto; aguardando validação das vozes em português brasileiro**.

Objetivo: tornar a vertical slice de `SAPO` mais guiada e agradável sem ampliar a quantidade de fases ou palavras.

### Funcionalidades concluídas

- [x] Motion instalado e restrito ao menu, botões, barra da palavra, cartões de missão e transições React.
- [x] Barra da palavra e orientação removidas do canvas e implementadas como interface React responsiva.
- [x] Howler instalado e centralizado em uma camada própria de áudio.
- [x] O botão `COMEÇAR` libera o contexto de áudio durante a interação do usuário.
- [x] Missão falada na abertura da fase.
- [x] Som da letra seguido de efeito leve ao coletar na sequência correta.
- [x] Fila sonora serializada até a celebração, sem sobrepor letra final, coleta e palavra completa.
- [x] Dica sonora sem punição ao tocar em uma letra fora da ordem.
- [x] Música em volume baixo, redução de volume e leitura de `SAPO` antes da celebração.
- [x] Lexend Variable carregada localmente com Fontsource para a interface React.
- [x] Estrutura completa de `public/assets/audio/` criada com placeholders técnicos.
- [x] Clique em `COMEÇAR` protegido por confirmação de que a cena Phaser está pronta.
- [x] Desbloqueio de áudio confirmado pelo navegador antes de iniciar a fase, com continuidade silenciosa se o áudio estiver indisponível.
- [x] Fila de áudio protegida contra carregamento lento, timeout e sons órfãos.
- [x] Next.js e `eslint-config-next` atualizados de `15.3.1` para `15.5.25` para remover o bloqueio crítico de segurança do deployment.
- [x] Dependências transitivas `nanoid` e `sharp` atualizadas para versões corrigidas compatíveis.
- [x] Situação de licença, proveniência e escopo de uso da Lexend e dos MP3 provisórios registrada.
- [x] Lint, verificação de tipos e build executados novamente com sucesso após as correções.
- [x] Implementação dos Marcos 1 e 2 preparada para versionamento no GitHub.
- [x] Novo preview do código restaurado apresentado antes de qualquer publicação em produção.
- [ ] Vozes humanas em português brasileiro gravadas, licenciadas e validadas.

### Arquivos criados no Marco 2

- `src/audio/GameAudio.ts`
- `src/ui/GameHud.tsx`
- `src/ui/StartMenu.tsx`
- `src/ui/TouchControls.tsx`
- `public/assets/audio/README.md`
- Arquivos MP3 provisórios em `public/assets/audio/voice/`, `public/assets/audio/sfx/` e `public/assets/audio/music/`.

Também foram ajustados `src/App.tsx`, `src/pages/_app.tsx`, `src/styles/globals.css`, `src/game/scenes/LevelSapoScene.ts`, `src/game/systems/LetterCollector.ts`, `src/game/systems/WordProgress.ts`, as dependências e a documentação do projeto.

### Limitações atuais

- As vozes são sintetizadas e não têm pronúncia pedagógica validada em português brasileiro.
- Efeitos e música são placeholders técnicos, ainda sem mixagem final.
- O fluxo de desbloqueio precisa ser conferido em dispositivo real, principalmente no Safari móvel.
- O `npm audit --omit=dev` ainda aponta alertas transitivos no PostCSS fixado pelo Next 15; a correção automática disponível migraria para Next 16 e foi adiada por ser uma atualização principal fora deste marco.
- Continua existindo apenas a fase e a palavra `SAPO`.
- O primeiro deployment automático do commit `741f6a7` falhou enquanto usava o Next 15.3.1 vulnerável. A correção está isolada na branch `preview/marco-2-security-fix` e ainda precisa ser validada no preview da Vercel.
- O deployment do commit `a1655e8` concluiu o build, mas a URL retornou `404: NOT_FOUND`; o repositório ainda não declarava à Vercel que o site estático é gerado em `dist`.
- O deployment do commit `d0bbdd9` confirmou que o preset Next.js interpreta `dist` como diretório interno e procura `routes-manifest.json`; como `dist` é o export estático final, o preset foi alterado para `Other`.

### Arquivos ajustados na preparação do preview

- `package.json` e `package-lock.json`: atualização de segurança compatível do Next.js e dependências transitivas.
- `src/audio/GameAudio.ts`: desbloqueio confirmado, carregamento defensivo e fila sonora sem sobreposição.
- `src/App.tsx`: início assíncrono seguro e proteção contra toques repetidos.
- `vercel.json`: preset estático `Other`, comando de build e diretório `dist` declarados explicitamente para a Vercel.
- `docs/LICENCAS_ASSETS.md`: registros verificáveis da Lexend, do Flite e do escopo dos áudios provisórios no preview técnico.
- `docs/ROADMAP.md`: registro desta correção, das validações e das limitações restantes.

## Marco 3 — níveis orientados por dados

Status: **implementado e validado localmente; aguardando preview remoto e validação pedagógica**.

Objetivo: permitir que uma única cena jogável carregue palavras diferentes a partir de conteúdo tipado, sem copiar a lógica de movimento, plataformas, coleta, HUD, áudio ou celebração.

### Funcionalidades concluídas

- [x] `LevelDefinition` criado com `id`, palavra, nome, `imageKey`, áudios, letras, posições, ponto inicial e plataformas.
- [x] Catálogo `levels` criado com `forest-sapo` e `forest-pato`.
- [x] `LevelSapoScene` substituída por `LevelScene`, que recebe `levelId` e carrega qualquer definição válida.
- [x] `LetterCollector` generalizado para usar `value` e posições do conteúdo ativo.
- [x] HUD, missão inicial e acessibilidade calculados a partir da palavra ativa.
- [x] Howler desacoplado de SAPO e do conjunto fixo S/A/P/O; instrução, letra e palavra agora vêm da definição do nível.
- [x] Celebração orientada por `imageKey`, com placeholders geométricos distintos para sapo e pato.
- [x] `PATO` disponível como teste técnico por `?level=forest-pato`, sem criar uma tela de seleção definitiva.
- [x] Sinais locais não verbais adicionados para os caminhos ainda sem gravação de PATO/T, evitando arquivos ausentes no preview.
- [x] Lint, verificação de tipos e build executados com sucesso.
- [x] Export estático verificado por HTTP para SAPO, PATO e os três áudios técnicos, todos com resposta `200`.
- [ ] Preview remoto do Marco 3 apresentado antes de qualquer integração em produção.
- [ ] Segunda palavra definida a partir do trabalho pedagógico atual do Ben.

### Arquivos principais do Marco 3

- `src/game/content/levels.ts`: modelo e catálogo das palavras.
- `src/game/scenes/LevelScene.ts`: cena genérica criada no lugar de `LevelSapoScene.ts`.
- `src/game/scenes/CelebrationScene.ts`: placeholder final escolhido por `imageKey`.
- `src/game/systems/LetterCollector.ts`: coleta baseada em `LetterDefinition`.
- `src/audio/GameAudio.ts`: carregamento de áudio baseado na definição ativa.
- `src/App.tsx`, `src/PhaserGame.tsx`, `src/game/scenes/MenuScene.ts` e `src/game/main.ts`: seleção e propagação de `levelId`.
- `public/assets/audio/voice/instructions/forme-pato.mp3`, `voice/letters/t.mp3` e `voice/words/pato.mp3`: sinais técnicos provisórios.

### Limitações atuais

- `PATO` prova a arquitetura, mas ainda não foi escolhido nem ordenado pedagogicamente para o Ben.
- Os três áudios novos de PATO/T são sinais não verbais, não voz, fonema ou leitura válida.
- SAPO e PATO compartilham o mesmo cenário e as mesmas plataformas; apenas conteúdo, letras, áudio e ilustração final variam.
- A seleção da segunda definição é feita por parâmetro de preview; ainda não existe seletor de palavras na interface.
- O navegador remoto disponível não acessa o servidor local, portanto a confirmação visual depende do próximo deployment de preview.

## Próximo marco recomendado

**Preview e validação do Marco 3.** Publicar somente a branch de preview e conferir SAPO e `?level=forest-pato` em desktop e tablet. Depois, decidir a segunda palavra real a partir do conteúdo trabalhado com o Ben, substituir os sinais técnicos por gravações licenciadas em português brasileiro e somente então integrar o marco à branch principal.

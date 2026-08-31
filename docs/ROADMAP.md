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

Status: **restaurado no código-fonte; aguardando novo preview e validação das vozes**.

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
- [x] Estrutura completa de `public/assets/audio/` criada com placeholders originais.
- [x] Clique em `COMEÇAR` protegido por confirmação de que a cena Phaser está pronta.
- [x] Lint, verificação de tipos e build executados novamente após a restauração.
- [x] Implementação dos Marcos 1 e 2 preparada para versionamento no GitHub.
- [ ] Novo preview do código restaurado apresentado antes de qualquer publicação em produção.
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
- Continua existindo apenas a fase e a palavra `SAPO`.
- O projeto Vercel existente `laboratorio-das-letras-marco-2` foi conectado ao repositório em 2026-08-31; o novo deployment ainda precisa ser verificado.

## Próximo marco recomendado

**Validação do Marco 2.** Gerar o novo preview no projeto Vercel existente `laboratorio-das-letras-marco-2` e testar uma sessão curta em desktop, tablet e Safari móvel. Substituir as vozes por gravações humanas licenciadas em português brasileiro e ajustar volumes, clareza da missão e ritmo da coleta antes de iniciar outra palavra.

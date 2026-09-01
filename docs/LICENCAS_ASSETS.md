# Licenças de assets — Laboratório das Letras

## Entrega 1

Não há assets externos. Personagem, cenário, letras e elementos da celebração são placeholders desenhados por código e pertencem ao próprio projeto.

## Registro de assets futuros

Para cada asset, registrar antes do uso:

- Nome e tipo do asset.
- Autor ou organização.
- URL de origem.
- Licença e URL da licença.
- Data da verificação.
- Local de uso no projeto.

## Marco 2 — áudio provisório

Os arquivos abaixo são placeholders produzidos localmente para validar o fluxo técnico. Não incorporam gravações, músicas ou efeitos baixados de terceiros. As vozes foram sintetizadas com Flite e codificadas em MP3 com FFmpeg; os efeitos e a música foram criados por síntese de tons e ruído com FFmpeg.

O Flite e as vozes distribuídas no pacote usado são do Language Technologies Institute da Carnegie Mellon University e colaboradores. A licença permissiva do projeto autoriza uso e distribuição, inclusive de versões modificadas, desde que os avisos e condições sejam preservados. Este registro mantém a atribuição e aponta para o [repositório oficial do Flite](https://github.com/festvox/flite) e o [texto integral da licença](https://github.com/festvox/flite/blob/master/COPYING). O perfil exato da voz incluída no Flite não foi anotado durante a síntese; por isso, ela continua sendo um placeholder e não deve ser tratada como voz final em português brasileiro.

Os MP3 gerados para o projeto estão autorizados para versionamento no repositório e exibição no preview técnico do Laboratório das Letras. Essa autorização não transforma os arquivos em assets finais: antes de produção ou teste com crianças, as vozes devem ser substituídas e a trilha provisória deve passar por validação editorial e pedagógica.

Registro de incorporação: commit [`741f6a7`](https://github.com/guigaduarte-bit/laboratorio-das-letras/commit/741f6a79e10b89cadad14d26d59b649912973cd5), de 2026-08-31.

| Grupo | Arquivos | Autor/organização | Proveniência e origem | Licença e escopo | Verificação | Uso |
| --- | --- | --- | --- | --- | --- | --- |
| Instruções | `voice/instructions/encontre-s.mp3`, `voice/instructions/forme-sapo.mp3` | Laboratório das Letras; síntese baseada no Flite da Carnegie Mellon University e colaboradores | Produção local com Flite e FFmpeg; sem gravação externa; incorporação no commit acima | Componentes do Flite sob licença permissiva CMU; MP3 autorizado para repositório e preview técnico | 2026-08-31 | Orientação da missão |
| Letras | `voice/letters/s.mp3`, `a.mp3`, `p.mp3`, `o.mp3` | Laboratório das Letras; síntese baseada no Flite da Carnegie Mellon University e colaboradores | Produção local com Flite e FFmpeg; sem gravação externa; incorporação no commit acima | Componentes do Flite sob licença permissiva CMU; MP3 autorizado para repositório e preview técnico | 2026-08-31 | Nome ou som da letra coletada |
| Palavra | `voice/words/sapo.mp3` | Laboratório das Letras; síntese baseada no Flite da Carnegie Mellon University e colaboradores | Produção local com Flite e FFmpeg; sem gravação externa; incorporação no commit acima | Componentes do Flite sob licença permissiva CMU; MP3 autorizado para repositório e preview técnico | 2026-08-31 | Leitura da palavra completa |
| Efeitos | `sfx/collect.mp3`, `correct.mp3`, `hint.mp3`, `complete.mp3` | Laboratório das Letras | Síntese local de tons e ruído com FFmpeg; sem mídia externa; incorporação no commit acima | Asset técnico do projeto, autorizado para repositório e preview; ainda não aprovado como asset final de produção | 2026-08-31 | Feedback sonoro curto |
| Música | `music/forest-loop.mp3` | Laboratório das Letras | Síntese local de tons com FFmpeg; sem mídia externa; incorporação no commit acima | Asset técnico do projeto, autorizado para repositório e preview; ainda não aprovado como asset final de produção | 2026-08-31 | Fundo musical em loop |

## Marco 3 — sinais técnicos de PATO

Os arquivos `voice/instructions/forme-pato.mp3`, `voice/letters/t.mp3` e `voice/words/pato.mp3` foram gerados localmente com o filtro `sine` do FFmpeg. Não contêm voz, gravação ou mídia de terceiros. São sinais não verbais destinados exclusivamente a confirmar que os caminhos de áudio de uma segunda `LevelDefinition` carregam corretamente no preview.

| Grupo | Arquivos | Autor/organização | Proveniência e origem | Licença e escopo | Verificação | Uso |
| --- | --- | --- | --- | --- | --- | --- |
| PATO técnico | `voice/instructions/forme-pato.mp3`, `voice/letters/t.mp3`, `voice/words/pato.mp3` | Laboratório das Letras | Síntese local de senoides com FFmpeg; sem mídia externa | Asset técnico próprio, autorizado apenas para repositório e preview; não aprovado como voz ou fonema | 2026-08-31 | Validar carregamento dinâmico do Marco 3 |

As vozes atuais não têm pronúncia pedagógica validada em português brasileiro. Devem ser substituídas por gravações humanas licenciadas e revisadas antes de uma sessão de teste com crianças ou de qualquer publicação em produção.

## Marco 4 — arte vetorial própria

Personagem Lumi, Bosque-Laboratório, plataformas, cartões, ilustrações de sapo e pato e texturas de partículas foram criados por código dentro do próprio projeto. Não incorporam imagens, personagens, spritesheets ou ilustrações de terceiros.

| Grupo | Arquivos | Autor/organização | Proveniência e origem | Licença e escopo | Verificação | Uso |
| --- | --- | --- | --- | --- | --- | --- |
| Direção de arte | `docs/DIRECAO_ARTE.md`, `src/game/visuals/palette.ts` | Laboratório das Letras | Criação própria | Asset próprio do projeto | 2026-09-01 | Paleta e regras visuais |
| Personagem | `src/game/visuals/PlayerAvatar.ts` | Laboratório das Letras | Rig vetorial desenhado no Phaser | Asset próprio do projeto | 2026-09-01 | Lumi e seus seis estados |
| Mundo | `src/game/visuals/ForestLabArt.ts` | Laboratório das Letras | Formas vetoriais desenhadas no Phaser | Asset próprio do projeto | 2026-09-01 | Bosque-Laboratório e plataformas |
| Letras e efeitos | `src/game/visuals/LetterCardView.ts`, texturas geradas por `PreloadScene` | Laboratório das Letras | Formas e partículas geradas localmente | Asset próprio do projeto | 2026-09-01 | Cartões, brilho, folhas e partículas |
| Celebração | `src/game/scenes/CelebrationScene.ts` | Laboratório das Letras | Ilustrações vetoriais próprias | Asset próprio do projeto | 2026-09-01 | Lumi, sapo, pato e conclusão |

## Marco 2 — tipografia

| Asset | Autor/organização | Origem | Licença | Verificação | Uso |
| --- | --- | --- | --- | --- | --- |
| Lexend Variable, pacote `@fontsource-variable/lexend` versão `5.3.0` | Copyright 2019 The Lexend Project Authors; pacote distribuído por Fontsource | [Página oficial da Lexend no Fontsource](https://fontsource.org/fonts/lexend); [pacote publicado no npm](https://www.npmjs.com/package/@fontsource-variable/lexend/v/5.3.0); licença também incluída em `node_modules/@fontsource-variable/lexend/LICENSE` | SIL Open Font License 1.1 (`OFL-1.1`); [texto oficial no repositório da Lexend](https://github.com/googlefonts/lexend/blob/main/OFL.txt) | 2026-08-31 | Tipografia da interface React |

## Marco 5 — conceito próprio de Pisco

Pisco é um personagem original do Laboratório das Letras. A prancha foi gerada especificamente para o projeto sem imagem de referência externa; o SVG-fonte foi redesenhado localmente com formas próprias e grupos preparados para importação no Rive.

| Grupo | Arquivos | Autor/organização | Proveniência e origem | Licença e escopo | Verificação | Uso |
| --- | --- | --- | --- | --- | --- | --- |
| Conceito | `docs/assets/pisco-concept.png` | Laboratório das Letras; geração assistida por OpenAI | Prompt próprio baseado na direção de arte do projeto; sem mídia externa | Asset próprio do projeto, aprovado como referência de produção | 2026-09-01 | Aparência e estados de Pisco |
| Vetor-fonte | `design/rive/pisco-source.svg` | Laboratório das Letras | Redesenho vetorial local com formas SVG próprias | Asset próprio do projeto | 2026-09-01 | Importação e rig no editor Rive |
| Runtime Rive | `public/assets/rive/pisco.riv` | Laboratório das Letras | Exportação do arquivo de autoria `Pisco - Laboratorio das Letras` criado na conta Rive do projeto | Asset próprio do projeto, autorizado para repositório e preview | 2026-09-01 | Mascote reativo na interface React |
| Fallback de runtime | `public/assets/rive/pisco-fallback.svg` | Laboratório das Letras | Derivação direta do vetor-fonte próprio | Asset próprio do projeto | 2026-09-01 | Recuperação visual caso o runtime ou o `.riv` falhem |

O arquivo de runtime tem SHA-256 `0e1671cb73c3937e4e4a6523d809b702e4036bda7fc26acdd17c803ee116f7c4`. A exportação não incorpora mídia ou personagem externo. O fallback continua no projeto para tolerância a falhas e não substitui o asset principal durante o carregamento normal.

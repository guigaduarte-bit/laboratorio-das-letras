# Licenças de assets — Laboratório das Letras

## Expedição das Letras — 2026-09-05

| Elemento | Origem e uso |
| --- | --- |
| Pista, ilhas, laboratório e anéis | Geometria original do projeto em `RunnerWorld.ts` e `RunnerScene.ts`; renderização Phaser, sem mídia externa |
| Lumi e Pisco | Reutilização dos personagens originais já registrados abaixo |
| Ícones funcionais | Traços próprios em `RunnerIcon.tsx`, sem biblioteca ou imagem de terceiros |
| Narração | Textos fixos originais e voz pt-BR disponibilizada pela Web Speech API do dispositivo; nenhum arquivo de voz de terceiro copiado ou redistribuído; depende da disponibilidade e das condições do fornecedor da voz |
| Efeitos | Reutilização dos sinais próprios do marco 2 já registrados abaixo |
| Referência de mecânica | [Layer Man na App Store](https://apps.apple.com/br/app/layer-man-3d-run-collect/id6445820370?l=en-GB), consultado em 2026-09-05; somente ciclo abstrato de corrida, coleta e crescimento, sem assets, personagens, código ou texto copiados |

As vozes Flite antigas não são usadas na nova corrida. A voz sintética do dispositivo ainda precisa de conferência de pronúncia antes da sessão acompanhada.

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

## Iteração de 2026-09-08

| Elemento | Origem | Uso |
| --- | --- | --- |
| Sapo, onça, tucano e macaco | Desenhos vetoriais originais em `src/ui/AnimalPortrait.tsx`, sem mídia externa | Seleção de missão e conclusão |
| Anéis no corpo e crescimento | Geometria original em `src/game/visuals/PlayerAvatar.ts` | Rig do explorador no Phaser |
| Roteiro de 16 trechos | Textos curtos próprios em `src/audio/HumanVoice.ts` | Nomes de letras, palavras e orientação |
| Gravações humanas | Ainda não fornecidas/incorporadas; gravação ou upload voluntário pelo responsável, somente no navegador | Reprodução local no Howler, sem redistribuição no repositório |

A Web Speech API foi retirada da nova corrida nesta iteração. As fontes de áudio humano pesquisadas na Wikimedia não foram incorporadas, pois não foi obtido um conjunto completo para este roteiro. O protótipo antigo de plataformas mantém seus assets técnicos já registrados.

## Expedição 3D — 2026-09-08

| Elemento | Origem / licença | Uso |
| --- | --- | --- |
| Explorador, 18 anéis e rig animado | Geometria original do projeto, `src/game/three/Explorer3D.ts` | Personagem jogável |
| Sapo, onça, tucano e macaco 3D | Geometria original do projeto, `src/game/three/Animals3D.ts` | Descobertas ao completar as palavras |
| Bosque, laboratório, portais, vegetação e partículas | Geometria original do projeto, `src/game/three/RunnerWorld3D.ts` | Ambiente e objetos 3D |
| Letras sobre os portais | Texturas geradas localmente com Lexend, OFL-1.1 já registrada | Letras legíveis em blocos com volume |
| Three.js 0.185.1 e RoundedBoxGeometry | Three.js authors, MIT, licença em `node_modules/three/LICENSE` | Renderização 3D e geometria arredondada |
| eventemitter3 5.0.4 | Primus, MIT, licença em `node_modules/eventemitter3/LICENSE` | Barramento independente de renderizador |

Não foram usados modelos, texturas ou personagens do jogo de referência. Áudios permanecem como na iteração anterior.

## Habitats e cumprimentos — 2026-09-08

| Elemento | Origem | Uso |
| --- | --- | --- |
| Mata Atlântica, Pantanal, Cerrado e Amazônia | Geometria original do projeto em `BiomeWorld3D.ts`; sem mídia externa | Cenário da respectiva palavra |
| Aceno do explorador e respostas dos animais | Animação original dos rigs em `Explorer3D.ts` e `Animals3D.ts` | Encontro ao completar a palavra |
| Associação de habitats | Referências públicas listadas em `BIOMAS_EXPEDICAO.md`, sem copiar conteúdo ou incorporar arquivos | Direção visual dos cenários |

## Trilha e efeitos da expedição — 2026-09-08

| Asset em `public/assets/audio/expedition/` | Origem | Uso |
| --- | --- | --- |
| `adventure-loop.mp3` | Composição e síntese instrumental originais, geradas por `scripts/generate-expedition-audio.py`; sem samples externos | Música alegre em loop, 120 BPM, 16 compassos/32 segundos |
| `collect-chime.mp3` | Síntese original de três notas metálicas ascendentes | Acerto de letra e coleta de anéis |
| `retry-cue.mp3` | Síntese original de duas notas graves com timbre de madeira | Outra tentativa, sem punição |
| `discovery-fanfare.mp3` | Composição original curta com percussão e notas ascendentes | Encontro com o animal |
| Roteiro de 19 falas | Textos próprios em `HumanVoice.ts` e `ROTEIRO_NARRACAO.md` | Instruções, letras e palavras |

Os quatro MP3 são assets próprios do projeto, cobertos pela licença MIT do repositório. A referência ao efeito de coleta do Sonic orienta somente o caráter breve, brilhante e metálico: nenhum áudio, sample ou transcrição musical da franquia foi incorporado. Geração local por código, NumPy e FFmpeg; hashes, durações e métricas de amplitude estão em `AUDIO_ASSETS_METRICS.json`.

Nenhuma gravação humana externa foi obtida ou adicionada nesta entrega. O estúdio aceita gravação/upload local e permite exportar/importar os trechos entre aparelhos. Uma narração incorporada ao jogo publicado ainda depende de gravações autorizadas do roteiro; não há substituição automática por síntese de voz.

## Roteiro gravado enviado pelo usuário — 2026-09-12

Os 19 arquivos de `public/assets/audio/narration/recorded-v1/` derivam do áudio fornecido nesta conversa para integrar a narração ao Laboratório das Letras. O envio sucede a solicitação explícita do roteiro para esse fim e autoriza seu processamento e uso nesta prévia do jogo. Não foi presumida uma licença geral de reutilização da voz, nem autorização de clonagem. Os direitos da gravação permanecem com seu titular; a licença MIT do código não amplia esse escopo.

Processamento: divisão em pausas do roteiro, mono, filtro passa-altas em 70 Hz, ganho constante por trecho, fades de borda e MP3 96 kbps. Sem voz sintética, transposição ou mudança de velocidade. Os hashes e intervalos estão em `NARRACAO_GRAVADA_METRICAS.json`. O original não foi incluído no repositório.

## Novos animais e exploradores — 2026-09-12

| Elemento | Origem e escopo | Uso |
| --- | --- | --- |
| Unicórnio e cachorro 3D; ampliação para 24 anéis | Geometria e animação originais do projeto em `src/game/three/Explorer3D.ts`; sem modelos ou texturas externos | Exploradores selecionáveis e crescimento |
| Unicórnio e cachorro na versão leve | Formas vetoriais e tweens originais em `src/game/visuals/PlayerAvatar.ts` | Compatibilidade Phaser, com Lumi preservado |
| Preguiça, sucuri, capivara e arara 3D | Modelagem e gestos originais em `src/game/three/Animals3D.ts` | Novos encontros ao concluir palavras |
| Retratos dos animais e exploradores | SVG original escrito no projeto em `src/ui/AnimalPortrait.tsx` e `src/ui/CharacterPortrait.tsx` | Seleção inicial e conclusão |
| Ambientes das novas fases | Reutilização da geometria própria de Mata Atlântica, Pantanal e Cerrado, já registrada | Cenário das novas palavras |
| Roteiro complementar de oito falas | Textos próprios em `HumanVoice.ts` e `docs/ROTEIRO_NOVAS_FASES.md` | G, I, R, V, PREGUIÇA, SUCURI, CAPIVARA e ARARA |

Os novos elementos visuais são assets próprios do projeto, gerados por código/SVG, sem mídia de terceiros e sem novas dependências. A retirada de Pisco da expedição principal não apaga seus arquivos nem os registros históricos.

As 19 gravações humanas anteriores continuam com o escopo de uso já registrado. Nenhum áudio novo foi produzido ou incorporado para as oito falas pendentes nesta entrega; a expansão do roteiro não significa disponibilidade dessas gravações e não autoriza síntese ou clonagem da voz.

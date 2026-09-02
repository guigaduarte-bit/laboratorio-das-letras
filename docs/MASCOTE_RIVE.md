# Mascote Rive — Pisco

## Papel no jogo

**Pisco** é o nome de trabalho do vagalume-cientista que atua como guia do Laboratório das Letras. Ele reage ao progresso, acompanha instruções e oferece dicas suaves sem entrar no mundo jogável.

Conceito e nome aprovados em 2026-09-01.

Pisco não substitui **Lumi**:

- Lumi explora o cenário, pula, colide e coleta letras no Phaser.
- Pisco aparece na interface React e recebe estados por meio do EventBus.
- Nenhuma ação física, plataforma ou letra será controlada pelo Rive.

## Personalidade

- Curioso e atento.
- Calmo, paciente e encorajador.
- Expressivo sem ser agitado.
- Nunca demonstra frustração com um erro.
- Age como parceiro de investigação, não como avaliador.

## Construção visual

O rig deve ser reconstruído com formas vetoriais simples dentro do editor Rive. A prancha conceitual é referência de proporção e personalidade, não um asset a ser importado diretamente.

Arquivos de referência:

- `docs/assets/pisco-concept.png`: prancha visual aprovada.
- `design/rive/pisco-source.svg`: base vetorial própria, organizada por grupos para importação no editor Rive.

### Peças separadas

- `root`
- `body`
- `head`
- `abdomen_glow`
- `wing_left` e `wing_right`
- `arm_left` e `arm_right`
- `hand_left` e `hand_right`
- `leg_left` e `leg_right`
- `eye_left` e `eye_right`
- `pupil_left` e `pupil_right`
- `eyelid_left` e `eyelid_right`
- `brow_left` e `brow_right`
- `mouth`
- `antenna_left` e `antenna_right`
- `antenna_glow_left` e `antenna_glow_right`
- `vest`
- `neckerchief`

As asas devem girar pela base. Braços, pernas e antenas precisam de pivôs próprios. Olhos, pupilas, pálpebras e sobrancelhas devem permanecer independentes para que as expressões não dependam de deformações complexas.

## Paleta

| Uso | Cor |
| --- | --- |
| Corpo, cabeça e contorno | Tinta `#26383A` |
| Partes escuras secundárias | Musgo profundo `#355F4B` |
| Colete | Lagoa `#6FAEA4` |
| Lenço e detalhes | Argila `#C66B3D` |
| Abdômen e pontas das antenas | Ocre `#C08E3A` |
| Asas | Areia `#E8DCC7` com transparência |
| Reflexos positivos | Folha clara `#A8BC86` |

## Artboard e máquina de estados

- Artboard: `Mascot`
- State machine: `MascotState`
- Estado inicial: `idle`

### Entradas previstas

| Entrada Rive | Tipo | Uso |
| --- | --- | --- |
| `listen` | Trigger | Iniciar reação de escuta |
| `think` | Trigger | Reagir a uma tentativa fora da sequência |
| `hint` | Trigger | Apresentar uma orientação suave |
| `happy` | Trigger | Reagir a uma letra correta |
| `celebrate` | Trigger | Reagir à palavra concluída |
| `reset` | Trigger | Voltar imediatamente ao estado neutro |
| `reducedMotion` | Boolean | Reduzir ciclos e deslocamentos contínuos |

## Estados visuais

### `idle`

- Flutuação vertical de no máximo 2 px na escala final da interface.
- Piscar natural e espaçado.
- Abdômen com pulso lento e discreto.
- Asas praticamente paradas.

### `ouvindo`

- Cabeça inclinada levemente.
- Uma mão próxima ao ouvido.
- Olhar atento e abdômen com luz constante.
- Retorna a `idle` ao terminar a reação.

### `pensando`

- Olhar para cima, uma mão no queixo e sobrancelhas suaves.
- Sem expressão de reprovação.
- Pode anteceder `dando_dica` ou retornar a `idle`.

### `dando_dica`

- Um braço indica a região da missão ou da barra da palavra.
- Abdômen aumenta o brilho suavemente.
- A outra mão permanece aberta, sem gesto autoritário.

### `feliz`

- Olhos sorrindo, braços próximos ao corpo e pequeno impulso para cima.
- Duração recomendada entre 650 e 900 ms.
- Retorno automático a `idle`.

### `comemorando`

- Braços erguidos, asas abertas e flutuação curta.
- Pontos de luz podem aparecer ao redor, sem flashes.
- Pode permanecer ativo durante a celebração final.

## Mapeamento de eventos

| EventBus | Estado do mascote | Observação |
| --- | --- | --- |
| `menu-ready` | `idle` | Apresentação neutra |
| `level-started` | `ouvindo` | Acompanha a instrução inicial |
| `letter-collected` | `feliz` | Feedback curto e positivo |
| `letter-mismatch` | `pensando` | Nenhuma punição ou reprovação |
| `mascot-hint` | `dando_dica` | Evento React opcional após a reflexão |
| `word-completed` | `comemorando` | Mantém o estado até a celebração |

## Componente React previsto

O componente futuro `src/ui/MascotGuide.tsx` deverá:

1. carregar `/assets/rive/pisco.riv`;
2. acessar `MascotState` pelo runtime React;
3. ouvir somente os eventos necessários do EventBus;
4. disparar triggers sem reproduzir lógica do jogo;
5. remover todos os listeners ao desmontar;
6. respeitar `prefers-reduced-motion`;
7. usar uma imagem estática ou estado neutro se WebGL/Canvas ou o arquivo falhar;
8. permanecer `aria-hidden`, mantendo a mensagem equivalente na região textual acessível do React.

## Progresso no editor Rive

O arquivo de autoria **Pisco - Laboratorio das Letras** foi criado na conta Rive do projeto em 2026-09-01. O SVG-fonte foi importado no artboard `Mascot` com seus grupos vetoriais editáveis.

Foram preparados no editor:

- as timelines `idle`, `ouvindo`, `pensando`, `dando_dica`, `feliz` e `comemorando`;
- a máquina `MascotState`;
- o View Model com os triggers `listen`, `think`, `hint`, `happy`, `celebrate` e `reset`;
- a propriedade booleana `reducedMotion`.

O arquivo de runtime foi exportado e incorporado em `public/assets/rive/pisco.riv` em 2026-09-01. O binário tem 4.815 bytes e SHA-256 `0e1671cb73c3937e4e4a6523d809b702e4036bda7fc26acdd17c803ee116f7c4`.

A inspeção estrutural confirmou no arquivo os identificadores `Mascot`, `MascotState`, `ViewModel1`, as seis timelines, os seis triggers e `reducedMotion`. O primeiro preview remoto, porém, revelou fundo opaco e o rig deslocado no artboard. `MascotGuide.tsx` usa temporariamente `PiscoFallback.tsx`, uma representação vetorial incorporada ao React que preserva Pisco transparente e reativo sem requisição externa, até um novo export ser validado.

## Critérios para aprovar o `.riv`

- O personagem permanece reconhecível em 80 px.
- As seis reações são distinguíveis sem áudio.
- Não há mudança de layout quando o estado muda.
- Nenhuma reação encobre a barra da palavra ou os controles de toque.
- A animação mantém 60 fps em tablet compatível.
- O arquivo não contém fontes, imagens ou componentes externos sem licença registrada.
- Os nomes do artboard, da máquina e das entradas correspondem integralmente a esta especificação.

## Sequência de implementação

1. Aprovar conceito, nome e aparência. **Concluído.**
2. Preparar o SVG-fonte e instalar `@rive-app/react-canvas`. **Concluído.**
3. Importar o SVG e preparar as peças no editor Rive. **Concluído.**
4. Criar as seis animações, `MascotState` e o View Model. **Concluído no arquivo exportado; validação visual pendente.**
5. Criar `MascotGuide.tsx` e conectar o EventBus. **Concluído com fallback próprio.**
6. Executar lint, TypeScript e build. **Concluído.**
7. Exportar `public/assets/rive/pisco.riv`. **Concluído.**
8. Registrar o `.riv` final em `docs/LICENCAS_ASSETS.md`. **Concluído.**
9. Ativar `RIVE_ASSET_READY`. **Revertido temporariamente após o preview revelar fundo opaco e enquadramento deslocado.**
10. Apresentar preview em desktop e tablet antes de produção. **Primeiro preview concluído; nova validação pendente após o reexport.**

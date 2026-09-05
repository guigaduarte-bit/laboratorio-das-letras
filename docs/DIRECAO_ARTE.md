# Direção de arte — Laboratório das Letras

## Conceito visual

O primeiro mundo é o **Bosque-Laboratório**: uma estação de pesquisa integrada à natureza, com formas arredondadas, materiais orgânicos e sinais visuais de descoberta. A composição deve transmitir curiosidade e segurança, sem excesso de estímulos.

O sistema visual segue uma direção orgânica. A tipografia da interface continua sendo Lexend por legibilidade e coerência com as decisões técnicas do projeto.

## Paleta

| Papel | Nome | Cor |
| --- | --- | --- |
| Texto e contornos | Tinta | `#26383A` |
| Estrutura principal | Musgo profundo | `#355F4B` |
| Vegetação | Musgo | `#606C38` |
| Vegetação secundária | Sálvia | `#8B9D83` |
| Energia e destaque | Argila | `#C66B3D` |
| Detalhes | Ocre | `#C08E3A` |
| Superfícies secundárias | Aveia | `#D4B895` |
| Cartões e painéis | Areia | `#E8DCC7` |
| Tecnologia suave | Lagoa | `#6FAEA4` |
| Feedback positivo | Folha clara | `#A8BC86` |

## Personagem

**Lumi** é um pequeno robô-pesquisador arredondado. O corpo claro e o visor escuro garantem leitura rápida em fundos variados. A antena funciona como indicador de descoberta, iluminando-se durante coletas e celebrações.

Lumi é construído por formas vetoriais próprias dentro do Phaser, sem asset externo. O corpo físico permanece separado da representação visual, permitindo ajustar animação e colisão sem acoplamento.

## Mascote-guia

**Pisco** é o nome de trabalho do vagalume-cientista que acompanhará as instruções na interface React. Ele é menor, mais leve e mais expressivo que Lumi, sem aparência robótica e sem entrar no canvas do Phaser.

- Cabeça e torso em tinta, com silhueta arredondada.
- Abdômen luminoso em ocre, usado como feedback suave.
- Duas asas claras e translúcidas.
- Colete de pesquisador em lagoa e lenço em argila.
- Olhos grandes, antenas curtas e gestos legíveis em tamanho reduzido.
- Brilho contido, sem flashes, oscilações intensas ou estímulo contínuo.

A especificação de rig, expressões e máquina de estados está em `docs/MASCOTE_RIVE.md`.

## Estados mínimos

- `idle`: respiração suave e pulso discreto da antena.
- `walk`: alternância de braços e pernas, sem deformar o corpo.
- `jump`: braços abertos, pernas recolhidas e antena mais luminosa.
- `land`: compressão curta e folhas junto ao chão.
- `collect`: pequeno impulso para cima, braços abertos e partículas de descoberta.
- `celebrate`: braços erguidos, flutuação suave e antena iluminada.

## Cenário do primeiro mundo

O Bosque-Laboratório usa:

- céu em camadas;
- copas e morros em profundidades diferentes;
- árvores estilizadas;
- estação de pesquisa translúcida ao fundo;
- plataformas como módulos arredondados cobertos por musgo;
- plantas pequenas no primeiro plano.

## Cartões de letras

- Fundo areia, contorno musgo profundo e letra em tinta.
- Lexend em peso forte.
- A letra nunca é deformada, substituída ou girada rapidamente.
- Movimento permitido: balanço de aproximadamente dois graus, elevação de poucos pixels, brilho e escala máxima de cerca de `1.12` durante a coleta.

## Feedbacks

- Coleta correta: brilho, partículas e reação da antena de Lumi.
- Letra fora da sequência: o cartão tocado pulsa suavemente e o cartão esperado recebe destaque; não há perda ou indicação agressiva.
- Aterrissagem: pequena emissão de folhas.
- Palavra completa: Lumi comemora, a palavra permanece legível e partículas de folhas e luz ocupam as bordas da composição.

## Restrições

- Não deformar letras.
- Não usar giros rápidos.
- Não usar câmera tremendo como punição.
- Não usar flashes intensos ou animações contínuas de alto contraste.
- Respeitar a preferência de redução de movimento na interface React.

## Expedição das Letras

A pista de brinquedo em areia atravessa água em lagoa e ilhas arredondadas, mantendo a direção orgânica e a Lexend. A perspectiva, as bordas espessas e os cartões verticais dão volume sem distorcer os caracteres. O menu ocupa o próprio mundo; o percurso é a superfície principal.

Cada letra encontrada acrescenta três anéis ao equipamento de Lumi. Sua cor é uma recompensa após a coleta e não indica a alternativa correta. As escolhas usam letra em tinta sobre areia; apenas a dica reforça a borda do alvo e acrescenta um sinal de confirmação.

Pisco permanece no React com o fallback já aprovado. Não são incorporados personagens, imagens, sons ou gráficos da referência externa.

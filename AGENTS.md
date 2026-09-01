# Regras do projeto — Laboratório das Letras

## Fonte de verdade

Antes de realizar qualquer alteração, leia:

- docs/CONCEITO_JOGO.md
- docs/ROADMAP.md
- docs/DECISOES_TECNICAS.md

## Arquitetura

- Usar Phaser 4 para personagem, mundo, plataformas, letras, partículas, câmera e colisões.
- Usar React para menus, configurações e elementos externos ao canvas.
- Usar o EventBus do template para comunicação entre React e Phaser.
- Usar Motion somente em menus, botões, barra da palavra, transições React e cartões de missão.
- Nunca usar Motion para animar elementos dentro do canvas; usar tweens, sprites e partículas do Phaser.
- Usar Howler para voz, fonemas, efeitos sonoros e música ambiente.
- Usar Rive somente no React para o mascote, instruções ou pequenas sequências externas ao canvas.
- Manter o personagem explorador e toda a jogabilidade sob responsabilidade do Phaser.
- Comunicar eventos do Phaser ao mascote Rive por `Phaser → EventBus → React → máquina de estados`.
- Liberar o áudio somente após uma interação explícita, atualmente o botão `COMEÇAR`.
- Usar a fonte Lexend, via Fontsource, na interface React.
- Usar TypeScript.
- Manter cada nível separado do conteúdo das palavras.
- Evitar duplicação de cenas e de lógica.

## Desenvolvimento

- Trabalhar em uma entrega por vez.
- Não construir todas as fases simultaneamente.
- Sempre apresentar preview antes de publicar em produção.
- Não atualizar dependências principais sem necessidade.
- Não instalar bibliotecas adicionais sem justificar.
- Não usar Phaser 3 ou exemplos incompatíveis com Phaser 4.
- Não renderizar o runtime Rive nem publicar um `.riv` antes de o conceito e o arquivo final serem aprovados.

## Experiência infantil

- Não usar cronômetros punitivos.
- Não retirar pontos por erro.
- Não usar telas de derrota.
- Dar feedback positivo e orientações suaves.
- Manter letras visualmente estáveis e legíveis.
- Permitir toque, teclado e controles grandes.
- Priorizar sessões curtas.
- Não reproduzir automaticamente sons antes da interação inicial do usuário.
- Manter voz, fonemas, efeitos e música em volumes confortáveis e sem sobreposição confusa.

## Assets

- Registrar todo asset em docs/LICENCAS_ASSETS.md.
- Não utilizar imagens, músicas ou personagens sem licença verificável.
- Usar placeholders até a mecânica ser validada.
- Tratar vozes sintetizadas como placeholders; validar pronúncia em português brasileiro antes de teste pedagógico ou produção.

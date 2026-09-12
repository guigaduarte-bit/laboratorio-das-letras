# Regras do projeto — Laboratório das Letras

## Fonte de verdade

Antes de realizar qualquer alteração, leia:

- docs/CONCEITO_JOGO.md
- docs/ROADMAP.md
- docs/DECISOES_TECNICAS.md

## Arquitetura

- A expedição principal usa Three.js para personagem, mundo, letras, partículas e câmera 3D, conforme a evolução solicitada pelo usuário em 2026-09-08. Usar Phaser 4 no modo de plataformas e na versão leve de compatibilidade.
- Usar React para menus, configurações e elementos externos ao canvas.
- Usar o EventBus compartilhado para comunicação entre React, regras de jogo e renderizadores.
- Usar Motion somente em menus, botões, barra da palavra, transições React e cartões de missão.
- Nunca usar Motion para animar elementos dentro do canvas; usar o loop do renderizador 3D ou tweens, sprites e partículas do Phaser na versão leve.
- Usar Howler para voz, fonemas, efeitos sonoros e música ambiente.
- Usar Rive somente no React para o mascote, instruções ou pequenas sequências externas ao canvas.
- Manter a lógica da expedição em RunnerController, independente do renderizador. O personagem 3D pertence ao RunnerWorld3D; o personagem da versão leve e o modo de plataformas pertencem ao Phaser.
- Comunicar eventos do jogo ao mascote por `jogo → EventBus → React → máquina de estados`.
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

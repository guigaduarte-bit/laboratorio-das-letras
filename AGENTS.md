# Regras do projeto — Laboratório das Letras

## Fonte de verdade

Antes de realizar qualquer alteração, leia:

- docs/CONCEITO_JOGO.md
- docs/ROADMAP.md
- docs/DECISOES_TECNICAS.md

## Arquitetura

- Usar Phaser 4 para o mundo jogável.
- Usar React para menus, configurações e elementos externos ao canvas.
- Usar o EventBus do template para comunicação entre React e Phaser.
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

## Experiência infantil

- Não usar cronômetros punitivos.
- Não retirar pontos por erro.
- Não usar telas de derrota.
- Dar feedback positivo e orientações suaves.
- Manter letras visualmente estáveis e legíveis.
- Permitir toque, teclado e controles grandes.
- Priorizar sessões curtas.
- Não reproduzir automaticamente sons antes da interação inicial do usuário.

## Assets

- Registrar todo asset em docs/LICENCAS_ASSETS.md.
- Não utilizar imagens, músicas ou personagens sem licença verificável.
- Usar placeholders até a mecânica ser validada.

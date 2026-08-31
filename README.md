# Laboratório das Letras

Jogo curto de exploração para crianças no início da alfabetização. O primeiro MVP apresenta uma tela inicial, um cenário, um personagem provisório, movimento, quatro letras, uma palavra e uma celebração final.

## Primeiro ciclo

A criança move o personagem pelo jardim, encontra as letras **S**, **A**, **P** e **O** e forma a palavra **SAPO**. Não há pontuação, cronômetro, vidas ou tela de derrota.

## Tecnologias

- Phaser 4
- React 19
- Motion para a interface React
- Howler para voz, efeitos e música
- Lexend Variable via Fontsource
- TypeScript
- Next.js 15

O áudio só é liberado após o clique em `COMEÇAR`. Os MP3 atuais são placeholders técnicos; as vozes precisam de gravação e validação em português brasileiro antes de teste com crianças.

## Executar localmente

```bash
npm install
npm run dev
```

O preview local fica disponível em `http://localhost:8080`.

## Verificações

```bash
npm run lint
npm run typecheck
npm run build
```

Consulte `AGENTS.md` e os documentos em `docs/` antes de alterar o projeto.

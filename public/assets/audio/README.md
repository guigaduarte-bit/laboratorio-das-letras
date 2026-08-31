# Áudio provisório do Marco 2

Esta pasta preserva a estrutura definitiva de caminhos, mas os arquivos atuais são placeholders técnicos.

## Textos esperados

- `voice/instructions/encontre-s.mp3`: “Encontre a letra S.”
- `voice/instructions/forme-sapo.mp3`: “Encontre as letras e forme a palavra SAPO.”
- `voice/letters/*.mp3`: nome ou fonema de cada letra, após validação pedagógica.
- `voice/words/sapo.mp3`: “SAPO.”

## Marco 3 — teste técnico de PATO

- `voice/instructions/forme-pato.mp3`
- `voice/letters/t.mp3`
- `voice/words/pato.mp3`

Esses três arquivos são sinais sonoros não verbais gerados localmente com FFmpeg. Eles existem somente para validar o carregamento de áudio orientado por `LevelDefinition` sem gerar erros de rede. Não representam instrução, nome de letra ou leitura da palavra e devem ser substituídos antes de qualquer teste pedagógico.

Antes de teste com o público infantil, substituir as vozes sintetizadas por gravações humanas em português brasileiro, manter os mesmos nomes de arquivo e registrar autoria e licença em `docs/LICENCAS_ASSETS.md`.

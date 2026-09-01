# Pisco no runtime

- `pisco-fallback.svg` é a representação própria usada enquanto o editor Rive não libera a exportação do arquivo de runtime.
- O arquivo final deve ser exportado como `pisco.riv`, com artboard `Mascot`, máquina `MascotState` e as propriedades registradas em `docs/MASCOTE_RIVE.md`.
- Depois da exportação e validação do `.riv`, altere `RIVE_ASSET_READY` para `true` em `src/ui/MascotGuide.tsx`.

Não substitua o fallback por um arquivo externo sem registrar licença e proveniência.

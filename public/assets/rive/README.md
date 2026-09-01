# Pisco no runtime

- `pisco.riv` é o arquivo próprio exportado do editor Rive para o runtime React.
- O arquivo usa o artboard `Mascot`, a máquina `MascotState` e as propriedades registradas em `docs/MASCOTE_RIVE.md`.
- `pisco-fallback.svg` permanece como fallback se o runtime ou o arquivo não puderem ser carregados.
- `RIVE_ASSET_READY` está temporariamente desativado em `src/ui/MascotGuide.tsx`: o primeiro preview revelou fundo opaco e enquadramento deslocado no `.riv`.
- Reative o runtime somente após reexportar o artboard com transparência, rig centralizado e validar o resultado no preview.

Não substitua os arquivos por assets externos sem registrar licença e proveniência.

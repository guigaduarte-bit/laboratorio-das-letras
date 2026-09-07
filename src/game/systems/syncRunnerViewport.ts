import type { Scale } from 'phaser';

/** Refresh does not measure the parent. Read its current bounds before resizing. */
export function syncRunnerViewport(scale: Scale.ScaleManager): void
{
    if (!scale.canvas || !scale.parent) return;
    const { width, height } = scale;
    scale.getParentBounds();
    if (scale.parentSize.width <= 0 || scale.parentSize.height <= 0) return;
    scale.refresh(width, height);
}

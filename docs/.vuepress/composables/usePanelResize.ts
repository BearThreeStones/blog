import { onBeforeUnmount, ref, type Ref } from 'vue';

import { persistPanelSizes, type PanelSizes } from './useUnityEditorState.js';

type ResizeAxis = 'horizontal' | 'vertical';

interface ResizeOptions {
  axis: ResizeAxis;
  /** When true, drag direction is inverted (splitter on trailing panel edge). */
  invert?: boolean;
  min: number;
  max: number;
  getSize: () => number;
  setSize: (value: number) => void;
}

export function usePanelResize(
  panelSizes: Ref<PanelSizes>,
): {
  startResize: (options: ResizeOptions, event: PointerEvent) => void;
  isResizing: Ref<boolean>;
} {
  const isResizing = ref(false);
  let activeOptions: ResizeOptions | null = null;
  let startPos = 0;
  let startSize = 0;

  const onPointerMove = (event: PointerEvent): void => {
    if (!activeOptions) return;
    const rawDelta =
      activeOptions.axis === 'horizontal'
        ? event.clientX - startPos
        : event.clientY - startPos;
    const delta = activeOptions.invert ? -rawDelta : rawDelta;
    let next = startSize + delta;
    next = Math.max(activeOptions.min, Math.min(activeOptions.max, next));
    activeOptions.setSize(next);
    panelSizes.value = { ...panelSizes.value };
    persistPanelSizes(panelSizes.value);
  };

  const onPointerUp = (): void => {
    activeOptions = null;
    isResizing.value = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
  };

  const startResize = (options: ResizeOptions, event: PointerEvent): void => {
    event.preventDefault();
    activeOptions = options;
    startPos = options.axis === 'horizontal' ? event.clientX : event.clientY;
    startSize = options.getSize();
    isResizing.value = true;
    document.body.style.cursor =
      options.axis === 'horizontal' ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  onBeforeUnmount(onPointerUp);

  return { startResize, isResizing };
}

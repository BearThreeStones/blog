import { VIEW_TRANSITION_MS } from '../plugins/classic-animations/lib/classic-motion-presets.mjs';

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export async function runHomeViewTransition(
  navigate: () => void | Promise<void>,
  reducedMotion: boolean,
): Promise<void> {
  if (typeof document === 'undefined') {
    await navigate();
    return;
  }

  if (reducedMotion) {
    await navigate();
    return;
  }

  const root = document.documentElement;
  root.dataset.viewTransition = 'out';
  await sleep(VIEW_TRANSITION_MS);
  await navigate();
  root.dataset.viewTransition = 'in';
  await sleep(VIEW_TRANSITION_MS);
  delete root.dataset.viewTransition;
}

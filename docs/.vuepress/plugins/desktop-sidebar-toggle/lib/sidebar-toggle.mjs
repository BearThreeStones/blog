export const STORAGE_KEY = 'blog:sidebar-collapsed';
export const DESKTOP_MIN_WIDTH = 961;

export function isDesktopViewport(width) {
  return width >= DESKTOP_MIN_WIDTH;
}

export function shouldAttachDesktopToggle({ unityEditorActive, width }) {
  if (unityEditorActive) return false;
  return isDesktopViewport(width);
}

export function shouldRestoreCollapsedPreference(unityEditorActive) {
  return !unityEditorActive;
}

export function readCollapsedPreference(storage) {
  try {
    const value = storage.getItem(STORAGE_KEY);
    if (value === null) return false;
    return value === 'true';
  } catch {
    return false;
  }
}

export function writeCollapsedPreference(storage, collapsed) {
  try {
    storage.setItem(STORAGE_KEY, collapsed ? 'true' : 'false');
  } catch {
    // ignore quota / private mode
  }
}

export function applyCollapsedState(container, collapsed) {
  container.classList.toggle('sidebar-collapsed', collapsed);
}

export function getCollapsedFromContainer(container) {
  return container.classList.contains('sidebar-collapsed');
}

export function getToggleButtonLabels(collapsed) {
  if (collapsed) {
    return { title: '展开侧栏', ariaLabel: '展开侧栏' };
  }
  return { title: '收起侧栏', ariaLabel: '收起侧栏' };
}

export function toggleCollapsed(collapsed) {
  return !collapsed;
}

export function applyButtonLabels(button, collapsed) {
  const { title, ariaLabel } = getToggleButtonLabels(collapsed);
  button.title = title;
  button.setAttribute('aria-label', ariaLabel);
  button.classList.toggle('is-collapsed', collapsed);
}

export function restoreCollapsedState({ storage, container, button }) {
  const collapsed = readCollapsedPreference(storage);
  applyCollapsedState(container, collapsed);
  if (button) applyButtonLabels(button, collapsed);
  return collapsed;
}

export function createDesktopToggleClickHandler({
  getUnityEditorActive,
  getWidth,
  container,
  storage,
  button,
}) {
  return (event) => {
    if (
      !shouldAttachDesktopToggle({
        unityEditorActive: getUnityEditorActive(),
        width: getWidth(),
      })
    ) {
      return false;
    }

    event.preventDefault();
    event.stopPropagation();

    const next = toggleCollapsed(getCollapsedFromContainer(container));
    applyCollapsedState(container, next);
    writeCollapsedPreference(storage, next);
    applyButtonLabels(button, next);
    return true;
  };
}

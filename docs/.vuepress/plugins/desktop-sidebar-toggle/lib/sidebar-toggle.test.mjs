import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DESKTOP_MIN_WIDTH,
  STORAGE_KEY,
  isDesktopViewport,
  shouldAttachDesktopToggle,
  shouldRestoreCollapsedPreference,
  readCollapsedPreference,
  writeCollapsedPreference,
  applyCollapsedState,
  getCollapsedFromContainer,
  getToggleButtonLabels,
  toggleCollapsed,
  applyButtonLabels,
  restoreCollapsedState,
  createDesktopToggleClickHandler,
} from './sidebar-toggle.mjs';

function mockStorage(initial = {}) {
  const data = { ...initial };
  return {
    getItem(key) {
      return key in data ? data[key] : null;
    },
    setItem(key, value) {
      data[key] = String(value);
    },
    _data: data,
  };
}

function mockClassList() {
  const classes = new Set();
  return {
    contains(name) {
      return classes.has(name);
    },
    toggle(name, force) {
      if (force === undefined) {
        if (classes.has(name)) classes.delete(name);
        else classes.add(name);
      } else if (force) {
        classes.add(name);
      } else {
        classes.delete(name);
      }
    },
    add(name) {
      classes.add(name);
    },
    delete(name) {
      classes.delete(name);
    },
    _classes: classes,
  };
}

describe('sidebar-toggle', () => {
  test('isDesktopViewport is true when width is at least 961px', () => {
    assert.equal(DESKTOP_MIN_WIDTH, 961);
    assert.equal(isDesktopViewport(960), false);
    assert.equal(isDesktopViewport(961), true);
    assert.equal(isDesktopViewport(1920), true);
  });

  test('shouldRestoreCollapsedPreference is false on unity editor', () => {
    assert.equal(shouldRestoreCollapsedPreference(true), false);
    assert.equal(shouldRestoreCollapsedPreference(false), true);
  });

  test('shouldAttachDesktopToggle is false on unity editor or narrow viewport', () => {
    assert.equal(
      shouldAttachDesktopToggle({ unityEditorActive: true, width: 1200 }),
      false,
    );
    assert.equal(
      shouldAttachDesktopToggle({ unityEditorActive: false, width: 960 }),
      false,
    );
    assert.equal(
      shouldAttachDesktopToggle({ unityEditorActive: false, width: 1200 }),
      true,
    );
  });

  test('readCollapsedPreference defaults to false when storage is empty', () => {
    const storage = mockStorage();
    assert.equal(readCollapsedPreference(storage), false);
  });

  test('writeCollapsedPreference persists boolean as string', () => {
    const storage = mockStorage();
    writeCollapsedPreference(storage, true);
    assert.equal(storage._data[STORAGE_KEY], 'true');
    writeCollapsedPreference(storage, false);
    assert.equal(storage._data[STORAGE_KEY], 'false');
  });

  test('readCollapsedPreference reads stored value', () => {
    const storage = mockStorage({ [STORAGE_KEY]: 'true' });
    assert.equal(readCollapsedPreference(storage), true);
  });

  test('applyCollapsedState toggles sidebar-collapsed on container', () => {
    const container = { classList: mockClassList() };
    applyCollapsedState(container, true);
    assert.equal(getCollapsedFromContainer(container), true);
    applyCollapsedState(container, false);
    assert.equal(getCollapsedFromContainer(container), false);
  });

  test('getToggleButtonLabels returns Chinese labels for each state', () => {
    assert.deepEqual(getToggleButtonLabels(false), {
      title: '收起侧栏',
      ariaLabel: '收起侧栏',
    });
    assert.deepEqual(getToggleButtonLabels(true), {
      title: '展开侧栏',
      ariaLabel: '展开侧栏',
    });
  });

  test('toggleCollapsed inverts boolean', () => {
    assert.equal(toggleCollapsed(false), true);
    assert.equal(toggleCollapsed(true), false);
  });

  test('applyButtonLabels sets title, aria-label, and is-collapsed class', () => {
    const button = {
      title: '',
      classList: mockClassList(),
      setAttribute(name, value) {
        this[name] = value;
      },
    };
    applyButtonLabels(button, true);
    assert.equal(button.title, '展开侧栏');
    assert.equal(button['aria-label'], '展开侧栏');
    assert.equal(button.classList.contains('is-collapsed'), true);
  });

  test('restoreCollapsedState applies stored preference to container and button', () => {
    const storage = mockStorage({ [STORAGE_KEY]: 'true' });
    const container = { classList: mockClassList() };
    const button = {
      title: '',
      classList: mockClassList(),
      setAttribute(name, value) {
        this[name] = value;
      },
    };
    const collapsed = restoreCollapsedState({ storage, container, button });
    assert.equal(collapsed, true);
    assert.equal(getCollapsedFromContainer(container), true);
    assert.equal(button.title, '展开侧栏');
  });

  test('createDesktopToggleClickHandler toggles state and prevents default on desktop', () => {
    const storage = mockStorage();
    const container = { classList: mockClassList() };
    const button = {
      title: '',
      classList: mockClassList(),
      setAttribute(name, value) {
        this[name] = value;
      },
    };
    const event = { defaultPrevented: false, preventDefault() { this.defaultPrevented = true; }, stopPropagation() {} };

    const handler = createDesktopToggleClickHandler({
      getUnityEditorActive: () => false,
      getWidth: () => 1200,
      container,
      storage,
      button,
    });

    const handled = handler(event);
    assert.equal(handled, true);
    assert.equal(event.defaultPrevented, true);
    assert.equal(getCollapsedFromContainer(container), true);
    assert.equal(readCollapsedPreference(storage), true);
    assert.equal(button.title, '展开侧栏');
  });

  test('createDesktopToggleClickHandler does nothing on narrow viewport', () => {
    const storage = mockStorage();
    const container = { classList: mockClassList() };
    const button = {
      title: '',
      classList: mockClassList(),
      setAttribute() {},
    };
    const event = { defaultPrevented: false, preventDefault() { this.defaultPrevented = true; }, stopPropagation() {} };

    const handler = createDesktopToggleClickHandler({
      getUnityEditorActive: () => false,
      getWidth: () => 800,
      container,
      storage,
      button,
    });

    const handled = handler(event);
    assert.equal(handled, false);
    assert.equal(event.defaultPrevented, false);
    assert.equal(getCollapsedFromContainer(container), false);
  });
});

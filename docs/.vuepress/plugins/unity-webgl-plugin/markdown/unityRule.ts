import type MarkdownIt from 'markdown-it';
import type StateBlock from 'markdown-it/lib/rules_block/state_block.mjs';
import type StateInline from 'markdown-it/lib/rules_inline/state_inline.mjs';

// Allowed query parameters (STRICT WHITELIST)
const ALLOWED_PARAMS = ['width', 'height', 'fullscreen', 'primaryColor', 'backgroundColor'];

const GAME_SYNTAX_RE = /^!\[(game|unity:game)\]\(([^)]+)\)\s*$/;

// Validation functions
function validateNumber(value: string, min: number, max: number, defaultValue: number): number {
  const num = parseInt(value, 10);
  if (isNaN(num) || num < min || num > max) return defaultValue;
  return num;
}

function validateHexColor(value: string): string | null {
  return /^#[0-9A-Fa-f]{6}$/.test(value) ? value : null;
}

function validateBoolean(value: string): boolean {
  return value === 'true' || value === '1';
}

function parseGameDestination(destination: string): {
  gamePath: string;
  validatedParams: Record<string, string | number | boolean>;
} {
  const [gamePath, queryString] = destination.split('?');
  const params = new URLSearchParams(queryString || '');
  const validatedParams: Record<string, string | number | boolean> = {};

  for (const [key, value] of params.entries()) {
    if (!ALLOWED_PARAMS.includes(key)) continue;

    switch (key) {
      case 'width':
        validatedParams.width = validateNumber(value, 200, 4096, 800);
        break;
      case 'height':
        validatedParams.height = validateNumber(value, 200, 4096, 450);
        break;
      case 'fullscreen':
        validatedParams.fullscreen = validateBoolean(value);
        break;
      case 'primaryColor':
      case 'backgroundColor': {
        const color = validateHexColor(value);
        if (color) validatedParams[key] = color;
        break;
      }
    }
  }

  return { gamePath, validatedParams };
}

function pushUnityPlayerToken(
  state: StateBlock | StateInline,
  gamePath: string,
  validatedParams: Record<string, string | number | boolean>,
): void {
  const token = state.push('unity_player', '', 0);
  token.markup = '![game]';
  token.content = gamePath;
  token.meta = validatedParams;
}

/**
 * Block rule for standalone `![game](path)` lines.
 * Inline parsing would wrap the player in <p>, which breaks Vue hydration
 * because UnityPlayer renders block-level <div> elements.
 */
export function unityBlockRule(
  state: StateBlock,
  startLine: number,
  endLine: number,
  silent: boolean,
): boolean {
  const pos = state.bMarks[startLine] + state.tShift[startLine];
  const max = state.eMarks[startLine];
  const line = state.src.slice(pos, max).trim();
  const match = GAME_SYNTAX_RE.exec(line);

  if (!match) {
    return false;
  }

  if (silent) {
    return true;
  }

  const { gamePath, validatedParams } = parseGameDestination(match[2]);
  pushUnityPlayerToken(state, gamePath, validatedParams);
  state.line = startLine + 1;

  return true;
}

// Inline rule kept only for mid-paragraph syntax (rare); standalone lines use block rule.
export function unityInlineRule(state: StateInline, silent: boolean): boolean {
  const start = state.pos;
  const max = state.posMax;

  if (state.src.charCodeAt(start) !== 0x21 /* ! */ ||
      state.src.charCodeAt(start + 1) !== 0x5B /* [ */) {
    return false;
  }

  const labelStart = start + 2;
  let labelEnd = -1;

  for (let i = labelStart; i < max; i++) {
    if (state.src.charCodeAt(i) === 0x5D /* ] */) {
      labelEnd = i;
      break;
    }
  }

  if (labelEnd === -1) return false;

  const label = state.src.slice(labelStart, labelEnd);

  if (label !== 'game' && label !== 'unity:game') {
    return false;
  }

  if (state.src.charCodeAt(labelEnd + 1) !== 0x28 /* ( */) {
    return false;
  }

  const destStart = labelEnd + 2;
  let destEnd = -1;

  for (let i = destStart; i < max; i++) {
    if (state.src.charCodeAt(i) === 0x29 /* ) */) {
      destEnd = i;
      break;
    }
  }

  if (destEnd === -1) return false;

  // Let the block rule handle standalone lines (avoids <p> wrapper).
  const lineStart = state.src.lastIndexOf('\n', start - 1) + 1;
  const lineEnd = state.src.indexOf('\n', destEnd);
  const line = state.src
    .slice(lineStart, lineEnd === -1 ? state.src.length : lineEnd)
    .trim();

  if (GAME_SYNTAX_RE.test(line)) {
    return false;
  }

  const destination = state.src.slice(destStart, destEnd);
  const { gamePath, validatedParams } = parseGameDestination(destination);

  if (!silent) {
    pushUnityPlayerToken(state, gamePath, validatedParams);
  }

  state.pos = destEnd + 1;

  return true;
}

// Renderer function (converts token to HTML/Vue component)
export function renderUnityPlayer(md: MarkdownIt): void {
  md.renderer.rules.unity_player = (tokens, idx) => {
    const token = tokens[idx];
    const gamePath = token.content;
    const params = token.meta || {};

    const props = {
      'game-path': gamePath,
      width: params.width ?? 800,
      height: params.height ?? 450,
      fullscreen: params.fullscreen ?? true,
      ...(params.primaryColor && { 'primary-color': params.primaryColor }),
      ...(params.backgroundColor && { 'background-color': params.backgroundColor }),
    };

    const propsStr = Object.entries(props)
      .map(([key, value]) => {
        if (typeof value === 'boolean') {
          return value ? `:${key}="true"` : `:${key}="false"`;
        }
        if (typeof value === 'number') {
          return `:${key}="${value}"`;
        }
        return `${key}="${value}"`;
      })
      .join(' ');

    return `<ClientOnly><UnityPlayer ${propsStr} /></ClientOnly>`;
  };
}

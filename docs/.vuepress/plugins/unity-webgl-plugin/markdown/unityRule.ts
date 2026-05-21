import type MarkdownIt from 'markdown-it';
import type StateInline from 'markdown-it/lib/rules_inline/state_inline.mjs';

// Allowed query parameters (STRICT WHITELIST)
const ALLOWED_PARAMS = ['width', 'height', 'fullscreen', 'primaryColor', 'backgroundColor'];

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

// Main parsing function
export function unityInlineRule(state: StateInline, silent: boolean): boolean {
  const start = state.pos;
  const max = state.posMax;
  
  // Check opening marker: ![
  if (state.src.charCodeAt(start) !== 0x21 /* ! */ ||
      state.src.charCodeAt(start + 1) !== 0x5B /* [ */) {
    return false;
  }
  
  // Find closing ]
  const labelStart = start + 2;
  let labelEnd = -1;
  
  for (let i = labelStart; i < max; i++) {
    if (state.src.charCodeAt(i) === 0x5D /* ] */) {
      labelEnd = i;
      break;
    }
  }
  
  if (labelEnd === -1) return false;
  
  // Extract label text
  const label = state.src.slice(labelStart, labelEnd);
  
  // Check if label matches "game" or "unity:game"
  if (label !== 'game' && label !== 'unity:game') {
    return false; // Let default image rule handle it
  }
  
  // Check for opening parenthesis: (
  if (state.src.charCodeAt(labelEnd + 1) !== 0x28 /* ( */) {
    return false;
  }
  
  // Find closing )
  const destStart = labelEnd + 2;
  let destEnd = -1;
  
  for (let i = destStart; i < max; i++) {
    if (state.src.charCodeAt(i) === 0x29 /* ) */) {
      destEnd = i;
      break;
    }
  }
  
  if (destEnd === -1) return false;
  
  // Extract destination (path + query params)
  const destination = state.src.slice(destStart, destEnd);
  
  // Parse path and query string
  const [gamePath, queryString] = destination.split('?');
  
  // Parse and validate query parameters
  const params = new URLSearchParams(queryString || '');
  const validatedParams: Record<string, string | number | boolean> = {};
  
  for (const [key, value] of params.entries()) {
    // Ignore unknown parameters (strict whitelist)
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
      case 'backgroundColor':
        const color = validateHexColor(value);
        if (color) validatedParams[key] = color;
        break;
    }
  }
  
  // If not in silent mode, create tokens
  if (!silent) {
    // Create token
    const token = state.push('unity_player', '', 0);
    token.markup = '![game]';
    token.content = gamePath;
    token.meta = validatedParams;
  }
  
  // Update parser position
  state.pos = destEnd + 1;
  
  return true;
}

// Renderer function (converts token to HTML/Vue component)
export function renderUnityPlayer(md: MarkdownIt): void {
  md.renderer.rules.unity_player = (tokens, idx) => {
    const token = tokens[idx];
    const gamePath = token.content;
    const params = token.meta || {};
    
    // Build props object with defaults
    const props = {
      'game-path': gamePath,
      width: params.width ?? 800,
      height: params.height ?? 450,
      fullscreen: params.fullscreen ?? true,
      ...(params.primaryColor && { 'primary-color': params.primaryColor }),
      ...(params.backgroundColor && { 'background-color': params.backgroundColor })
    };
    
    // Serialize props to attributes
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
    
    // Return Vue component wrapped in ClientOnly
    return `<ClientOnly><UnityPlayer ${propsStr} /></ClientOnly>`;
  };
}

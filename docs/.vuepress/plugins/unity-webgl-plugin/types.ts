// Component props interface
export interface UnityPlayerProps {
  gamePath: string;          // Relative path: "flappy-bird"
  width?: number;            // Default: 800
  height?: number;           // Default: 450
  fullscreen?: boolean;      // Default: true (show button)
  primaryColor?: string;     // Hex color for UI
  backgroundColor?: string;  // Hex color for canvas background
}

// Internal state
export type UnityPlayerState = 'INITIAL' | 'LOADING' | 'LOADED' | 'ERROR';

// Unity config object (passed to createUnityInstance)
export interface UnityConfig {
  dataUrl: string;
  frameworkUrl: string;
  codeUrl: string;
  streamingAssetsUrl: string;
  companyName: string;
  productName: string;
  productVersion: string;
  matchWebGLToCanvasSize: boolean;
  devicePixelRatio: number;
}

// Unity instance interface (from Unity loader)
export interface UnityInstance {
  Quit: () => Promise<void>;
  SendMessage: (objectName: string, methodName: string, value?: string | number) => void;
  SetFullscreen: (fullscreen: number) => void;
}

// Markdown token metadata
export interface UnityPlayerToken {
  type: 'unity_player';
  gamePath: string;
  params: Record<string, string | number | boolean>;
}

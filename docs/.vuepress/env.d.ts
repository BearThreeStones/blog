declare const __UNITY_CATALOG__: string;

declare module '*.json' {
  const value: Record<string, string>;
  export default value;
}

declare module './i18n/unity-glossary.json' {
  const value: Record<string, string>;
  export default value;
}

export {};

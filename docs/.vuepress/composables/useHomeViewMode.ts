import { computed } from 'vue';

import { useRoute, useRouter } from 'vuepress/client';



import { useSiteLocale } from './useSiteLocale.js';

import { usePrefersReducedMotion } from './usePrefersReducedMotion.js';

import { runHomeViewTransition } from './useHomeViewTransition.js';



export type HomeViewMode = 'editor' | 'classic';



const STORAGE_KEY = 'stonybear-home-view';



const CLASSIC_PATH = '/classic/';

const EN_CLASSIC_PATH = '/en/classic/';



export function isClassicHomePath(path: string): boolean {

  const normalized = path.replace(/\.html$/, '').replace(/\/$/, '') || '/';

  return normalized === '/classic' || normalized === '/en/classic';

}



export function useHomeViewMode() {

  const router = useRouter();

  const route = useRoute();

  const { localizePath } = useSiteLocale();

  const reducedMotion = usePrefersReducedMotion();



  const editorHomePath = computed(() => localizePath('/'));

  const classicHomePath = computed(() =>

    localizePath(route.path.startsWith('/en') ? EN_CLASSIC_PATH : CLASSIC_PATH),

  );



  const getMode = (): HomeViewMode => {
    if (typeof localStorage === 'undefined') return 'classic';

    const raw = localStorage.getItem(STORAGE_KEY);

    return raw === 'editor' ? 'editor' : 'classic';
  };



  const setMode = (mode: HomeViewMode): void => {

    if (typeof localStorage === 'undefined') return;

    localStorage.setItem(STORAGE_KEY, mode);

  };



  const switchToClassic = (): void => {

    setMode('classic');

    void runHomeViewTransition(

      () => router.push(classicHomePath.value),

      Boolean(reducedMotion.value),

    );

  };



  const switchToEditor = (): void => {

    setMode('editor');

    void runHomeViewTransition(

      () => router.push(editorHomePath.value),

      Boolean(reducedMotion.value),

    );

  };



  const isClassicRoute = computed(() => isClassicHomePath(route.path));



  return {

    editorHomePath,

    classicHomePath,

    getMode,

    setMode,

    switchToClassic,

    switchToEditor,

    isClassicRoute,

  };

}


<script setup lang="ts">
import { ColorModeSwitch } from 'vuepress-theme-hope/client';

import { useSiteLocale } from '../../composables/useSiteLocale.js';

const { t } = useSiteLocale();
</script>

<template>
  <div class="unity-color-mode" :title="t('themeColorModeTitle')">
    <ColorModeSwitch />
  </div>
</template>

<script setup lang="ts">
import { useSiteLocale } from '../../composables/useSiteLocale.js';

const { tUnity } = useSiteLocale();

const menus = [
  'File',
  'Edit',
  'Assets',
  'GameObject',
  'Component',
  'Services',
  'Jobs',
  'Window',
  'Help',
] as const;
</script>

<template>
  <div class="unity-menu-bar" role="menubar">
    <span v-for="item in menus" :key="item" class="unity-menu-item" role="menuitem">{{ tUnity(item) }}</span>
  </div>
</template>

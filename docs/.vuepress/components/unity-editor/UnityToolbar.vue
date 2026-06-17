<script setup lang="ts">
import { useSiteLocale } from '../../composables/useSiteLocale.js';
import UnityColorMode from './UnityColorMode.vue';
import UnityHomeViewSwitch from './UnityHomeViewSwitch.vue';
import UnitySiteSearchButton from './UnitySiteSearchButton.vue';

const { t } = useSiteLocale();
</script>

<template>
  <div class="unity-toolbar">
    <div class="unity-toolbar-spacer" />
    <div class="unity-btn-group unity-btn-group--mini" role="group" :aria-label="t('toolbarActionsAria')">
      <UnitySiteSearchButton />
      <UnityHomeViewSwitch />
      <UnityColorMode />
    </div>
  </div>
</template>

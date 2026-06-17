<script setup lang="ts">
import { useSiteLocale } from '../composables/useSiteLocale.js';
import { useHomeViewMode } from '../composables/useHomeViewMode.js';

const { t } = useSiteLocale();
const { isClassicRoute, switchToEditor } = useHomeViewMode();
</script>

<template>
  <button
    v-if="isClassicRoute"
    type="button"
    class="home-view-switch-fab"
    :title="t('homeViewSwitchToEditor')"
    :aria-label="t('homeViewSwitchToEditor')"
    @click="switchToEditor"
  >
    <span class="home-view-switch-fab-icon" aria-hidden="true" />
    <span class="home-view-switch-fab-label">{{ t('homeViewSwitchToEditor') }}</span>
  </button>
</template>

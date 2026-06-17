<script setup lang="ts">
import { useSiteLocale } from '../../composables/useSiteLocale.js';
import { useHomeViewMode } from '../../composables/useHomeViewMode.js';

const { t } = useSiteLocale();
const { switchToClassic } = useHomeViewMode();
</script>

<template>
  <button
    type="button"
    class="unity-toolbar-view-btn"
    :title="t('homeViewSwitchToClassic')"
    :aria-label="t('homeViewSwitchToClassic')"
    @click="switchToClassic"
  >
    <span class="unity-toolbar-view-icon unity-toolbar-view-icon--blog" aria-hidden="true" />
  </button>
</template>

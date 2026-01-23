<script setup lang="ts">
defineProps<{
  horizontal?: boolean;
}>();
</script>

<template>
  <box
    :padding="1"
    :border="true"
    borderColor="#F197DB"
    title="slot component"
    backgroundColor="#12110F"
    :width="horizontal ? '50%' : undefined"
    :height="horizontal ? undefined : '50%'"
    :flexGrow="0"
    :flexShrink="0"
  >
    <slot />
  </box>
</template>

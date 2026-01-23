<script setup lang="ts">
import type { SelectRenderable } from "@opentui/core";
import { onMounted, useTemplateRef } from "vue";

const props = defineProps<{
  options: { name: string; description: string }[];
  focused?: boolean;
  horizontal?: boolean;
}>();

defineEmits<{
  hoverChange: [index: number];
  select: [index: number];
}>();
</script>

<template>
  <box
    :width="horizontal ? '50%' : undefined"
    :height="horizontal ? undefined : '50%'"
    :flexGrow="0"
    :flexShrink="0"
  >
    <select
      ref="select"
      :flexGrow="1"
      :options="options"
      selectedTextColor="#F197DB"
      backgroundColor="#111"
      focusedBackgroundColor="#111"
      selectedBackgroundColor="#F197DB55"
      @change="(index: any) => $emit('hoverChange', index)"
      @select="(index: any) => $emit('select', index)"
      :focused="focused"
    />
  </box>
</template>

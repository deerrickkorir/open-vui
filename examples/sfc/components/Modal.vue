<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useTerminalDimensions } from "../../../src/elements/hooks";

const props = defineProps<{
  width?: number;
  height?: number;
}>();

const terminal = useTerminalDimensions();

const width = computed(() => props.width ?? 30);
const height = computed(() => props.height ?? 30);

const marginTop = computed(() => -height.value / 2);
const marginLeft = computed(() => -width.value / 2);

// track if the modal is focused
const focused = ref(false);
onMounted(() => {
  focused.value = true;
});
</script>

<template>
  <box
    border
    backgroundColor="#111"
    :style="{
      position: 'absolute',
      top: '50%',
      left: '50%',
      marginTop: marginTop,
      marginLeft: marginLeft,
      width: width,
      height: height,
    }"
    flexDirection="column"
    justifyContent="center"
    alignItems="center"
    :padding="1"
  >
    <text>example popup</text>
    <select
      :options="[
        { name: 'option 1' },
        { name: 'option 2' },
        { name: 'option 3' },
      ]"
      :style="{ width: '100%' }"
      :flexGrow="1"
      :focused="focused"
    />
  </box>
</template>

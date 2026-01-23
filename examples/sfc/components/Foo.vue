<script setup lang="ts">
const props = defineProps<{
  name: string;
}>();
</script>

<template>
  <text fg="#F197DB"> Hovered name: {{ name }}</text>
</template>

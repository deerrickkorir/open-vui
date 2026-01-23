<script setup lang="ts">
import { onMounted, ref, computed, watchEffect, useTemplateRef } from "vue";
import { onResize, useKeyboard, useRenderer } from "../../src/elements/hooks";
import Foo from "./components/Foo.vue";
import SlotComponent from "./components/SlotComponent.vue";
import SelectList from "./components/SelectList.vue";
import Modal from "./components/Modal.vue";
import Logo from "./components/Logo.vue";

const options = ref<{ name: string; description: string }[]>([
  {
    name: "Create new project",
    description: "Initialize a new project from template",
  },
  { name: "Open workspace", description: "Load an existing project workspace" },
  { name: "Save current file", description: "Write changes to disk (Ctrl+S)" },
  { name: "Search in files", description: "Find text across project files" },
  { name: "Run tests", description: "Execute test suite for current project" },
  { name: "Build project", description: "Compile and bundle application" },
  { name: "Open terminal", description: "Launch integrated terminal panel" },
  { name: "View documentation", description: "Open API reference and guides" },
  { name: "Settings", description: "Configure editor preferences and themes" },
  { name: "Install dependencies", description: "Run package manager install" },
  { name: "Git commit", description: "Stage and commit changes to repository" },
  {
    name: "Deploy to production",
    description: "Publish application to live server",
  },
]);

const hoveredIndex = ref<number>(0);
const selectedIndex = ref<number>(0);

const hoveredName = computed(
  () => options.value[hoveredIndex.value]?.name ?? ""
);

const renderer = useRenderer();

const count = ref(0);

const showModal = ref(false);

const isCtrlL = (name: string, key: any) => {
  if ((key?.ctrl || key?.control) && name === "l") return true;
  return name === "C-l" || name === "ctrl+l" || name === "control+l";
};

const isEscape = (name: string) =>
  name === "escape" || name === "esc" || name === "Escape";

useKeyboard((key) => {
  const name = (key as any)?.name;
  if (!name) return;

  if (isCtrlL(name, key)) {
    showModal.value = true;
    return;
  }

  if (showModal.value && isEscape(name)) {
    showModal.value = false;
  }
});

const horizontal = ref(false);
onMounted(() => {
  horizontal.value = renderer.width >= 100;
  setInterval(() => {
    count.value++;
  }, 1000);
});

onResize(() => {
  horizontal.value = renderer.width >= 100;
});

// TODO: find a better way to manage focus. the .focus() isn't working as expected.
const mainSelectFocused = computed(() => !showModal.value);
</script>

<template>
  <box
    border
    :style="{ width: '100%', height: '100%' }"
    title="open-vui select"
    backgroundColor="#000"
    flexDirection="column"
    :padding="4"
  >
    <Logo />
    <text>Count should be reactive: {{ count }}</text>
    <text>Hovered name: {{ hoveredIndex }}</text>
    <text>Layout: {{ horizontal ? "horizontal" : "vertical" }}</text>
    <box
      :flexDirection="horizontal ? 'row' : 'column'"
      :gap="1"
      :style="{ top: 2, height: horizontal ? 16 : undefined, width: '100%' }"
      :flexGrow="1"
    >
      <SelectList
        ref="select"
        :options="options"
        :focused="mainSelectFocused"
        :horizontal="horizontal"
        @hoverChange="hoveredIndex = $event"
        @select="selectedIndex = $event"
      />
      <SlotComponent :horizontal="horizontal">
        <box flexDirection="column" :gap="1">
          <text>Hello from slot</text>
          <Foo :name="hoveredName" />
        </box>
      </SlotComponent>
    </box>
    <box :style="{ height: 2 }" :flexShrink="0">
      <text>arrow keys to move; ctrl+l to open modal</text>
    </box>

    <Modal v-if="showModal" />
  </box>
</template>

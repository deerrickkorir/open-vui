<script setup lang="ts">
import { computed } from "vue";

// Shadow markers (rendered chars in parens):
// _ = full shadow cell (space with bg=shadow)
// ^ = letter top, shadow bottom (▀ with fg=letter, bg=shadow)
// ~ = shadow top only (▀ with fg=shadow)
const SHADOW_MARKER = /[_^~]/;

const LOGO_LEFT = [
  `                   `,
  `█▀▀█ █▀▀█ █▀▀█ █▀▀▄`,
  `█__█ █__█ █▀▀▀ █  █`,
  `▀▀▀▀ █▀▀▀ ▀▀▀▀ ▀  ▀`,
];

const LOGO_RIGHT = [
  `              `,
  `█  █ █  █ █   `,
  `█  █ █__█ █   `,
  ` ▀▀   ▀▀▀ ▀   `,
];

interface Theme {
  text?: string;
  textMuted?: string;
  background?: string;
}

const props = withDefaults(
  defineProps<{
    theme?: Theme;
  }>(),
  {
    theme: () => ({
      text: "#c9d1d9",
      textMuted: "#8b949e",
      background: "#000000",
    }),
  }
);

// Convert hex to RGB
function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [0, 0, 0];
  return [
    parseInt(result[1]!, 16),
    parseInt(result[2]!, 16),
    parseInt(result[3]!, 16),
  ];
}

// Convert RGB to hex
function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b]
    .map((x) => Math.round(x).toString(16).padStart(2, "0"))
    .join("")}`;
}

// Tint a color by blending it with another color
function tint(base: string, color: string, amount: number): string {
  const [br, bg, bb] = hexToRgb(base);
  const [cr, cg, cb] = hexToRgb(color);
  return rgbToHex(
    br + (cr - br) * amount,
    bg + (cg - bg) * amount,
    bb + (cb - bb) * amount
  );
}

interface TextSegment {
  text: string;
  fg?: string;
  bg?: string;
  bold?: boolean;
}

function renderLine(line: string, fg: string, bold: boolean): TextSegment[] {
  const shadow = tint(props.theme.background || "#000000", fg, 0.25);
  const segments: TextSegment[] = [];
  let i = 0;

  while (i < line.length) {
    const rest = line.slice(i);
    const markerIndex = rest.search(SHADOW_MARKER);

    if (markerIndex === -1) {
      segments.push({
        text: rest,
        fg,
        bold,
      });
      break;
    }

    if (markerIndex > 0) {
      segments.push({
        text: rest.slice(0, markerIndex),
        fg,
        bold,
      });
    }

    const marker = rest[markerIndex];
    switch (marker) {
      case "_":
        segments.push({
          text: " ",
          fg,
          bg: shadow,
          bold,
        });
        break;
      case "^":
        segments.push({
          text: "▀",
          fg,
          bg: shadow,
          bold,
        });
        break;
      case "~":
        segments.push({
          text: "▀",
          fg: shadow,
          bold,
        });
        break;
    }

    i += markerIndex + 1;
  }

  return segments;
}

const logoLines = computed(() => {
  return LOGO_LEFT.map((leftLine, index) => {
    const rightLine = LOGO_RIGHT[index]!;
    return {
      left: renderLine(leftLine, "#8b949e", false),
      right: renderLine(rightLine, "#15CA82", true),
    };
  });
});
</script>

<template>
  <box>
    <box
      v-for="(line, index) in logoLines"
      :key="index"
      flexDirection="row"
      :gap="1"
    >
      <box flexDirection="row">
        <text
          v-for="(segment, segIndex) in line.left"
          :key="segIndex"
          :fg="segment.fg"
          :bg="segment.bg"
          :selectable="false"
        >
          {{ segment.text }}
        </text>
      </box>
      <box flexDirection="row">
        <text
          v-for="(segment, segIndex) in line.right"
          :key="segIndex"
          :fg="segment.fg"
          :bg="segment.bg"
          :selectable="false"
        >
          {{ segment.text }}
        </text>
      </box>
    </box>
  </box>
</template>

import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { defineComponent, Fragment, h, ref } from "vue";
import { testRender } from "../index";

let testSetup: Awaited<ReturnType<typeof testRender>>;

describe("open-vui (layout parity)", () => {
  beforeEach(() => {
    if (testSetup) testSetup.renderer.destroy();
  });

  afterEach(() => {
    if (testSetup) testSetup.renderer.destroy();
  });

  it("renders multiline text with <br>", async () => {
    const App = defineComponent({
      render: () => h("text", ["Line 1", h("br"), "Line 2", h("br"), "Line 3"]),
    });

    testSetup = await testRender(App, { width: 15, height: 5 });
    await testSetup.renderOnce();
    expect(testSetup.captureCharFrame()).toMatchSnapshot();
  });

  it("renders basic box layout", async () => {
    const App = defineComponent({
      render: () =>
        h("box", { style: { width: 20, height: 5, border: true } }, [
          h("text", "Inside Box"),
        ]),
    });

    testSetup = await testRender(App, { width: 25, height: 8 });
    await testSetup.renderOnce();
    expect(testSetup.captureCharFrame()).toMatchSnapshot();
  });

  it("renders nested boxes", async () => {
    const App = defineComponent({
      render: () =>
        h(
          "box",
          {
            style: { width: 30, height: 10, border: true },
            title: "Parent Box",
          },
          [
            h(
              "box",
              {
                style: { left: 2, top: 2, width: 10, height: 3, border: true },
              },
              [h("text", "Nested")]
            ),
            h("text", { style: { left: 15, top: 2 } }, "Sibling"),
          ]
        ),
    });

    testSetup = await testRender(App, { width: 35, height: 12 });
    await testSetup.renderOnce();
    expect(testSetup.captureCharFrame()).toMatchSnapshot();
  });

  it("supports conditional rendering updates", async () => {
    const showText = ref(true);
    const App = defineComponent({
      setup: () => () =>
        h("text", { wrapMode: "none" }, [
          "Always visible",
          showText.value ? " - Conditional text" : "",
        ]),
    });

    testSetup = await testRender(App, { width: 30, height: 3 });
    await testSetup.renderOnce();
    const visible = testSetup.captureCharFrame();

    showText.value = false;
    await testSetup.renderOnce();
    const hidden = testSetup.captureCharFrame();

    expect(visible).toMatchSnapshot();
    expect(hidden).toMatchSnapshot();
    expect(hidden).not.toBe(visible);
  });

  // TODO: Fix this test, or even see if it should be supported
  it.skip("handles empty component", async () => {
    const App = defineComponent({ render: () => h(Fragment, []) });

    testSetup = await testRender(App, { width: 10, height: 5 });
    await testSetup.renderOnce();
    expect(testSetup.captureCharFrame()).toMatchSnapshot();
  });
});

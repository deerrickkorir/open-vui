import { describe, expect, it, beforeEach, afterEach } from "bun:test"
import { defineComponent, h, ref } from "vue"
import { testRender } from "../index"
import WhitespaceFixture from "./fixtures/WhitespaceFixture.vue"
import ScriptSetupTsFixture from "./fixtures/ScriptSetupTsFixture.vue"

let testSetup: Awaited<ReturnType<typeof testRender>>

describe("open-vui (Vue custom renderer)", () => {
  beforeEach(() => {
    if (testSetup) {
      testSetup.renderer.destroy()
    }
  })

  afterEach(() => {
    if (testSetup) {
      testSetup.renderer.destroy()
    }
  })

  it("renders simple text", async () => {
    const App = defineComponent({
      render: () => h("text", "Hello World"),
    })

    testSetup = await testRender(App, { width: 20, height: 5 })
    await testSetup.renderOnce()

    expect(testSetup.captureCharFrame()).toMatchSnapshot()
  })

  it("updates reactively", async () => {
    const counter = ref(0)
    const App = defineComponent({
      setup: () => () => h("text", `Counter: ${counter.value}`),
    })

    testSetup = await testRender(App, { width: 20, height: 3 })
    await testSetup.renderOnce()
    const initial = testSetup.captureCharFrame()

    counter.value = 5
    await testSetup.renderOnce()
    const updated = testSetup.captureCharFrame()

    expect(initial).toMatchSnapshot()
    expect(updated).toMatchSnapshot()
    expect(updated).not.toBe(initial)
  })

  it("ignores whitespace-only text nodes between elements", async () => {
    testSetup = await testRender(WhitespaceFixture, { width: 20, height: 8 })
    await testSetup.renderOnce()
    expect(testSetup.captureCharFrame()).toMatchSnapshot()
  })

  it("supports <script setup lang=ts>", async () => {
    testSetup = await testRender(ScriptSetupTsFixture, { width: 20, height: 3 })
    await testSetup.renderOnce()
    expect(testSetup.captureCharFrame()).toMatchSnapshot()
  })

  it("throws on orphan text under non-<text> parent", async () => {
    const App = defineComponent({
      render: () => h("box", "this should throw"),
    })

    await expect(testRender(App, { width: 20, height: 5 })).rejects.toThrow()
  })
})

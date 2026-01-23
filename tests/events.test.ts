import { afterEach, beforeEach, describe, expect, it } from "bun:test"
import { createSpy } from "@opentui/core/testing"
import { defineComponent, h, ref } from "vue"
import { testRender } from "../index"
import { usePaste, useKeyboard } from "../src/elements/hooks"

let testSetup: Awaited<ReturnType<typeof testRender>>

describe("open-vui (events parity)", () => {
  beforeEach(() => {
    if (testSetup) testSetup.renderer.destroy()
  })

  afterEach(() => {
    if (testSetup) testSetup.renderer.destroy()
  })

  it("handles input onInput", async () => {
    const onInputSpy = createSpy()
    const value = ref("")

    const App = defineComponent({
      setup: () => () =>
        h("box", [
          h("input", {
            focused: true,
            onInput: (val: string) => {
              onInputSpy(val)
              value.value = val
            },
          }),
          h("text", `Value: ${value.value}`),
        ]),
    })

    testSetup = await testRender(App, { width: 20, height: 5 })
    await testSetup.mockInput.typeText("hello")

    expect(onInputSpy.callCount()).toBe(5)
    expect(onInputSpy.calls[0]?.[0]).toBe("h")
    expect(onInputSpy.calls[4]?.[0]).toBe("hello")
    expect(value.value).toBe("hello")
  })

  it("handles input onSubmit", async () => {
    const onSubmitSpy = createSpy()
    const submittedValue = ref("")

    const App = defineComponent({
      setup: () => () =>
        h("box", [
          h("input", {
            focused: true,
            onInput: (val: string) => {
              submittedValue.value = val
            },
            onSubmit: (val: string) => {
              onSubmitSpy(val)
            },
          }),
        ]),
    })

    testSetup = await testRender(App, { width: 20, height: 5 })
    await testSetup.mockInput.typeText("test input")
    testSetup.mockInput.pressEnter()

    expect(onSubmitSpy.callCount()).toBe(1)
    expect(onSubmitSpy.calls[0]?.[0]).toBe("test input")
    expect(submittedValue.value).toBe("test input")
  })

  it("handles select onChange", async () => {
    const onChangeSpy = createSpy()
    const selectedIndex = ref(0)

    const options = [
      { name: "Option 1", value: 1, description: "First option" },
      { name: "Option 2", value: 2, description: "Second option" },
      { name: "Option 3", value: 3, description: "Third option" },
    ]

    const App = defineComponent({
      setup: () => () =>
        h("box", [
          h("select", {
            focused: true,
            options,
            onChange: (index: number, option: any) => {
              onChangeSpy(index, option)
              selectedIndex.value = index
            },
          }),
          h("text", `Selected: ${selectedIndex.value}`),
        ]),
    })

    testSetup = await testRender(App, { width: 30, height: 10 })
    testSetup.mockInput.pressArrow("down")

    expect(onChangeSpy.callCount()).toBe(1)
    expect(onChangeSpy.calls[0]?.[0]).toBe(1)
    expect(onChangeSpy.calls[0]?.[1]).toEqual(options[1])
    expect(selectedIndex.value).toBe(1)
  })

  it("handles tab_select onSelect", async () => {
    const onSelectSpy = createSpy()
    const activeTab = ref(0)

    const tabs = [{ title: "Tab 1" }, { title: "Tab 2" }, { title: "Tab 3" }]
    const options = tabs.map((tab, index) => ({ name: tab.title, value: index, description: "" }))

    const App = defineComponent({
      setup: () => () =>
        h("box", [
          h("tab_select", {
            focused: true,
            options,
            onSelect: (index: number) => {
              onSelectSpy(index)
              activeTab.value = index
            },
          }),
          h("text", `Active tab: ${activeTab.value}`),
        ]),
    })

    testSetup = await testRender(App, { width: 40, height: 8 })
    testSetup.mockInput.pressArrow("right")
    testSetup.mockInput.pressArrow("right")
    testSetup.mockInput.pressEnter()

    expect(onSelectSpy.callCount()).toBe(1)
    expect(onSelectSpy.calls[0]?.[0]).toBe(2)
    expect(activeTab.value).toBe(2)
  })

  it("handles usePaste hook", async () => {
    const pasteSpy = createSpy()
    const pastedText = ref("")

    const App = defineComponent({
      setup: () => {
        usePaste((event) => {
          pasteSpy(event.text)
          pastedText.value = event.text
        })

        return () => h("box", [h("text", `Pasted: ${pastedText.value}`)])
      },
    })

    testSetup = await testRender(App, { width: 30, height: 5 })
    await testSetup.mockInput.pasteBracketedText("pasted content")

    expect(pasteSpy.callCount()).toBe(1)
    expect(pasteSpy.calls[0]?.[0]).toBe("pasted content")
    expect(pastedText.value).toBe("pasted content")
  })

  it("honors global preventDefault for keypress", async () => {
    const inputSpy = createSpy()
    const globalHandlerSpy = createSpy()

    const App = defineComponent({
      setup: () => () => h("box", [h("input", { focused: true, onInput: inputSpy })]),
    })

    testSetup = await testRender(App, { width: 20, height: 5 })

    testSetup.renderer.keyInput.on("keypress", (event) => {
      globalHandlerSpy(event.name)
      if (event.name === "a") event.preventDefault()
    })

    await testSetup.mockInput.typeText("abc")

    expect(globalHandlerSpy.callCount()).toBe(3)
    expect(globalHandlerSpy.calls[0]?.[0]).toBe("a")
    expect(globalHandlerSpy.calls[1]?.[0]).toBe("b")
    expect(globalHandlerSpy.calls[2]?.[0]).toBe("c")

    expect(inputSpy.callCount()).toBe(2)
    expect(inputSpy.calls[0]?.[0]).toBe("b")
    expect(inputSpy.calls[1]?.[0]).toBe("bc")
  })

  it("honors preventDefault from useKeyboard hook", async () => {
    const textareaSubmitSpy = createSpy()
    const globalReturnHandlerSpy = createSpy()

    const PreventReturn = defineComponent({
      setup: () => {
        useKeyboard((event) => {
          if (event.name === "return") {
            globalReturnHandlerSpy()
            event.preventDefault()
          }
        })
        return () => null
      },
    })

    const App = defineComponent({
      setup: () => () =>
        h("box", [
          h(PreventReturn),
          h("textarea", {
            focused: true,
            initialValue: "test content",
            onSubmit: () => textareaSubmitSpy(),
          }),
        ]),
    })

    testSetup = await testRender(App, { width: 20, height: 5 })
    testSetup.mockInput.pressEnter()
    await new Promise((r) => setTimeout(r, 10))

    expect(globalReturnHandlerSpy.callCount()).toBe(1)
    expect(textareaSubmitSpy.callCount()).toBe(0)
  })
})

import { createEffect, createSignal, onCleanup, onMount } from "solid-js"
import { EditorState } from "@codemirror/state"
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from "@codemirror/view"
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands"
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching, indentOnInput } from "@codemirror/language"
import { searchKeymap, highlightSelectionMatches } from "@codemirror/search"
import { closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete"
import { javascript } from "@codemirror/lang-javascript"
import { html } from "@codemirror/lang-html"
import { css } from "@codemirror/lang-css"
import { json } from "@codemirror/lang-json"
import { markdown } from "@codemirror/lang-markdown"
import { python } from "@codemirror/lang-python"
import { rust } from "@codemirror/lang-rust"
import { cpp } from "@codemirror/lang-cpp"
import { java } from "@codemirror/lang-java"
import { sql } from "@codemirror/lang-sql"
import { xml } from "@codemirror/lang-xml"
import { yaml } from "@codemirror/lang-yaml"
import { oneDark } from "@codemirror/theme-one-dark"

function lang(path: string) {
  const ext = path.split(".").pop()?.toLowerCase()
  switch (ext) {
    case "js":
    case "mjs":
    case "cjs":
      return javascript()
    case "ts":
    case "mts":
    case "cts":
      return javascript({ typescript: true })
    case "jsx":
      return javascript({ jsx: true })
    case "tsx":
      return javascript({ jsx: true, typescript: true })
    case "html":
    case "htm":
      return html()
    case "css":
    case "scss":
    case "less":
      return css()
    case "json":
    case "jsonc":
      return json()
    case "md":
    case "mdx":
      return markdown()
    case "py":
      return python()
    case "rs":
      return rust()
    case "c":
    case "h":
    case "cpp":
    case "hpp":
    case "cc":
    case "cxx":
      return cpp()
    case "java":
      return java()
    case "sql":
      return sql()
    case "xml":
    case "svg":
      return xml()
    case "yaml":
    case "yml":
      return yaml()
    default:
      return undefined
  }
}

type Props = {
  content: string
  path: string
  dark?: boolean
  onChange?: (content: string) => void
  onSave?: (content: string) => void
  class?: string
}

export function Editor(props: Props) {
  let container!: HTMLDivElement
  let view: EditorView | undefined

  const [dirty, setDirty] = createSignal(false)

  onMount(() => {
    const ext = lang(props.path)

    const extensions = [
      lineNumbers(),
      highlightActiveLine(),
      highlightActiveLineGutter(),
      history(),
      bracketMatching(),
      closeBrackets(),
      indentOnInput(),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      highlightSelectionMatches(),
      keymap.of([
        ...defaultKeymap,
        ...historyKeymap,
        ...searchKeymap,
        ...closeBracketsKeymap,
        indentWithTab,
        {
          key: "Mod-s",
          run: (v) => {
            props.onSave?.(v.state.doc.toString())
            return true
          },
        },
      ]),
      EditorView.updateListener.of((update) => {
        if (!update.docChanged) return
        const content = update.state.doc.toString()
        setDirty(content !== props.content)
        props.onChange?.(content)
      }),
      EditorView.theme({
        "&": {
          height: "100%",
          fontSize: "13px",
        },
        ".cm-scroller": {
          fontFamily: "var(--font-mono, 'JetBrains Mono', 'Fira Code', monospace)",
        },
        ".cm-gutters": {
          borderRight: "1px solid var(--color-border, #333)",
        },
      }),
    ]

    if (ext) extensions.push(ext)
    if (props.dark !== false) extensions.push(oneDark)

    const state = EditorState.create({
      doc: props.content,
      extensions,
    })

    view = new EditorView({
      state,
      parent: container,
    })
  })

  createEffect(() => {
    const next = props.content
    if (!view) return
    const current = view.state.doc.toString()
    if (current === next) return
    if (dirty()) return
    view.dispatch({
      changes: {
        from: 0,
        to: view.state.doc.length,
        insert: next,
      },
    })
  })

  onCleanup(() => {
    view?.destroy()
    view = undefined
  })

  return <div ref={container} class={props.class ?? "h-full w-full"} />
}

import React, { useRef, useEffect } from 'react'
import TurndownService from 'turndown'
import { marked } from 'marked'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Typography from '@tiptap/extension-typography'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import CodeBlock from '@tiptap/extension-code-block'
import Heading from '@tiptap/extension-heading'

import './styles.css'

const turndownService = new TurndownService({
    headingStyle: 'atx',
    hr: '---',
    codeBlockStyle: 'fenced',
})

export interface MemexEditorInstance {
    resetState: () => void
}

interface Props {
    markdownContent: string
    placeholder?: string
    onKeyDown?: React.KeyboardEventHandler
    onContentUpdate: (markdownContent: string) => void
    setEditorInstanceRef?: (instance: MemexEditorInstance) => void
}

const MemexEditor = (props: Props) => {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                codeBlock: false,
                heading: false,
            }),
            Typography,
            CodeBlock.configure({
                HTMLAttributes: {
                    class: 'CodeBlock',
                },
            }),
            Heading.configure({
                levels: [1, 2, 3],
            }),
            Link.configure({
                linkOnPaste: true,
            }),
            Placeholder.configure({
                placeholder: props.placeholder,
                emptyEditorClass: 'is-editor-empty',
            }),
        ],
        content: marked.parse(props.markdownContent),
        onCreate: ({ editor }) => editor.commands.focus('end'),
        onUpdate: ({ editor }) => {
            const htmlContent = editor.getHTML()
            const markdownContent = turndownService.turndown(htmlContent)
            props.onContentUpdate(markdownContent)
        },
        autofocus: true,
        editorProps: props.onKeyDown
            ? {
                  handleDOMEvents: {
                      keydown: (view, event) => {
                          props.onKeyDown(event as any)
                          return true
                      },
                  },
              }
            : undefined,
    })
    const memexEditorRef = useRef<MemexEditorInstance>()

    useEffect(() => {
        memexEditorRef.current = {
            resetState: () => {
                editor.commands.clearContent()
            },
        }

        props.setEditorInstanceRef?.(memexEditorRef.current)
    }, [editor])

    return <EditorContent className="ProseMirrorContainer" editor={editor} />
}

export default MemexEditor

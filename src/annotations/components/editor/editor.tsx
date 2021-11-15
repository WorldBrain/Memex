import React, { useRef, useEffect } from 'react'
import TurndownService from 'turndown'
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
    comment?: string
    placeholder?: string
    clearField?: boolean
    onKeyDown: React.KeyboardEventHandler
    updatedContent: (content: string) => void
    editorInstanceRef: (instance: MemexEditorInstance) => void
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
        content: props.comment,
        onCreate: ({ editor }) => editor.commands.focus('end'),
        onUpdate: ({ editor }) => {
            const htmlContent = editor.getHTML()
            const markdownContent = turndownService.turndown(htmlContent)
            props.updatedContent(markdownContent)
        },
        autofocus: true,
        editorProps: {
            handleDOMEvents: {
                keydown: (view, event) => {
                    props.onKeyDown(event as any)
                    return true
                },
            },
        },
    })
    const memexEditorRef = useRef<MemexEditorInstance>()

    useEffect(() => {
        memexEditorRef.current = {
            resetState: () => {
                editor.commands.clearContent()
            },
        }

        props.editorInstanceRef(memexEditorRef.current)
    })

    return <EditorContent className="ProseMirrorContainer" editor={editor} />
}

export default MemexEditor

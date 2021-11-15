import React from 'react'
import TurndownService from 'turndown'
import { useEditor, EditorContent, Editor } from '@tiptap/react'
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

interface Props {
    comment?: string
    placeholder?: string
    clearField?: boolean
    onKeyDown: React.KeyboardEventHandler
    updatedContent: (content: string) => void
    editorInstanceRef: (instance: Editor) => void
}

const MemexEditor = (props: Props) => {
    const editor = useEditor({
        extensions: [
            StarterKit,
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

    props.editorInstanceRef(editor)

    // TODO: clear the content when the note is saved
    //editor.commands.clearContent()

    return <EditorContent className={'ProseMirrorContainer'} editor={editor} />
}

export default MemexEditor

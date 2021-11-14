import React from 'react'
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Typography from '@tiptap/extension-typography'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import CodeBlock from '@tiptap/extension-code-block'

import './styles.css'

interface Props {
    updatedContent: (content) => void
    onKeyDown: (event) => void
    comment?: string
    placeholder?: string
    clearField?: boolean
    editorInstanceRef: () => void
}

export default (props, styles) => {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Typography,
            CodeBlock.configure({
                HTMLAttributes: {
                    class: 'CodeBlock',
                },
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
            const content = editor.getHTML()
            props.updatedContent(content)
        },
        autofocus: true,
        editorProps: {
            handleDOMEvents: {
                keydown: (view, event) => {
                    return props.onKeyDown(event)
                },
            },
        },
    })

    props.editorInstanceRef(editor)

    // TODO: clear the content when the note is saved
    //editor.commands.clearContent()

    return (
        <>
            <EditorContent className={'ProseMirrorContainer'} editor={editor} />
        </>
    )
}

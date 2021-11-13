import React from 'react'
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Highlight from '@tiptap/extension-highlight'
import Typography from '@tiptap/extension-typography'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import './styles.css'
import styled from 'styled-components'

interface Props {
    updatedContent: (content) => void
    onKeyDown: (event) => void
    comment?: string
    placeholder?: string
    clearField?: boolean
}

export default (props) => {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Highlight,
            Typography,
            Link.configure({
                linkOnPaste: true,
            }),
            Placeholder.configure({
                placeholder: props.placeholder,
                emptyEditorClass: 'is-editor-empty',
            }),
        ],
        content: props.comment,
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
            attributes: {
                class:
                    'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none',
            },
        },
    })

    // TODO: clear the content when the note is saved
    //editor.commands.clearContent()

    return (
        <>
            <EditorContent editor={editor} />
        </>
    )
}

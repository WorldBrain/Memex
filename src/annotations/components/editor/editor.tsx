import React, { useRef, useEffect } from 'react'
import TurndownService from 'turndown'
import { marked } from 'marked'
import {
    useEditor,
    EditorContent,
    BubbleMenu,
    FloatingMenu,
} from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Typography from '@tiptap/extension-typography'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import CodeBlock from '@tiptap/extension-code-block'
import Heading from '@tiptap/extension-heading'
import Image from '@tiptap/extension-image'

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
    toggleMarkdownHelp?: () => void
}

const MemexEditor = (props: Props) => {
    const renderer = {
        image(url) {
            return `
                <img id={'Test'} src="${url}" alt={'test'}/>
                `
        },
    }

    marked.use({ renderer })

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
            Image.configure({
                inline: true,
            }),
        ],
        content: marked.parse(props.markdownContent),
        onCreate: ({ editor }) => {
            editor.commands.focus('end')
        },
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
                          // NOTE: this seems to be typed incorrectly
                          //  removing the 'as any's will throw errors at you,
                          //  but fixing them result in editor KB shortcuts stop working
                          return props.onKeyDown(event as any) as any
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

    return (
        <>
            <EditorContent className="ProseMirrorContainer" editor={editor}>
                {editor && (
                    <BubbleMenu
                        className="bubble-menu"
                        tippyOptions={{ duration: 100 }}
                        editor={editor}
                    >
                        <button
                            onClick={() =>
                                editor.chain().focus().toggleBold().run()
                            }
                            className={
                                editor.isActive('bold') ? 'is-active' : ''
                            }
                        >
                            Bold
                        </button>
                        <button
                            onClick={() =>
                                editor.chain().focus().toggleItalic().run()
                            }
                            className={
                                editor.isActive('italic') ? 'is-active' : ''
                            }
                        >
                            Italic
                        </button>
                        <button
                            onClick={() =>
                                editor.chain().focus().toggleBulletList().run()
                            }
                            className={
                                editor.isActive('bulletList') ? 'is-active' : ''
                            }
                        >
                            Bullet
                        </button>
                        <button onClick={() => props.toggleMarkdownHelp()}>
                            More
                        </button>
                    </BubbleMenu>
                )}
            </EditorContent>
        </>
    )
}

export default MemexEditor

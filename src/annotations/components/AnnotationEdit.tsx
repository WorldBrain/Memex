import * as React from 'react'
import styled from 'styled-components'

import { getKeyName } from '@worldbrain/memex-common/lib/utils/os-specific-key-names'
import MemexEditor, {
    MemexEditorInstance,
} from '@worldbrain/memex-common/lib/editor'

interface State {
    editorHeight: string
}

export interface AnnotationEditEventProps {
    onEditConfirm: (
        showExternalConfirmations?: boolean,
    ) => (
        shouldShare: boolean,
        isProtected: boolean,
        opts?: {
            mainBtnPressed?: boolean
            keepListsIfUnsharing?: boolean
        },
    ) => void
    onEditCancel: () => void
    onCommentChange: (comment: string) => void
}

export interface AnnotationEditGeneralProps {
    comment: string
    editorHeight?: string
    isShared?: boolean
    isBulkShareProtected?: boolean
}

export interface Props
    extends AnnotationEditEventProps,
        AnnotationEditGeneralProps {
    rows: number
}

class AnnotationEdit extends React.Component<Props> {
    static MOD_KEY = getKeyName({ key: 'mod' })

    state: State = {
        editorHeight: '50px',
    }

    private editorRef: MemexEditorInstance

    focusEditor() {
        this.editorRef?.focus()
    }

    private saveEdit(shouldShare, isProtected) {
        this.props.onEditConfirm(true)(shouldShare, isProtected)
        //AnnotationEditable.removeMarkdownHelp()
    }

    private handleInputKeyDown: React.KeyboardEventHandler = (e) => {
        e.stopPropagation()

        if (navigator.platform === 'MacIntel') {
            if (e.key === 'Enter' && e.shiftKey && e.metaKey) {
                return this.saveEdit(true, false)
            }

            if (e.key === 'Enter' && e.shiftKey && e.altKey) {
                return this.saveEdit(true, true)
            }

            if (e.key === 'Enter' && e.altKey) {
                return this.saveEdit(false, true)
            }

            if (e.key === 'Enter' && e.metaKey) {
                return this.props.onEditConfirm(false)(
                    this.props.isShared,
                    this.props.isBulkShareProtected,
                    { mainBtnPressed: true },
                )
            }
        } else {
            if (e.key === 'Enter' && e.shiftKey && e.ctrlKey) {
                return this.saveEdit(true, false)
            }

            if (e.key === 'Enter' && e.shiftKey && e.altKey) {
                return this.saveEdit(true, true)
            }

            if (e.key === 'Enter' && e.altKey) {
                return this.saveEdit(false, true)
            }

            if (e.key === 'Enter' && e.ctrlKey) {
                return this.saveEdit(false, false)
            }
        }

        if (e.key === 'Escape') {
            this.props.onEditCancel()
            return
        }
    }

    render() {
        return (
            <EditorContainer editorHeight={this.props.editorHeight}>
                <MemexEditor
                    onContentUpdate={(content) =>
                        this.props.onCommentChange(content)
                    }
                    markdownContent={this.props.comment}
                    onKeyDown={this.handleInputKeyDown}
                    placeholder={`Add Note. Click on ( ? ) for formatting help.`}
                    setEditorInstanceRef={(ref) => (this.editorRef = ref)}
                    autoFocus
                />
            </EditorContainer>
        )
    }
}

export default AnnotationEdit

const EditorContainer = styled.div`
    height: fit-content;
    transition: height 0.4s linear;
    border-top: 1px solid #f0f0f0;

    &:first-child {
        border-top: none;
    }
`

const StyledTextArea = styled.textarea`
    background-color: #fff;
    box-sizing: border-box;
    resize: vertical;
    font-weight: 400;
    font-size: 14px;
    color: #222;
    font-family: ${(props) => props.theme.fonts.primary};
    border-radius: 3px;
    border: none;
    padding: 10px 7px;

    &::placeholder {
        color: ${(props) => props.theme.colors.primary};
        opacity: 0.5;
    }

    &:focus {
        outline: none;
        box-shadow: none;
        border: none;
    }

    min-height: 300px;
`

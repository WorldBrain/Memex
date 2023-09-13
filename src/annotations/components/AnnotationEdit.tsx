import * as React from 'react'
import styled from 'styled-components'

import { getKeyName } from '@worldbrain/memex-common/lib/utils/os-specific-key-names'
import MemexEditor, {
    MemexEditorInstance,
} from '@worldbrain/memex-common/lib/editor'
import { getKeyboardShortcutsState } from 'src/in-page-ui/keyboard-shortcuts/content_script/detection'
import { YoutubePlayer } from '@worldbrain/memex-common/lib/services/youtube/types'
import { ImageSupportInterface } from 'src/image-support/background/types'

interface State {
    editorHeight: string
    youtubeShortcut: string | null
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
    onListsBarPickerBtnClick: React.MouseEventHandler
    imageSupport: ImageSupportInterface<'caller'>
}

export interface AnnotationEditGeneralProps {
    comment: string
    editorHeight?: string
    isShared?: boolean
    isBulkShareProtected?: boolean
    getYoutubePlayer?(): YoutubePlayer
    contextLocation?: string
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
        youtubeShortcut: null,
    }

    async componentDidMount() {
        await this.youtubeKeyboardShortcut()
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

            // if (e.key === 'Enter' && e.altKey) {
            //     return this.saveEdit(false, true)
            // }

            if (e.key === 'Enter' && e.ctrlKey) {
                return this.saveEdit(false, false)
            }
        }

        if (e.key === 'Escape') {
            this.props.onEditCancel()
            return
        }
    }

    private youtubeKeyboardShortcut = async () => {
        const shortcuts = await getKeyboardShortcutsState()
        const youtubeShortcut = shortcuts.createAnnotation.shortcut
        this.setState({ youtubeShortcut })
    }

    render() {
        return (
            <EditorContainer editorHeight={this.props.editorHeight}>
                <MemexEditor
                    getYoutubePlayer={this.props.getYoutubePlayer}
                    onContentUpdate={(content) =>
                        this.props.onCommentChange(content)
                    }
                    markdownContent={this.props.comment}
                    onKeyDown={this.handleInputKeyDown}
                    placeholder={`Add Note. Click on ( ? ) for formatting help.`}
                    setEditorInstanceRef={(ref) => (this.editorRef = ref)}
                    autoFocus
                    youtubeShortcut={this.state.youtubeShortcut}
                    imageSupport={this.props.imageSupport}
                />
            </EditorContainer>
        )
    }
}

export default AnnotationEdit

const EditorContainer = styled.div`
    height: fit-content;
    padding: 0 10px;
    // transition: height 1s ease-in-out;
    // border-top: 1px solid ${(props) => props.theme.colors.greyScale3};

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

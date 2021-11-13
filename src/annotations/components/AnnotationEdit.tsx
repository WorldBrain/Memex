import * as React from 'react'
import styled from 'styled-components'

import { MarkdownPreviewAnnotationInsertMenu } from 'src/markdown-preview/markdown-preview-insert-menu'
import { FocusableComponent } from './types'
import { uninsertTab, insertTab } from 'src/common-ui/utils'
import { getKeyName } from 'src/util/os-specific-key-names'
import TipTap from './editor/editor'
const { marked } = require('marked')

interface State {
    contentToSave: string
}

var TurndownService = require('turndown')

var turndownService = new TurndownService()

export interface AnnotationEditEventProps {
    onEditConfirm: (shouldShare: boolean, isProtected?: boolean) => void
    onEditCancel: () => void
    onCommentChange: (comment: string) => void
}

export interface AnnotationEditGeneralProps {
    comment: string
}

export interface Props
    extends AnnotationEditEventProps,
        AnnotationEditGeneralProps {
    url: string
    rows: number
}

class AnnotationEdit extends React.Component<Props> {
    static MOD_KEY = getKeyName({ key: 'mod' })

    state: State = {
        contentToSave: '',
    }

    private handleInputKeyDown: React.KeyboardEventHandler = (e) => {
        e.stopPropagation()

        if (e.key === 'Enter' && e.shiftKey && e.metaKey) {
            return this.props.onEditConfirm(true, false)
        }

        if (e.key === 'Enter' && e.shiftKey && e.altKey) {
            return this.props.onEditConfirm(true, true)
        }

        if (e.key === 'Enter' && e.altKey) {
            return this.props.onEditConfirm(false, true)
        }

        if (e.key === 'Enter' && e.metaKey) {
            return this.props.onEditConfirm(false, false)
        }

        if (e.key === 'Escape') {
            this.props.onEditCancel()
            return
        }
    }

    private printContent(content) {
        var content = turndownService.turndown(content)
        this.setState({ contentToSave: content })
        this.props.onCommentChange(this.state.contentToSave)
    }

    private parseMD2HTML() {
        const html = marked.parse(this.props.comment)
        // TODO const sanitisedHTML =
        return html
    }

    render() {
        return (
            <>
                <TipTap
                    updatedContent={(content) => this.printContent(content)}
                    onKeyDown={(e) => this.handleInputKeyDown(e)}
                    comment={this.parseMD2HTML()}
                />
            </>
        )
    }
}

export default AnnotationEdit

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

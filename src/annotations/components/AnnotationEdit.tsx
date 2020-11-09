import * as React from 'react'
import styled from 'styled-components'

import { PickerUpdateHandler } from 'src/common-ui/GenericPicker/types'
import { GenericPickerDependenciesMinusSave } from 'src/common-ui/GenericPicker/logic'
import TagInput from 'src/tags/ui/tag-input'
import { MarkdownPreview } from 'src/common-ui/components/markdown-preview'
import { FocusableComponent } from './types'
import {
    uninsertTab,
    insertTab,
    insertIndentedNewLine,
} from 'src/common-ui/utils'

export interface AnnotationEditEventProps {
    onEditConfirm: (url: string) => void
    onEditCancel: () => void
    onCommentChange: (comment: string) => void
    setTagInputActive: (active: boolean) => void
    updateTags: PickerUpdateHandler
    deleteSingleTag: (tag: string) => void
}

export interface AnnotationEditGeneralProps {
    isTagInputActive: boolean
    comment: string
    tags: string[]
}

export interface Props
    extends AnnotationEditEventProps,
        AnnotationEditGeneralProps {
    tagPickerDependencies: GenericPickerDependenciesMinusSave
    url: string
    rows: number
}

class AnnotationEdit extends React.Component<Props>
    implements FocusableComponent {
    private textAreaRef = React.createRef<HTMLTextAreaElement>()

    componentDidMount() {
        this.focusOnInputEnd()
    }

    focus() {
        this.textAreaRef.current.focus()
    }

    focusOnInputEnd() {
        const inputLen = this.props.comment.length
        this.textAreaRef.current.setSelectionRange(inputLen, inputLen)
        this.focus()
    }

    private handleTagInputKeyDown: React.KeyboardEventHandler = (e) => {
        // Only check for `Tab` and `Shift + Tab`, handle rest of the events normally.
        if (e.key === 'Tab') {
            this.props.setTagInputActive(false)
        }
    }

    private handleInputKeyDown: React.KeyboardEventHandler = (e) => {
        e.stopPropagation()

        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            this.props.onEditConfirm(this.props.url)
            return
        }

        if (e.key === 'Escape') {
            this.props.onEditCancel()
            return
        }

        if (e.key === 'Tab' && !e.shiftKey) {
            e.preventDefault()
            insertTab({ el: this.textAreaRef.current })
        }

        if (e.key === 'Tab' && e.shiftKey) {
            e.preventDefault()
            uninsertTab({ el: this.textAreaRef.current })
        }
    }

    render() {
        const {
            loadDefaultSuggestions,
            queryEntries,
        } = this.props.tagPickerDependencies

        return (
            <>
                <MarkdownPreview
                    showPreviewBtnOnEmptyInput
                    customRef={this.textAreaRef}
                    onKeyDown={this.handleInputKeyDown}
                    value={this.props.comment}
                    renderInput={(inputProps) => (
                        <StyledTextArea
                            {...inputProps}
                            value={this.props.comment}
                            onClick={() => this.props.setTagInputActive(false)}
                            placeholder="Add private note (save with cmd/ctrl+enter)"
                            onChange={(e) =>
                                this.props.onCommentChange(e.target.value)
                            }
                        />
                    )}
                />
                <TagInput
                    deleteTag={this.props.deleteSingleTag}
                    queryTagSuggestions={queryEntries}
                    fetchInitialTagSuggestions={loadDefaultSuggestions}
                    onKeyDown={this.handleTagInputKeyDown}
                    {...this.props}
                />
            </>
        )
    }
}

export default AnnotationEdit

const StyledTextArea = styled.textarea`
    background-color: #f7f7f7;
    box-sizing: border-box;
    resize: vertical;
    font-weight: 400;
    font-size: 14px;
    color: #222;
    font-family: 'Poppins', sans-serif;
    border-radius: 3px;
    border: none;
    padding: 10px 7px;

    &::placeholder {
        color: #3a2f45;
    }

    &:focus {
        outline: none;
        box-shadow: none;
        border: none;
    }

    min-height: 300px;
`

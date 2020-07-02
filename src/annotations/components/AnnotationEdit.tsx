import * as React from 'react'
import styled from 'styled-components'

import AnnotationFooter from './AnnotationFooter'
import TextInputControlled from 'src/common-ui/components/TextInputControlled'
import { PickerUpdateHandler } from 'src/common-ui/GenericPicker/types'
import TagInput from 'src/tags/ui/tag-input'

export interface TagsEventProps {
    fetchInitialTagSuggestions: () => Promise<string[]>
    queryTagSuggestions: (query: string) => Promise<string[]>
}

export interface AnnotationEditEventProps {
    handleCancelEdit: () => void
    handleConfirmEdit: (args: { comment: string; tags: string[] }) => void
}

export interface Props extends TagsEventProps, AnnotationEditEventProps {
    comment?: string
    rows: number
    tags: string[]
}

interface State {
    isTagInputActive: boolean
    commentEditText: string
    tags: string[]
}

class AnnotationEdit extends React.Component<Props, State> {
    state: State = {
        isTagInputActive: false,
        commentEditText: this.props.comment ?? '',
        tags: this.props.tags ?? [],
    }

    private handleSaveAnnotation = () => {
        this.props.handleConfirmEdit({
            comment: this.state.commentEditText,
            tags: this.state.tags,
        })
    }

    private handleTagInputKeydown: React.KeyboardEventHandler = (e) => {
        // Only check for `Tab` and `Shift + Tab`, handle rest of the events normally.
        if (e.key === 'Tab') {
            this.setTagInputActive(false)
        }
    }

    private setTagInputActive = (isTagInputActive: boolean) =>
        this.setState({ isTagInputActive })

    private handleCommentChange = (commentEditText: string) =>
        this.setState({ commentEditText })

    private onEnterSaveHandler = {
        test: (e) => (e.ctrlKey || e.metaKey) && e.key === 'Enter',
        handle: (e) => this.handleSaveAnnotation(),
    }

    private addTag = (tag: string) =>
        this.setState((state) => {
            const index = state.tags.indexOf(tag)

            if (index !== -1) {
                return
            }

            return { tags: [...state.tags, tag] }
        })

    private deleteTag = (tag: string) =>
        this.setState((state) => {
            const index = state.tags.indexOf(tag)
            return {
                tags: [
                    ...state.tags.slice(0, index),
                    ...state.tags.slice(index + 1),
                ],
            }
        })

    private updateTags: PickerUpdateHandler = async (args) => {
        if (args.added) {
            return this.addTag(args.added)
        }

        if (args.deleted) {
            return this.deleteTag(args.deleted)
        }
    }

    private renderInput() {
        const { commentEditText } = this.state

        return (
            <TextInputControlledStyled
                defaultValue={commentEditText}
                onClick={() => this.setTagInputActive(false)}
                placeholder="Add a private note... (save with cmd/ctrl+enter)"
                onChange={this.handleCommentChange}
                specialHandlers={[this.onEnterSaveHandler]}
            />
        )
    }

    private renderTagInput() {
        const { queryTagSuggestions, fetchInitialTagSuggestions } = this.props
        const { tags, isTagInputActive } = this.state

        return (
            <TagInput
                tags={tags}
                deleteTag={this.deleteTag}
                updateTags={this.updateTags}
                setTagInputActive={this.setTagInputActive}
                isTagInputActive={isTagInputActive}
                queryTagSuggestions={queryTagSuggestions}
                fetchInitialTagSuggestions={fetchInitialTagSuggestions}
                onKeyDown={this.handleTagInputKeydown}
            />
        )
    }

    private renderFooter() {
        return (
            <AnnotationFooter
                mode="edit"
                handleCancelEdit={this.props.handleCancelEdit}
                handleEditAnnotation={this.handleSaveAnnotation}
            />
        )
    }

    render() {
        return (
            <>
                {this.renderInput()}
                {this.renderTagInput()}
                {this.renderFooter()}
            </>
        )
    }
}

export default AnnotationEdit

const TextInputControlledStyled = styled(TextInputControlled)`
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
    margin: 5px 5px 5px 5px;

    &::placeholder {
        color: #3a2f45;
    }

    &:focus {
        outline: none;
        box-shadow: none;
        border: none;
    }

    min-height: 100px;
`

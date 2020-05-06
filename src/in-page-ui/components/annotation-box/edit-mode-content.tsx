import * as React from 'react'

import TagInput from '../../sidebar/react/components/tag-input'
import AllModesFooter from './all-modes-footer'
// import * as constants from '../comment-box/constants'
import TextInputControlled from 'src/common-ui/components/TextInputControlled'
import { PickerUpdateHandler } from 'src/common-ui/GenericPicker/types'

const styles = require('./edit-mode-content.css')

export interface TagsEventProps {
    fetchInitialTagSuggestions: () => Promise<string[]>
    queryTagSuggestions: (query: string) => Promise<string[]>
}

interface Props extends TagsEventProps {
    comment?: string
    rows: number
    tags: string[]
    handleCancelOperation: () => void
    handleEditAnnotation: (commentText: string, tagsInput: string[]) => void
}

interface State {
    isTagInputActive: boolean
    commentEditText: string
    tags: string[]
}

class EditModeContent extends React.Component<Props, State> {
    state: State = {
        isTagInputActive: false,
        commentEditText: this.props.comment ?? '',
        tags: this.props.tags ?? [],
    }

    private _handleEditAnnotation = () => {
        this.props.handleEditAnnotation(
            this.state.commentEditText,
            this.state.tags,
        )
    }

    private _handleTagInputKeydown = (
        e: React.KeyboardEvent<HTMLDivElement>,
    ) => {
        // Only check for `Tab` and `Shift + Tab`, handle rest of the events normally.
        if (e.key === 'Tab') {
            this._setTagInputActive(false)
        }
    }

    private _setTagInputActive = (isTagInputActive: boolean) => {
        this.setState({ isTagInputActive })
    }

    private onEnterSaveHandler = {
        test: (e) => (e.ctrlKey || e.metaKey) && e.key === 'Enter',
        handle: (e) => this._handleCommentChange,
    }

    private _handleCommentChange = (comment: string) =>
        this.setState((state) => ({ commentEditText: comment }))

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

    render() {
        return (
            <React.Fragment>
                <TextInputControlled
                    defaultValue={this.state.commentEditText}
                    onClick={() => this._setTagInputActive(false)}
                    className={styles.textArea}
                    placeholder="Add a private note... (save with cmd/ctrl+enter)"
                    onChange={this._handleCommentChange}
                    specialHandlers={[this.onEnterSaveHandler]}
                />

                <div onKeyDown={this._handleTagInputKeydown}>
                    <TagInput
                        tags={this.state.tags}
                        deleteTag={this.deleteTag}
                        updateTags={this.updateTags}
                        setTagInputActive={this._setTagInputActive}
                        isTagInputActive={this.state.isTagInputActive}
                        queryTagSuggestions={this.props.queryTagSuggestions}
                        fetchInitialTagSuggestions={
                            this.props.fetchInitialTagSuggestions
                        }
                    />
                </div>

                <AllModesFooter
                    mode="edit"
                    handleCancelEdit={this.props.handleCancelOperation}
                    handleEditAnnotation={this._handleEditAnnotation}
                />
            </React.Fragment>
        )
    }
}

export default EditModeContent

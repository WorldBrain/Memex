import * as React from 'react'

import TagInput from '../../sidebar/react/components/tag-input'
import AllModesFooter from './all-modes-footer'
// import * as constants from '../comment-box/constants'
import { getLocalStorage } from 'src/util/storage'
import { TAG_SUGGESTIONS_KEY } from 'src/constants'
import TextInputControlled from 'src/common-ui/components/TextInputControlled'

const styles = require('./edit-mode-content.css')

interface Props {
    env?: 'inpage' | 'overview'
    comment?: string
    tags: string[]
    commentText: string
    tagsInput: string[]
    rows: number
    tagSuggestions: string[]
    handleCancelOperation: () => void
    handleEditAnnotation: (commentText: string, tagsInput: string[]) => void
    onAddTag: (tag: string) => void
    onDeleteTag: (tag: string) => void
}

interface State {
    isTagInputActive: boolean
}

class EditModeContent extends React.Component<Props, State> {
    private _handleEditAnnotation = () => {
        const { commentText, tagsInput } = this.props
        this.props.handleEditAnnotation(commentText, tagsInput)
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
        test: e => (e.ctrlKey || e.metaKey) && e.key === 'Enter',
        handle: e => this._handleCommentChange,
    }

    private _handleCommentChange = commentText => {
        this.props.handleEditAnnotation(commentText, this.props.tagsInput)
    }

    render() {
        return (
            <React.Fragment>
                <TextInputControlled
                    defaultValue={this.props.commentText}
                    onClick={() => this._setTagInputActive(false)}
                    className={styles.textArea}
                    placeholder="Add a private note... (save with cmd/ctrl+enter)"
                    onChange={this._handleCommentChange}
                    specialHandlers={[this.onEnterSaveHandler]}
                />

                <div onKeyDown={this._handleTagInputKeydown}>
                    <TagInput
                        env={this.props.env}
                        tags={this.props.tagsInput}
                        initTagSuggestions={[
                            ...new Set([
                                ...this.props.tagsInput,
                                ...this.props.tagSuggestions,
                            ]),
                        ]}
                        isTagInputActive={this.state.isTagInputActive}
                        setTagInputActive={this._setTagInputActive}
                        addTag={this.props.onAddTag}
                        deleteTag={this.props.onDeleteTag}
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

import * as React from 'react'

import TagInput from '../tag-input'
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
    isTagInputActive: boolean
    tagSuggestions: string[]
    handleCancelOperation: () => void
    handleEditAnnotation: (commentText: string, tagsInput: string[]) => void
    onAddTag: (tag: string) => void
    onDeleteTag: (tag: string) => void
}

class EditModeContent extends React.PureComponent<Props> {
    async componentDidMount() {
        const tagSuggestions = await getLocalStorage(TAG_SUGGESTIONS_KEY, [])
        this.setState({ tagSuggestions: tagSuggestions.reverse() })
    }

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

    // private _addTag = (tag: string) => {
    //     this.setState(prevState => ({
    //         tagsInput: [tag, ...prevState.tagsInput],
    //     }))
    // }

    // private _deleteTag = (tag: string) => {
    //     const tagIndex = this.state.tagsInput.indexOf(tag)
    //     if (tagIndex !== -1) {
    //         this.setState(prevState => ({
    //             tagsInput: [
    //                 ...prevState.tagsInput.slice(0, tagIndex),
    //                 ...prevState.tagsInput.slice(tagIndex + 1),
    //             ],
    //         }))
    //     }
    // }

    private onEnterSaveHandler = {
        test: e => (e.ctrlKey || e.metaKey) && e.key === 'Enter',
        handle: e =>
            this.props.handleEditAnnotation(
                this.props.commentText,
                this.props.tagsInput,
            ),
    }

    private _handleCommentChange = commentText => {
        this.setState({ commentText })
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
                        isTagInputActive={this.props.isTagInputActive}
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

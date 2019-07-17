import * as React from 'react'
import { ClickHandler } from '../../types'
import TagsContainer from './tag-input-container'
import { Tooltip } from 'src/common-ui/components'
import { getLocalStorage } from 'src/util/storage'
import { TAG_SUGGESTIONS_KEY } from 'src/constants'
import cx from 'classnames'
import TextInputControlled from 'src/common-ui/components/TextInputControlled'

const styles = require('./comment-box-form.css')

interface Props {
    env?: 'inpage' | 'overview'
    commentText: string
    isCommentBookmarked: boolean
    handleCommentTextChange: (comment: string) => void
    saveComment: React.EventHandler<React.SyntheticEvent>
    cancelComment: ClickHandler<HTMLButtonElement>
    toggleBookmark: ClickHandler<HTMLButtonElement>
    isAnnotation: boolean
}

interface State {
    isTagInputActive: boolean
    showTagsPicker: boolean
    tagSuggestions: string[]
}

class CommentBoxForm extends React.Component<Props, State> {
    /** Ref of the tag button element to focus on it when tabbing. */
    private tagBtnRef: HTMLElement
    private saveBtnRef: HTMLButtonElement
    private cancelBtnRef: HTMLButtonElement
    private bmBtnRef: HTMLButtonElement

    state: State = {
        isTagInputActive: false,
        showTagsPicker: false,
        tagSuggestions: [],
    }

    async componentDidMount() {
        this.attachEventListeners()
        const tagSuggestions = await getLocalStorage(TAG_SUGGESTIONS_KEY, [])
        this.setState({ tagSuggestions: tagSuggestions.reverse() })
    }

    componentWillUnmount() {
        this.removeEventListeners()
    }

    private attachEventListeners() {
        this.saveBtnRef.addEventListener('click', e => this.saveComment(e))
        this.cancelBtnRef.addEventListener('click', this.handleCancelBtnClick)
        this.bmBtnRef.addEventListener('click', this.handleBookmarkBtnClick)
        this.tagBtnRef.addEventListener('click', this.handleTagBtnClick)
    }

    private removeEventListeners() {
        this.saveBtnRef.removeEventListener('click', e => this.saveComment(e))
        this.cancelBtnRef.removeEventListener(
            'click',
            this.handleCancelBtnClick,
        )
        this.bmBtnRef.removeEventListener('click', this.handleBookmarkBtnClick)
        this.tagBtnRef.removeEventListener('click', this.handleTagBtnClick)
    }

    private setTagButtonRef = (ref: HTMLElement) => {
        this.tagBtnRef = ref
    }

    private handleTagBtnKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
        if (e.key === 'Tab') {
            this.setState({
                showTagsPicker: false,
            })
            this.tagBtnRef.focus()
        }
    }

    private handleTagBtnClick = e => {
        e.preventDefault()
        e.stopPropagation()
        this.setState(prevState => ({
            showTagsPicker: !prevState.showTagsPicker,
        }))
    }

    private handleCancelBtnClick = e => {
        e.preventDefault()
        e.stopPropagation()
        this.props.cancelComment(e)
    }

    private handleBookmarkBtnClick = e => {
        e.preventDefault()
        e.stopPropagation()
        this.props.toggleBookmark(e)
    }

    private saveComment = e => {
        this.props.saveComment(e)
        if (this.state.showTagsPicker) {
            this.setState({
                showTagsPicker: false,
            })
        }
    }

    setTagInputActive = (isTagInputActive: boolean) => {
        this.setState({ isTagInputActive })
    }

    renderTagsTooltip() {
        if (!this.state.showTagsPicker) {
            return null
        }

        return (
            <Tooltip position="bottomLeft">
                <TagsContainer
                    env={this.props.env}
                    tagSuggestions={this.state.tagSuggestions}
                />
            </Tooltip>
        )
    }

    onEnterSaveHandler = {
        test: e => (e.ctrlKey || e.metaKey) && e.key === 'Enter',
        handle: e => this.saveComment(e),
    }

    render() {
        const { commentText, cancelComment } = this.props

        return (
            <React.Fragment>
                <TextInputControlled
                    defaultValue={commentText}
                    onClick={() => {
                        this.setTagInputActive(false)
                        this.setState(state => ({ showTagsPicker: false }))
                    }}
                    className={styles.textArea}
                    placeholder="Add a private note... (save with cmd/ctrl+enter)"
                    onChange={this.props.handleCommentTextChange}
                    specialHandlers={[this.onEnterSaveHandler]}
                />

                {/* Save and Cancel buttons. */}
                <div className={styles.footer}>
                    <div className={styles.interactions}>
                        <button
                            ref={this.setTagButtonRef}
                            className={cx(styles.button, styles.tag)}
                            title={'Add tags'}
                        />
                        <button
                            ref={ref => (this.bmBtnRef = ref)}
                            className={cx(styles.button, {
                                [styles.bookmark]: this.props
                                    .isCommentBookmarked,
                                [styles.notBookmark]: !this.props
                                    .isCommentBookmarked,
                            })}
                            title={
                                !this.props.isCommentBookmarked
                                    ? 'Bookmark'
                                    : 'Remove bookmark'
                            }
                        />
                    </div>
                    <div className={styles.confirmButtons}>
                        <button
                            ref={ref => (this.cancelBtnRef = ref)}
                            className={styles.cancelBtn}
                        >
                            Cancel
                        </button>
                        <button
                            className={styles.saveBtn}
                            ref={ref => (this.saveBtnRef = ref)}
                        >
                            Save
                        </button>
                    </div>
                </div>
                <span
                    className={styles.tagDropdown}
                    onKeyDown={this.handleTagBtnKeyDown}
                >
                    {this.renderTagsTooltip()}
                </span>
            </React.Fragment>
        )
    }
}

export default CommentBoxForm

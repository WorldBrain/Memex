import * as React from 'react'
import cx from 'classnames'
import moment from 'moment'
import { connect } from 'react-redux'
import noop from 'lodash/fp/noop'

import * as actions from '../../actions'
import AnnotationBoxCommentTags from './annotation-box-comment-tags'
import AnnotationBoxFooter from './annotation-box-footer'
import TruncatedTextRenderer from '../truncated-text-renderer'
import CommentTagsInput from './comment-tags-input'
import { MapDispatchToProps } from '../../types'
import { CrowdfundingBox } from '../../../common-ui/crowdfunding'
import { remoteFunction } from '../../../util/webextensionRPC'
import { EVENT_NAMES } from '../../../analytics/internal/constants'

const styles = require('./annotation-box-container.css')

interface OwnProps {
    /** Required to decide how to go to an annotation when it's clicked. */
    env: 'inpage' | 'overview'
    url: string
    isActive: boolean
    isHovered: boolean
    createdWhen: Date
    lastEdited?: Date
    body?: string
    comment?: string
    tags: string[]
    handleGoToAnnotation: (e: React.MouseEvent<HTMLElement>) => void
}

interface StateProps {}

interface DispatchProps {
    handleEditAnnotation: (url: string, comment: string, tags: string[]) => void
    handleDeleteAnnotation: (url: string) => void
}

type Props = OwnProps & StateProps & DispatchProps

interface State {
    mode: 'default' | 'edit' | 'delete'
    commentText: string
    tagsInput: string[]
    displayCrowdfunding: boolean
}

class AnnotationBoxContainer extends React.Component<Props, State> {
    private _processEventRPC = remoteFunction('processEvent')
    private _boxRef: HTMLDivElement = null

    state: State = {
        mode: 'default',
        commentText: '',
        tagsInput: [],
        displayCrowdfunding: false,
    }

    componentDidMount() {
        this._setupEventListeners()
    }

    componentWillUnmount() {
        this._removeEventListeners()
    }

    private _setupEventListeners = () => {
        if (this._boxRef) {
            this._boxRef.addEventListener('mouseenter', this._handleMouseEnter)
            this._boxRef.addEventListener('mouseleave', this._handleMouseLeave)
        }
    }

    private _removeEventListeners = () => {
        if (this._boxRef) {
            this._boxRef.addEventListener('mouseenter', this._handleMouseEnter)
            this._boxRef.addEventListener('mouseleave', this._handleMouseLeave)
        }
    }

    private _setDisplayCrowdfunding = async (
        value: boolean,
        event: 'clickReplyButton' | 'clickShareButton' = undefined,
    ) => {
        if (event) {
            // Call RPC to process the event.
            const type =
                event === 'clickReplyButton'
                    ? EVENT_NAMES.CLICK_REPLY_BUTTON
                    : EVENT_NAMES.CLICK_SHARE_BUTTON
            await this._processEventRPC({ type })
        }
        this.setState({ displayCrowdfunding: value })
    }

    /**
     * Method to change the text of the comment (which is temporary until
     * saved explicitly). Gets called when the text of the text area is
     * changed.
     * Only relevant when component is in `edit` mode.
     */
    private _handleCommentTextChange = (comment: string) => {
        this.setState({ commentText: comment })
    }

    /**
     * Method to add a tag to the list of tags for the comment temporarily
     * until saved explicitly. Gets called when the tags are changed through
     * tag input.
     * Only relevant when component is in `edit` mode.
     */
    private _addTag = (tag: string) => {
        this.setState(prevState => ({
            tagsInput: [tag, ...prevState.tagsInput],
        }))
    }

    /**
     * Method to delete a tag from the list of tags for the comment temporarily
     * until saved explicitly. Gets called when the tags are changed through
     * tag input.
     * Only relevant when component is in `edit` mode.
     */
    private _deleteTag = (tag: string) => {
        const tagIndex = this.state.tagsInput.indexOf(tag)
        this.setState(prevState => ({
            tagsInput: [
                ...prevState.tagsInput.slice(0, tagIndex),
                ...prevState.tagsInput.slice(tagIndex + 1),
            ],
        }))
    }

    /**
     * Serves as a proxy to call the actual method (which is passed via props)
     * that saves any edits made to the comment/annotation.
     */
    private _handleEditAnnotation = () => {
        const { url } = this.props
        const { commentText, tagsInput } = this.state
        this.props.handleEditAnnotation(url, commentText.trim(), tagsInput)
        this.setState({ mode: 'default' })
    }

    /**
     * Serves as a proxy to call the actual method (which is passed via props)
     * that deletes the current comment/annotation.
     */
    private _handleDeleteAnnotation = () => {
        const { url } = this.props
        this.props.handleDeleteAnnotation(url)
    }

    private _getFormattedTimestamp = (timestamp: Date) =>
        moment(timestamp)
            .format('MMMM D YYYY')
            .toUpperCase()

    private _getTruncatedTextObject: (
        text: string,
    ) => { isTextTooLong: boolean; text: string } = text => {
        if (text.length > 280) {
            const truncatedText = text.slice(0, 280) + ' [...]'
            return {
                isTextTooLong: true,
                text: truncatedText,
            }
        }

        for (let i = 0, newlineCount = 0; i < text.length; ++i) {
            if (text[i] === '\n') {
                newlineCount++
                if (newlineCount > 4) {
                    const truncatedText = text.slice(0, i) + ' [...]'
                    return {
                        isTextTooLong: true,
                        text: truncatedText,
                    }
                }
            }
        }

        return {
            isTextTooLong: false,
            text,
        }
    }

    private _handleEditIconClick = () => {
        const { tags, comment } = this.props
        this.setState({ mode: 'edit', commentText: comment, tagsInput: tags })
    }

    private _handleTrashIconClick = () => {
        this.setState({ mode: 'delete' })
    }

    private _handleShareIconClick = () => {
        this._setDisplayCrowdfunding(true, 'clickShareButton')
    }

    private _handleReplyIconClick = () => {
        this._setDisplayCrowdfunding(true, 'clickReplyButton')
    }

    private _handleCancelOperation = () => {
        this.setState({ mode: 'default' })
    }

    private _handleMouseEnter = (e: MouseEvent) => {
        console.log(e)
    }

    private _handleMouseLeave = (e: MouseEvent) => {
        console.log(e)
    }

    private _setBoxRef = (ref: HTMLDivElement) => {
        this._boxRef = ref
    }

    render() {
        const { mode, displayCrowdfunding } = this.state
        const {
            env,
            url,
            isActive,
            isHovered,
            createdWhen,
            lastEdited,
            body,
            comment,
            tags,
            handleGoToAnnotation,
        } = this.props

        const timestamp = !!lastEdited
            ? this._getFormattedTimestamp(lastEdited)
            : this._getFormattedTimestamp(createdWhen)

        const isJustComment = !body
        const isClickable = !isJustComment && env !== 'overview'

        if (displayCrowdfunding) {
            return (
                <CrowdfundingBox
                    onClose={() => this._setDisplayCrowdfunding(false)}
                />
            )
        }

        return (
            <div
                id={url} // Focusing on annotation relies on this ID.
                className={cx(styles.container, {
                    [styles.isActive]: isActive,
                    [styles.isHovered]: isHovered,
                    [styles.isClickable]: isClickable,
                    [styles.isJustComment]: mode !== 'edit' && isJustComment,
                })}
                onClick={isClickable ? handleGoToAnnotation : noop}
                ref={this._setBoxRef}
            >
                {/* Timestamp for the annotation. Hidden during 'edit' mode. */}
                {mode !== 'edit' && (
                    <div className={styles.timestamp}>
                        {!!lastEdited && (
                            <span className={styles.lastEdit}>Last Edit: </span>
                        )}
                        {timestamp}
                    </div>
                )}

                {/* Highlighted text for the annotation. If available, shown in
                every mode. */}
                {!isJustComment && (
                    <div className={styles.highlight}>
                        <TruncatedTextRenderer
                            text={body}
                            getTruncatedTextObject={
                                this._getTruncatedTextObject
                            }
                        />
                    </div>
                )}

                {/* Comment and tags to be displayed. Hidden during 'edit' mode. */}
                {mode !== 'edit' ? (
                    (!!comment || (!!tags && tags.length !== 0)) && (
                        <AnnotationBoxCommentTags
                            comment={comment}
                            tags={tags}
                            isJustComment={isJustComment}
                            getTruncatedTextObject={
                                this._getTruncatedTextObject
                            }
                        />
                    )
                ) : (
                    <CommentTagsInput
                        commentText={this.state.commentText}
                        tags={this.state.tagsInput}
                        handleCommentTextChange={this._handleCommentTextChange}
                        addTag={this._addTag}
                        deleteTag={this._deleteTag}
                    />
                )}

                {/* Footer. */}
                <AnnotationBoxFooter
                    mode={mode}
                    displayGoToAnnotation={env === 'overview' && !!body}
                    handleGoToAnnotation={handleGoToAnnotation}
                    handleEditAnnotation={this._handleEditAnnotation}
                    handleDeleteAnnotation={this._handleDeleteAnnotation}
                    handleCancelEdit={this._handleCancelOperation}
                    handleCancelDeletion={this._handleCancelOperation}
                    editIconClickHandler={this._handleEditIconClick}
                    trashIconClickHandler={this._handleTrashIconClick}
                    shareIconClickHandler={this._handleShareIconClick}
                    replyIconClickHandler={this._handleReplyIconClick}
                />
            </div>
        )
    }
}

const mapDispatchToProps: MapDispatchToProps<
    DispatchProps,
    OwnProps
> = dispatch => ({
    handleEditAnnotation: (url, comment, tags) =>
        dispatch(actions.editAnnotation(url, comment, tags)),
    handleDeleteAnnotation: url => dispatch(actions.deleteAnnotation(url)),
})

export default connect(
    undefined,
    mapDispatchToProps,
)(AnnotationBoxContainer)

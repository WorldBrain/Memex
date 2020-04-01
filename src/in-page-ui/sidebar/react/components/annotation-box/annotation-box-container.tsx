import * as React from 'react'
import cx from 'classnames'
import noop from 'lodash/fp/noop'
import { connect } from 'react-redux'

import DefaultDeleteModeContent from './default-delete-mode-content'
import EditModeContent from './edit-mode-content'
import TruncatedTextRenderer from '../truncated-text-renderer'
import niceTime from 'src/util/nice-time'
import { CrowdfundingBox } from 'src/common-ui/crowdfunding'
// import { remoteFunction } from 'src/util/webextensionRPC'
import { EVENT_NAMES } from 'src/analytics/internal/constants'
import { HighlightInteractionInterface } from 'src/highlighting/types'

const styles = require('./annotation-box-container.css')
const footerStyles = require('./default-footer.css')

interface Props {
    /** Required to decide how to go to an annotation when it's clicked. */
    env: 'inpage' | 'overview'
    url: string
    className?: string
    isActive?: boolean
    isHovered?: boolean
    createdWhen: number
    lastEdited: number
    body?: string
    comment?: string
    tags: string[]
    hasBookmark?: boolean
    handleGoToAnnotation: (e: React.MouseEvent<HTMLElement>) => void
    handleMouseEnter?: (e: Event) => void
    handleMouseLeave?: (e: Event) => void
    handleEditAnnotation: (url: string, comment: string, tags: string[]) => void
    handleDeleteAnnotation: (url: string) => void
    handleBookmarkToggle: (url: string) => void
    handleTagClick: (tag: string) => void
    highlighter: HighlightInteractionInterface
    mode: 'default' | 'edit' | 'delete'
    displayCrowdfunding: boolean
}

export default class AnnotationBoxContainer extends React.Component<Props> {
    static defaultProps = {
        handleMouseEnter: () => undefined,
        handleMouseLeave: () => undefined,
        handleTagClick: () => undefined,
    }

    private _boxRef: HTMLDivElement = null

    componentDidMount() {
        this._setupEventListeners()
    }

    componentWillUnmount() {
        this._removeEventListeners()
    }

    private get isEdited() {
        return this.props.lastEdited !== this.props.createdWhen
    }

    private _setupEventListeners = () => {
        if (this._boxRef) {
            this._boxRef.addEventListener(
                'mouseenter',
                this.props.handleMouseEnter,
            )
            this._boxRef.addEventListener(
                'mouseleave',
                this.props.handleMouseLeave,
            )
        }
    }

    private _removeEventListeners = () => {
        if (this._boxRef) {
            this._boxRef.addEventListener(
                'mouseenter',
                this.props.handleMouseEnter,
            )
            this._boxRef.addEventListener(
                'mouseleave',
                this.props.handleMouseLeave,
            )
        }
    }

    private _setDisplayCrowdfunding = async (
        value: boolean,
        event: 'clickReplyButton' | 'clickShareButton' = undefined,
    ) => {
        if (event) {
            // OLD: internal analytics code
            // const type =
            //     event === 'clickReplyButton'
            //         ? EVENT_NAMES.CLICK_REPLY_BUTTON
            //         : EVENT_NAMES.CLICK_SHARE_BUTTON
            // await this._processEventRPC({ type })
        }
        this.setState({ displayCrowdfunding: value })
    }

    private _getFormattedTimestamp = (timestamp: number) => niceTime(timestamp)

    private _getTruncatedTextObject: (
        text: string,
    ) => { isTextTooLong: boolean; text: string } = text => {
        if (text.length > 280) {
            const truncatedText = text.slice(0, 280)
            return {
                isTextTooLong: true,
                text: truncatedText,
            }
        }

        for (let i = 0, newlineCount = 0; i < text.length; ++i) {
            if (text[i] === '\n') {
                newlineCount++
                if (newlineCount > 4) {
                    const truncatedText = text.slice(0, i)
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

    private _handleEditAnnotation = (
        commentText: string,
        tagsInput: string[],
    ) => {
        const { url } = this.props
        this.props.handleEditAnnotation(url, commentText.trim(), tagsInput)
        this.setState({ mode: 'default' })
    }

    private _handleDeleteAnnotation = () => {
        this.props.handleDeleteAnnotation(this.props.url)
    }

    private _handleEditIconClick = () => {
        this.setState({ mode: 'edit' })
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
        this.props.highlighter.removeTempHighlights()
        this.setState({ mode: 'default' })
    }

    private handleBookmarkToggle = () => {
        this.props.handleBookmarkToggle(this.props.url)
    }

    private _setBoxRef = (ref: HTMLDivElement) => {
        this._boxRef = ref
    }

    render() {
        const { mode, displayCrowdfunding } = this.props
        if (displayCrowdfunding) {
            return (
                <CrowdfundingBox
                    onClose={() => this._setDisplayCrowdfunding(false)}
                />
            )
        }

        const timestamp = this.props.lastEdited
            ? this._getFormattedTimestamp(this.props.lastEdited)
            : this._getFormattedTimestamp(this.props.createdWhen)

        const isClickable = this.props.body && this.props.env !== 'overview'

        return (
            <div
                id={this.props.url} // Focusing on annotation relies on this ID.
                className={cx(styles.container, this.props.className, {
                    [styles.isActive]: this.props.isActive,
                    [styles.isHovered]: this.props.isHovered,
                    [footerStyles.isHovered]: this.props.isHovered,
                    [styles.isClickable]: isClickable,
                    [styles.isJustComment]: mode !== 'edit' && !this.props.body,
                    [styles.isEdit]: mode === 'edit',
                })}
                onClick={isClickable ? this.props.handleGoToAnnotation : noop}
                ref={this._setBoxRef}
            >
                {/* Highlighted text for the annotation. If available, shown in
                every mode. */}
                {this.props.body && (
                    <div className={styles.highlight}>
                        <span className={styles.highlightText}>
                            <TruncatedTextRenderer
                                text={this.props.body}
                                getTruncatedTextObject={
                                    this._getTruncatedTextObject
                                }
                            />
                        </span>
                    </div>
                )}

                {mode !== 'edit' ? (
                    <DefaultDeleteModeContent
                        env={this.props.env}
                        mode={mode}
                        body={this.props.body}
                        comment={this.props.comment}
                        tags={this.props.tags}
                        isEdited={this.isEdited}
                        timestamp={timestamp}
                        hasBookmark={this.props.hasBookmark}
                        handleGoToAnnotation={this.props.handleGoToAnnotation}
                        handleDeleteAnnotation={this._handleDeleteAnnotation}
                        handleCancelOperation={this._handleCancelOperation}
                        handleTagClick={this.props.handleTagClick}
                        editIconClickHandler={this._handleEditIconClick}
                        trashIconClickHandler={this._handleTrashIconClick}
                        shareIconClickHandler={this._handleShareIconClick}
                        getTruncatedTextObject={this._getTruncatedTextObject}
                        handleBookmarkToggle={this.handleBookmarkToggle}
                    />
                ) : (
                    <EditModeContent
                        env={this.props.env}
                        comment={this.props.comment}
                        tags={this.props.tags}
                        handleCancelOperation={this._handleCancelOperation}
                        handleEditAnnotation={this._handleEditAnnotation}
                        commentText="Comment text"
                        tagsInput={[]}
                        isTagInputActive={true}
                        rows={2}
                        tagSuggestions={[]}
                        onAddTag={() => {}}
                        onDeleteTag={() => {}}
                    />
                )}
            </div>
        )
    }
}

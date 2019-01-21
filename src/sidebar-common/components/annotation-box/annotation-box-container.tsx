import * as React from 'react'
import cx from 'classnames'
import moment from 'moment'
import { connect } from 'react-redux'
import noop from 'lodash/fp/noop'

import * as actions from '../../sidebar/actions'
import DefaultDeleteModeContent from './default-delete-mode-content'
import EditModeContent from './edit-mode-content'
import TruncatedTextRenderer from '../truncated-text-renderer'
import { MapDispatchToProps } from '../../types'
import { CrowdfundingBox } from 'src/common-ui/crowdfunding'
import { remoteFunction } from 'src/util/webextensionRPC'
import { EVENT_NAMES } from 'src/analytics/internal/constants'

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
    handleMouseEnter: (e: Event) => void
    handleMouseLeave: (e: Event) => void
}

interface StateProps {}

interface DispatchProps {
    handleEditAnnotation: (url: string, comment: string, tags: string[]) => void
    handleDeleteAnnotation: (url: string) => void
}

type Props = OwnProps & StateProps & DispatchProps

interface State {
    mode: 'default' | 'edit' | 'delete'
    displayCrowdfunding: boolean
}

class AnnotationBoxContainer extends React.Component<Props, State> {
    private _processEventRPC = remoteFunction('processEvent')
    private _boxRef: HTMLDivElement = null

    state: State = {
        mode: 'default',
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
            // Call RPC to process the event.
            const type =
                event === 'clickReplyButton'
                    ? EVENT_NAMES.CLICK_REPLY_BUTTON
                    : EVENT_NAMES.CLICK_SHARE_BUTTON
            await this._processEventRPC({ type })
        }
        this.setState({ displayCrowdfunding: value })
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
        this.setState({ mode: 'default' })
    }

    private _setBoxRef = (ref: HTMLDivElement) => {
        this._boxRef = ref
    }

    render() {
        const { mode, displayCrowdfunding } = this.state
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
                className={cx(styles.container, {
                    [styles.isActive]: this.props.isActive,
                    [styles.isHovered]: this.props.isHovered,
                    [styles.isClickable]: isClickable,
                    [styles.isJustComment]: mode !== 'edit' && !this.props.body,
                })}
                onClick={isClickable ? this.props.handleGoToAnnotation : noop}
                ref={this._setBoxRef}
            >
                {/* Timestamp for the annotation. Hidden during 'edit' mode. */}
                {mode !== 'edit' && (
                    <div className={styles.timestamp}>
                        {!!this.props.lastEdited && (
                            <span className={styles.lastEdit}>Last Edit: </span>
                        )}
                        {timestamp}
                    </div>
                )}

                {/* Highlighted text for the annotation. If available, shown in
                every mode. */}
                {this.props.body && (
                    <div className={styles.highlight}>
                        <TruncatedTextRenderer
                            text={this.props.body}
                            getTruncatedTextObject={
                                this._getTruncatedTextObject
                            }
                        />
                    </div>
                )}

                {mode !== 'edit' ? (
                    <DefaultDeleteModeContent
                        env={this.props.env}
                        mode={mode}
                        body={this.props.body}
                        comment={this.props.comment}
                        tags={this.props.tags}
                        handleGoToAnnotation={this.props.handleGoToAnnotation}
                        handleDeleteAnnotation={this._handleDeleteAnnotation}
                        handleCancelOperation={this._handleCancelOperation}
                        editIconClickHandler={this._handleEditIconClick}
                        trashIconClickHandler={this._handleTrashIconClick}
                        shareIconClickHandler={this._handleShareIconClick}
                        replyIconClickHandler={this._handleReplyIconClick}
                        getTruncatedTextObject={this._getTruncatedTextObject}
                    />
                ) : (
                    <EditModeContent
                        comment={this.props.comment}
                        tags={this.props.tags}
                        handleCancelOperation={this._handleCancelOperation}
                        handleEditAnnotation={this._handleEditAnnotation}
                    />
                )}
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

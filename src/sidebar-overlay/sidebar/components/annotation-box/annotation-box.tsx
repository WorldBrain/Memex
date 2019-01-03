import * as React from 'react'
import cx from 'classnames'
import moment from 'moment'

import AnnotationBoxCommentTags from './annotation-box-comment-tags'
import AnnotationBoxFooter from './annotation-box-footer'
import TruncatedTextRenderer from '../truncated-text-renderer'

const styles = require('./annotation-box.css')

interface Props {
    createdWhen: Date
    lastEdited?: Date
    body?: string
    comment?: string
    tags: string[]
}

interface State {
    mode: 'default' | 'edit' | 'delete'
}

class AnnotationBox extends React.Component<Props, State> {
    state: State = {
        mode: 'default',
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
        this.setState({ mode: 'edit' })
    }

    private _handleTrashIconClick = () => {
        this.setState({ mode: 'delete' })
    }

    private _handleShareIconClick = () => null

    private _handleReplyIconClick = () => null

    private _handleCancelOperation = () => {
        this.setState({ mode: 'default' })
    }

    render() {
        const { mode } = this.state
        const { createdWhen, lastEdited, body, comment, tags } = this.props

        const timestamp = !!lastEdited
            ? this._getFormattedTimestamp(lastEdited)
            : this._getFormattedTimestamp(createdWhen)

        const isJustComment = !body

        return (
            <div
                className={cx(styles.container, {
                    [styles.isClickable]: !isJustComment,
                    [styles.isJustComment]: isJustComment,
                })}
                onClick={
                    !isJustComment
                        ? () => console.log('go to annotation')
                        : () => null
                }
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
                    <div>hello</div>
                )}

                {/* Footer. */}
                <AnnotationBoxFooter
                    mode={mode}
                    handleEditAnnotation={() => null}
                    handleDeleteAnnotation={() => null}
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

export default AnnotationBox

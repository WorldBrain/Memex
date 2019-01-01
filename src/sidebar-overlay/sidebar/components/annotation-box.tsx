import * as React from 'react'
import moment from 'moment'
import cx from 'classnames'

import TruncatedTextRenderer from './truncated-text-renderer'

const styles = require('./annotation-box.css')

interface Props {
    createdWhen: Date
    lastEdited: Date
    body?: string
    comment?: string
}

const _getFormattedTimestamp = (timestamp: Date) =>
    moment(timestamp).format('MMMM D YYYY')

const _getTruncatedTextObject: (
    text: string,
) => { isTextTooLong: boolean; text: string } = text => {
    if (text.length > 280) {
        const truncatedText = text.slice(0, 280) + ' [...]'
        return {
            isTextTooLong: true,
            // isTruncated: true,
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
                    // isTruncated: true,
                    text: truncatedText,
                }
            }
        }
    }

    return {
        isTextTooLong: false,
        // isTruncated: false,
        text,
    }
}

/* tslint:disable-next-line variable-name */
const AnnotationBox = (props: Props) => {
    const { createdWhen, lastEdited, body, comment } = props

    const timestamp = !!lastEdited
        ? _getFormattedTimestamp(lastEdited)
        : _getFormattedTimestamp(createdWhen)

    const isJustComment = !body

    return (
        <div className={styles.container}>
            <div className={styles.timestamp}>
                {!!lastEdited && (
                    <span className={styles.lastEdit}>Last Edit: </span>
                )}
                {timestamp}
            </div>

            {!isJustComment && (
                <div className={styles.highlight}>
                    <TruncatedTextRenderer
                        text={body}
                        getTruncatedTextObject={_getTruncatedTextObject}
                    />
                </div>
            )}

            {/* TODO: Study the behavior of this part. */}
            <div
                className={cx({
                    [styles.isJustComment]: isJustComment,
                })}
            >
                {comment && (
                    <TruncatedTextRenderer
                        text={comment}
                        getTruncatedTextObject={_getTruncatedTextObject}
                    />
                )}
            </div>
        </div>
    )
}

export default AnnotationBox

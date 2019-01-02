import * as React from 'react'
import cx from 'classnames'

import TruncatedTextRenderer from './truncated-text-renderer'
import AnnotationBoxFooter from './annotation-box-footer'

const styles = require('./annotation-box.css')

interface Props {
    mode: 'default' | 'edit' | 'delete'
    createdWhen: Date
    lastEdited?: Date
    body?: string
    comment?: string
    tags: string[]
    getFormattedTimestamp: (timestamp: Date) => string
    getTruncatedTextObject: (
        text: string,
    ) => { isTextTooLong: boolean; text: string }
    shareIconClickHandler: () => void
    replyIconClickHandler: () => void
    setMode: (mode: 'default' | 'edit' | 'delete') => void
}

/* tslint:disable-next-line variable-name */
const AnnotationBox = (props: Props) => {
    const {
        mode,
        createdWhen,
        lastEdited,
        body,
        comment,
        tags,
        getFormattedTimestamp,
        getTruncatedTextObject,
        setMode,
        shareIconClickHandler,
        replyIconClickHandler,
    } = props

    const timestamp = !!lastEdited
        ? getFormattedTimestamp(lastEdited)
        : getFormattedTimestamp(createdWhen)

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
                        getTruncatedTextObject={getTruncatedTextObject}
                    />
                </div>
            )}
            {/* Comment and tags to be displayed. Hidden during 'edit' mode. */}
            {mode !== 'edit' ? (
                (!!comment || (!!tags && tags.length !== 0)) && (
                    <div
                        className={cx({
                            [styles.annotationText]: !!comment,
                            [styles.isJustComment]: isJustComment,
                        })}
                    >
                        {!!comment && (
                            <TruncatedTextRenderer
                                text={comment}
                                getTruncatedTextObject={getTruncatedTextObject}
                            />
                        )}
                        {!!tags &&
                            tags.length !== 0 && (
                                <div
                                    className={cx(styles.tagsContainer, {
                                        [styles.noComment]: !comment,
                                    })}
                                >
                                    {props.tags.map(tag => (
                                        <span
                                            key={tag}
                                            className={styles.tagPill}
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                    </div>
                )
            ) : (
                <div>hello</div>
            )}

            {/* Footer. */}
            <AnnotationBoxFooter
                mode={mode}
                handleEditAnnotation={() => null}
                handleDeleteAnnotation={() => null}
                handleCancelEdit={() => null}
                handleCancelDeletion={() => null}
                editIconClickHandler={() => null}
                trashIconClickHandler={() => null}
                shareIconClickHandler={shareIconClickHandler}
                replyIconClickHandler={replyIconClickHandler}
            />
        </div>
    )
}

export default AnnotationBox

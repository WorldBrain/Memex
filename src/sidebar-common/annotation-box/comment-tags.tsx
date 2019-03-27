import * as React from 'react'
import cx from 'classnames'

import { TruncatedTextRenderer } from '../components'

const styles = require('./comment-tags.css')

interface Props {
    comment?: string
    tags?: string[]
    isJustComment: boolean
    handleTagClick: (tag: string) => void
    getTruncatedTextObject: (
        text: string,
    ) => { isTextTooLong: boolean; text: string }
}

/* tslint:disable-next-line variable-name */
const CommentTags = ({
    comment,
    tags,
    isJustComment,
    handleTagClick,
    getTruncatedTextObject,
}: Props) => (
    <div
        className={cx({
            [styles.annotationText]: !!comment,
            [styles.isJustComment]: isJustComment,
        })}
    >
        {/* Comment for the annotation. */}
        {!!comment && (
            <TruncatedTextRenderer
                text={comment}
                getTruncatedTextObject={getTruncatedTextObject}
            />
        )}

        {/* Tags for the annotation. */}
        {!!tags &&
            tags.length !== 0 && (
                <div
                    className={cx(styles.tagsContainer, {
                        [styles.noComment]: !comment,
                    })}
                >
                    {tags.map(tag => (
                        <span
                            key={tag}
                            className={styles.tagPill}
                            onClick={e => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleTagClick(tag)
                            }}
                        >
                            {tag}
                        </span>
                    ))}
                </div>
            )}
    </div>
)

export default CommentTags

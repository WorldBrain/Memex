import * as React from 'react'
import cx from 'classnames'

// import { TruncatedTextRenderer } from '../components'
import TextTruncated from 'src/annotations/components/parts/TextTruncated'

const styles = require('./comment-tags.css')

interface Props {
    comment?: string
    tags?: string[]
    isJustComment: boolean
    handleTagClick: (tag: string) => void
    onCommentEditClick?: React.MouseEventHandler
}

/* tslint:disable-next-line variable-name */
const CommentTags = ({
    comment,
    tags,
    isJustComment,
    handleTagClick,
    onCommentEditClick,
}: Props) => (
    <div
        className={cx({
            [styles.annotationText]: !!comment,
            [styles.isJustComment]: isJustComment,
        })}
    >
        {/* Comment for the annotation. */}
        {!!comment && (
            <TextTruncated
                text={comment}
                isHighlight={false}
                onCommentEditClick={onCommentEditClick}
            />
        )}

        {/* Tags for the annotation. */}
        {!!tags && tags.length !== 0 && (
            <div
                className={cx(styles.tagsContainer, {
                    [styles.noComment]: !comment,
                })}
            >
                {tags.map((tag) => (
                    <span
                        key={tag}
                        className={styles.tagPill}
                        onClick={(e) => {
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

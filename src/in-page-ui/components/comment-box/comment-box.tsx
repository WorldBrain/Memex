import * as React from 'react'
import { connect, MapStateToProps } from 'react-redux'
import classNames from 'classnames'
import noop from 'lodash/fp/noop'

import AnnotationHighlight from '../annotation-highlight'
import CommentBoxForm, { CommentBoxFormProps } from './comment-box-form'
import { Anchor, HighlightInteractionInterface } from 'src/highlighting/types'

const styles = require('./comment-box.css')

interface StateProps {
    anchor?: Anchor
    form: Omit<CommentBoxFormProps, 'saveComment'>
}

interface CommentBoxDispatchProps {
    saveComment: (
        anchor: Anchor,
        commentText: string,
        tags: string[],
        bookmarked: boolean,
    ) => void
}

interface OwnProps {
    env: 'inpage' | 'overview'
    isSocialPost?: boolean
    closeComments?: () => void
}

export type CommentBoxProps = StateProps & CommentBoxDispatchProps & OwnProps

export default class CommentBoxContainer extends React.Component<
    CommentBoxProps
> {
    save = async (e) => {
        e.preventDefault()
        e.stopPropagation()

        const { anchor, form, saveComment } = this.props

        return saveComment(
            anchor,
            form.commentText.trim(),
            form.tags,
            form.isCommentBookmarked,
        )
    }

    render() {
        const { env, anchor } = this.props

        return (
            <div
                className={classNames(styles.commentBoxContainer, {
                    [styles.inPage]: env === 'inpage',
                })}
            >
                {!!anchor && (
                    <AnnotationHighlight
                        anchor={anchor}
                        truncateHighlight={false}
                        setTruncateHighlight={() => {}}
                    />
                )}

                <CommentBoxForm {...this.props.form} saveComment={this.save} />
            </div>
        )
    }
}

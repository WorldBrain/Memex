import * as React from 'react'
import onClickOutside from 'react-onclickoutside'
import cx from 'classnames'

import AnnotationHighlight from '../annotation-highlight'
import CommentBoxForm, { CommentBoxFormProps } from './comment-box-form'
import { Anchor } from 'src/highlighting/types'

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
    isSocialPost?: boolean
    closeComments?: () => void
}

export type CommentBoxProps = StateProps & CommentBoxDispatchProps & OwnProps

class CommentBoxContainer extends React.Component<CommentBoxProps> {
    handleClickOutside() {
        this.props.closeComments()
    }

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
        const { anchor } = this.props

        return (
            <div className={cx(styles.commentBoxContainer, styles.inPage)}>
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

export default onClickOutside(CommentBoxContainer)

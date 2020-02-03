import React, { PureComponent } from 'react'
import { Props } from './result-item'
import cx from 'classnames'

const styles = require('./result-item.css')

class ResultItemActions extends PureComponent<Props> {
    get bookmarkClass() {
        return cx(styles.button, {
            [styles.bookmark]: this.props.hasBookmark,
            [styles.notBookmark]: !this.props.hasBookmark,
        })
    }

    render() {
        return (
            <div
                className={cx(styles.detailsContainer, {
                    [styles.tweetDetailsContainer]: this.props.isSocial,
                })}
            >
                <div
                    className={styles.buttonsContainer}
                    onClick={e => {
                        e.preventDefault()
                        e.stopPropagation()
                    }}
                >
                    <button
                        disabled={this.props.isDeleting}
                        className={cx(styles.button, styles.trash)}
                        onClick={this.props.onTrashBtnClick}
                        title="Delete this page & all related content"
                    />
                    <button
                        className={cx(styles.button, styles.tag)}
                        onClick={this.props.onTagBtnClick}
                        ref={this.props.setTagButtonRef}
                        title="Add/View Tags"
                    />
                    <button
                        className={cx(styles.button, styles.comment, {
                            [styles.commentActive]: this.props.annotsCount > 0,
                        })}
                        onClick={this.props.onCommentBtnClick}
                        title="Add/View Commments & Annotations"
                    />
                    <button
                        disabled={this.props.isDeleting}
                        className={this.bookmarkClass}
                        onClick={this.props.onToggleBookmarkClick}
                        title="Bookmark this page"
                    />
                </div>
            </div>
        )
    }
}

export default ResultItemActions

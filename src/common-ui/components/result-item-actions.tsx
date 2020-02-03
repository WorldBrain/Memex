import React, { PureComponent } from 'react'
import { Props } from './result-item'
import cx from 'classnames'
import ButtonTooltip from './button-tooltip'

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
                    <ButtonTooltip
                        position="bottom"
                        tooltipText="Delete this page & all related content"
                    >
                        <button
                            disabled={this.props.isDeleting}
                            className={cx(styles.button, styles.trash)}
                            onClick={this.props.onTrashBtnClick}
                        />
                    </ButtonTooltip>
                    <ButtonTooltip
                        position="bottom"
                        tooltipText="Add/View Tags"
                    >
                        <button
                            className={cx(styles.button, styles.tag)}
                            onClick={this.props.onTagBtnClick}
                            ref={this.props.setTagButtonRef}
                            title="Add/View Tags"
                        />
                    </ButtonTooltip>
                    <ButtonTooltip
                        position="bottom"
                        tooltipText="Add/View Commments & Annotations"
                    >
                        <button
                            className={cx(styles.button, styles.comment, {
                                [styles.commentActive]: this.props.annotsCount > 0,
                            })}
                            onClick={this.props.onCommentBtnClick}
                            title="Add/View Commments & Annotations"
                        />
                    </ButtonTooltip>
                    <ButtonTooltip
                        position="bottom"
                        tooltipText="Bookmark"
                    >
                        <button
                            disabled={this.props.isDeleting}
                            className={this.bookmarkClass}
                            onClick={this.props.onToggleBookmarkClick}
                            title="Bookmark this page"
                        />
                    </ButtonTooltip>
                </div>
            </div>
        )
    }
}

export default ResultItemActions

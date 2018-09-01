import React from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'

import styles from './CommentBox.css'

const CommentBox = props => (
    <div
        className={
            props.isHidden && !props.anchor ? styles.commentBoxContainer : ''
        }
    >
        <div className={styles.topBar}>
            <span className={styles.settings} onClick={props.openSettings} />
            <div
                id="add_comment_btn"
                className={cx(styles.addNote, {
                    [styles.disabled]: !props.isHidden,
                })}
                onClick={props.isHidden ? props.showCommentBox : null}
            >
                Add Comment
            </div>
        </div>

        {props.anchor ? (
            <div className={styles.highlighted}>
                <div className={styles.newAnnotation}>New Annotation</div>
                <div className={styles.highlightedText}>
                    "{props.highlightText}"
                    <span
                        className={cx(styles.showMore, {
                            [styles.rotated]: !props.displayHighlightTruncated,
                            [styles.noDisplay]: !props.isHighlightLong,
                        })}
                        onClick={props.toggleHighlightTruncation}
                    />
                </div>
            </div>
        ) : null}

        <div
            className={cx(styles.commentBox, {
                [styles.iframe]: props.env === 'iframe',
                [styles.noDisplay]: props.isHidden && !props.anchor,
            })}
        >
            <textarea
                rows={props.textareaRows}
                className={styles.textarea}
                value={props.commentInput}
                placeholder={'Add your comment...'}
                onChange={props.handleChange}
                onKeyDown={props.handleKeyDown}
                ref={props.setInputRef}
                onClick={() => props.setTagInput(false)}
            />
            <br />
            <div id="tags_container" ref={props.setTagRef}>
                {props.renderTagInput()}
            </div>
            <div className={styles.buttonHolder}>
                <button
                    className={styles.save}
                    ref={props.setSaveRef}
                    onClick={props.save}
                >
                    Save
                </button>
                <a className={styles.cancel} onClick={props.cancel}>
                    Cancel
                </a>
            </div>
        </div>
    </div>
)

CommentBox.propTypes = {
    isHidden: PropTypes.bool.isRequired,
    anchor: PropTypes.object,
    openSettings: PropTypes.func.isRequired,
    showCommentBox: PropTypes.func.isRequired,
    highlightText: PropTypes.string.isRequired,
    isHighlightLong: PropTypes.bool,
    displayHighlightTruncated: PropTypes.bool.isRequired,
    toggleHighlightTruncation: PropTypes.func.isRequired,
    env: PropTypes.string.isRequired,
    textareaRows: PropTypes.number.isRequired,
    commentInput: PropTypes.string.isRequired,
    handleChange: PropTypes.func.isRequired,
    handleKeyDown: PropTypes.func.isRequired,
    setInputRef: PropTypes.func.isRequired,
    setTagRef: PropTypes.func.isRequired,
    setTagInput: PropTypes.func.isRequired,
    renderTagInput: PropTypes.func.isRequired,
    setSaveRef: PropTypes.func.isRequired,
    save: PropTypes.func.isRequired,
    cancel: PropTypes.func.isRequired,
}

export default CommentBox

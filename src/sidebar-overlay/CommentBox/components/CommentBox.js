import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import cx from 'classnames'

import { selectors, actions } from '../'
import { IndexDropdown } from 'src/common-ui/containers'
import TagHolder from '../../components/TagHolder'
import * as constants from '../../constants'

import styles from './CommentBox.css'

class CommentBox extends React.PureComponent {
    static propTypes = {
        anchor: PropTypes.shape({
            quote: PropTypes.string.isRequired,
            descriptor: PropTypes.object.isRequired,
        }),
        env: PropTypes.string.isRequired,
        commentInput: PropTypes.string.isRequired,
        textareaRows: PropTypes.number.isRequired,
        isHidden: PropTypes.bool.isRequired,
        tagInput: PropTypes.bool.isRequired,
        tags: PropTypes.arrayOf(PropTypes.string),
        displayHighlightTruncated: PropTypes.bool.isRequired,
        saveAnnotation: PropTypes.func.isRequired,
        updateAnnotations: PropTypes.func.isRequired,
        cancelAnnotation: PropTypes.func.isRequired,
        setCommentInput: PropTypes.func.isRequired,
        setTextareaRows: PropTypes.func.isRequired,
        setHidden: PropTypes.func.isRequired,
        setTagInput: PropTypes.func.isRequired,
        toggleHighlightTruncation: PropTypes.func.isRequired,
        addTag: PropTypes.func.isRequired,
        deleteTag: PropTypes.func.isRequired,
    }

    componentDidMount() {
        // Auto resize textarea
        if (this.inputRef) {
            this.inputRef.focus()
            this.inputRef.addEventListener('scroll', e => {
                let i = 0
                // i prevents infinity loop when resizing
                while (e.target.scrollTop && i++ < 30) {
                    // For dynamically getting the height even if resized
                    let height = window.getComputedStyle(e.target).height
                    height = parseInt(height, 10)
                    e.target.style.height = height + 20 + 'px'
                }
            })
        }

        this.attachEventListener()
    }

    maybeCloseTagsDropdown = e => {
        if (!this.props.tagInput) return
        else if (
            this.tagInputContainer &&
            this.tagInputContainer.contains(e.target)
        )
            return

        this.props.setTagInput(false)
    }

    attachEventListener = () => {
        // Attaches on click listener to close the tags input
        // when clicked outside
        // TODO: Use refs instead of manually calling it
        const sidebar = document.querySelector('#memex_sidebar_panel')
        sidebar.addEventListener('click', this.maybeCloseTagsDropdown, false)
    }

    isHighlightLong = () => {
        return this.props.anchor && this.props.anchor.quote.length > 280
    }

    isHidden = () => this.props.isHidden && !this.props.anchor

    handleChange = e => {
        let { textareaRows } = this.props
        const comment = e.target.value

        if (comment.length === 0) {
            textareaRows = constants.DEFAULT_ROWS
            this.inputRef.style.height = ''
        } else {
            textareaRows = constants.MAXED_ROWS
        }

        this.props.setCommentInput(comment)
        this.props.setTextareaRows(textareaRows)
    }

    getHighlightText = () => {
        const highlight = this.props.anchor.quote
        if (this.props.displayHighlightTruncated) {
            const truncatedText = highlight.slice(0, 280) + ' [..]'
            return truncatedText
        }
        return highlight
    }

    setInputRef = node => (this.inputRef = node)

    cancel = () => {
        this.props.cancelAnnotation()
    }

    save = () => {
        const strippedComment = this.props.commentInput.trim()
        if (strippedComment.length || this.props.anchor) {
            const body = this.props.anchor ? this.props.anchor.quote : ''
            this.props.saveAnnotation(
                strippedComment,
                body,
                this.props.tags,
                this.props.env,
            )
            // Update highlights only if there is an anchor
            if (this.props.env === 'iframe') this.props.updateAnnotations()
        }
    }

    setTagRef = node => (this.tagInputContainer = node)

    openSettings = () => {
        const settingsUrl = browser.extension.getURL('/options.html#/settings')
        browser.tabs.create({
            url: settingsUrl,
            active: true,
        })
    }

    renderTagInput() {
        const tagObjs = this.props.tags.map(tag => ({ name: tag }))

        if (this.props.tagInput)
            return (
                <IndexDropdown
                    isForAnnotation
                    allowAdd
                    initFilters={this.props.tags}
                    onFilterAdd={this.props.addTag}
                    onFilterDel={this.props.deleteTag}
                    source="tag"
                />
            )
        else
            return (
                <TagHolder
                    tags={tagObjs}
                    clickHandler={() => this.props.setTagInput(true)}
                    deleteTag={({ name }) => this.props.deleteTag(name)}
                />
            )
    }

    render() {
        return (
            <div className={this.isHidden() ? styles.commentBoxContainer : ''}>
                <div className={styles.topBar}>
                    <span
                        className={styles.settings}
                        onClick={this.openSettings}
                    />
                    <div
                        className={cx(styles.addNote, {
                            [styles.disabled]: !this.props.isHidden,
                        })}
                        onClick={
                            this.props.isHidden
                                ? () => this.props.setHidden(false)
                                : null
                        }
                    >
                        Add Comment
                    </div>
                </div>

                {this.props.anchor ? (
                    <div className={styles.highlighted}>
                        <div className={styles.newAnnotation}>
                            New Annotation
                        </div>
                        <div className={styles.highlightedText}>
                            "{this.getHighlightText()}"
                            <span
                                className={cx(styles.showMore, {
                                    [styles.rotated]: !this.props
                                        .displayHighlightTruncated,
                                    [styles.noDisplay]: !this.isHighlightLong(),
                                })}
                                onClick={this.props.toggleHighlightTruncation}
                            />
                        </div>
                    </div>
                ) : null}

                {this.isHidden() ? null : (
                    <div
                        className={cx(styles.commentBox, {
                            [styles.iframe]: this.props.env === 'iframe',
                        })}
                    >
                        <textarea
                            rows={this.props.textareaRows}
                            className={styles.textarea}
                            value={this.props.commentInput}
                            placeholder={'Add your comment...'}
                            onChange={this.handleChange}
                            ref={this.setInputRef}
                            onClick={() => this.props.setTagInput(false)}
                        />
                        <br />
                        <div ref={this.setTagRef}>{this.renderTagInput()}</div>
                        <div className={styles.buttonHolder}>
                            <button className={styles.save} onClick={this.save}>
                                Save
                            </button>
                            <a className={styles.cancel} onClick={this.cancel}>
                                Cancel
                            </a>
                        </div>
                    </div>
                )}
            </div>
        )
    }
}
const mapStateToProps = state => ({
    anchor: selectors.anchor(state),
    commentInput: selectors.commentInput(state),
    textareaRows: selectors.textareaRows(state),
    isHidden: selectors.isHidden(state),
    tagInput: selectors.tagInput(state),
    displayHighlightTruncated: selectors.displayHighlightTruncated(state),
    tags: selectors.tags(state),
})
const mapDispatchToProps = dispatch => ({
    setCommentInput: input => dispatch(actions.setCommentInput(input)),
    setTextareaRows: rows => dispatch(actions.setTextareaRows(rows)),
    setHidden: value => dispatch(actions.setHidden(value)),
    setTagInput: value => dispatch(actions.setTagInput(value)),
    toggleHighlightTruncation: () =>
        dispatch(actions.toggleHighlightTruncation()),
    saveAnnotation: (...args) => dispatch(actions.saveAnnotation(...args)),
    cancelAnnotation: () => dispatch(actions.cancelAnnotation()),
    addTag: tag => dispatch(actions.addTag(tag)),
    deleteTag: tag => dispatch(actions.deleteTag(tag)),
})

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(CommentBox)

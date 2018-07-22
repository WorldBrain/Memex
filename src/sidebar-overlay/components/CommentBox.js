import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import cx from 'classnames'

import { selectors, actions } from '../redux'
import { IndexDropdown } from 'src/common-ui/containers'
import TagHolder from './TagHolder'
import * as constants from '../constants'
import styles from './CommentBox.css'

class CommentBox extends React.PureComponent {
    static propTypes = {
        createAnnotation: PropTypes.func.isRequired,
        setAnchor: PropTypes.func.isRequired,
        anchor: PropTypes.shape({
            quote: PropTypes.string.isRequired,
            descriptor: PropTypes.object.isRequired,
        }),
        env: PropTypes.string.isRequired,
        updateAnnotations: PropTypes.func.isRequired,
    }

    state = {
        commentInput: '',
        textareaRows: constants.DEFAULT_ROWS,
        minimized: true,
        isHidden: false,
        tagInput: false,
        tags: [],
    }

    componentDidMount() {
        // Auto resize textarea
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

        this.attachEventListener()

        if (this.inputRef) this.inputRef.focus()

        if (this.props.anchor)
            this.setState({
                isHidden: false,
            })
    }

    maybeCloseTagsDropdown = e => {
        if (!this.state.tagInput) return
        else if (
            this.tagInputContainer &&
            this.tagInputContainer.contains(e.target)
        )
            return

        this.setState({
            tagInput: false,
        })
    }

    attachEventListener = () => {
        // Attaches on click listener to close the tags input
        // when clicked outside
        // TODO: Use refs instead of manually calling it
        const sidebar = document.querySelector('#memex_sidebar_panel')
        sidebar.addEventListener('click', this.maybeCloseTagsDropdown, false)
    }

    isHidden = () => this.state.isHidden && !this.props.anchor

    handleChange = e => {
        let { minimized, textareaRows } = this.state
        const comment = e.target.value

        if (comment.length === 0) {
            textareaRows = constants.DEFAULT_ROWS
            this.inputRef.style.height = ''
        } else if (minimized) {
            minimized = false
            textareaRows = constants.MAXED_ROWS
        }

        this.setState({
            commentInput: comment,
            textareaRows,
        })
    }

    setInputRef = node => (this.inputRef = node)

    cancel = () => {
        this.inputRef.rows = this.state.textareaRows
        this.inputRef.focus()
        this.props.setAnchor(null)
        this.setState({
            commentInput: '',
            textareaRows: constants.DEFAULT_ROWS,
            isHidden: true,
            tagInput: false,
            tags: [],
        })
    }

    save = () => {
        const { commentInput, tags } = this.state
        const { anchor, env } = this.props
        const strippedComment = commentInput.trim()
        if (strippedComment.length || anchor) {
            const body = anchor ? anchor.quote : ''
            this.props.createAnnotation(strippedComment, body, tags, env)
            this.setState({
                commentInput: '',
                textareaRows: constants.DEFAULT_ROWS,
                isHidden: true,
                tags: [],
            })
            // Update highlights only if there is an anchor
            if (anchor) this.props.updateAnnotations()
        }
    }

    setHidden = value => () =>
        this.setState({
            isHidden: value,
        })

    addTag = newTag => {
        const tags = [newTag, ...this.state.tags]
        this.setState({
            tags,
        })
    }

    delTag = tag => {
        const oldTags = [...this.state.tags]
        const tagIndex = oldTags.indexOf(tag)

        if (tagIndex === -1) return null

        const tags = [
            ...oldTags.slice(0, tagIndex),
            ...oldTags.slice(tagIndex + 1),
        ]

        this.setState({
            tags,
        })
    }

    _setTagInput = value => () => this.setState({ tagInput: value })

    setTagRef = node => (this.tagInputContainer = node)

    openSettings = () => {
        const settingsUrl = browser.extension.getURL('/options.html#/settings')
        browser.tabs.create({
            url: settingsUrl,
            active: true,
        })
    }

    renderTagInput() {
        const tagObjs = this.state.tags.map(tag => ({ name: tag }))

        if (this.state.tagInput)
            return (
                <IndexDropdown
                    isForAnnotation
                    allowAdd
                    initFilters={this.state.tags}
                    onFilterAdd={this.addTag}
                    onFilterDel={this.delTag}
                    source="tag"
                />
            )
        else
            return (
                <TagHolder
                    tags={tagObjs}
                    clickHandler={this._setTagInput(true)}
                    deleteTag={({ name }) => this.delTag(name)}
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
                            [styles.disabled]: !this.state.isHidden,
                        })}
                        onClick={
                            this.state.isHidden ? this.setHidden(false) : null
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
                            "{this.props.anchor.quote}"
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
                            rows={this.state.textareaRows}
                            className={styles.textarea}
                            value={this.state.commentInput}
                            placeholder={'Add your comment...'}
                            onChange={this.handleChange}
                            ref={this.setInputRef}
                            onClick={this._setTagInput(false)}
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
})
const mapDispatchToProps = dispatch => ({
    createAnnotation: (comment, body, tags, env) =>
        dispatch(actions.createAnnotation(comment, body, tags, env)),
    setAnchor: anchor => dispatch(actions.setAnchor(anchor)),
})

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(CommentBox)

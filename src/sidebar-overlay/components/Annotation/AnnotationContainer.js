import React from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'
import moment from 'moment'
import { remoteFunction } from '../../../util/webextensionRPC'

import Annotation from './Annotation'
import TagHolder from '../TagHolder/TagHolder.js'
import {
    CrowdfundingBox,
    CrowdfundingModal,
} from '../../../common-ui/crowdfunding'
import styles from './Annotation.css'
import { EVENT_NAMES } from '../../../analytics/internal/constants'
import { IndexDropdown } from '../../../common-ui/containers'

class AnnotationContainer extends React.Component {
    static propTypes = {
        annotation: PropTypes.object.isRequired,
        tags: PropTypes.array,
        deleteAnnotation: PropTypes.func.isRequired,
        editAnnotation: PropTypes.func.isRequired,
        goToAnnotation: PropTypes.func.isRequired,
        env: PropTypes.string.isRequired,
        isActive: PropTypes.bool.isRequired,
        isHovered: PropTypes.bool.isRequired,
        onMouseEnter: PropTypes.func.isRequired,
        onMouseLeave: PropTypes.func.isRequired,
    }

    constructor(props) {
        super(props)
        const annotationObj = this.props.annotation
        let highlight, annotation
        let annotationText = ''
        if (annotationObj.body) {
            highlight = this.getTruncatedObject(annotationObj.body)
        }

        if (annotationObj.comment) {
            annotation = this.getTruncatedObject(annotationObj.comment)
            annotationText = annotationObj.comment
        }

        this.state = {
            truncated: {
                highlight,
                annotation,
            },

            annotationText,
            annotationEditMode: false,

            tags: props.tags || [],
            tagInput: false,

            footerState: 'default',

            crowdfunding: false,
        }
    }

    componentDidMount() {
        this.tagInputContainer = null
        this.attachEventListener()
    }

    maybeCloseTagsDropdown = e => {
        if (!this.state.tagInput) {
            return
        } else if (
            this.tagInputContainer &&
            this.tagInputContainer.contains(e.target)
        ) {
            return
        }

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

    setCrowdfunding = (value, isReply) => async () => {
        if (isReply != null) {
            await remoteFunction('processEvent')({
                type: isReply
                    ? EVENT_NAMES.CLICK_REPLY_BUTTON
                    : EVENT_NAMES.CLICK_SHARE_BUTTON,
            })
        }

        this.setState({
            crowdfunding: value,
        })
    }

    reloadTags = async () => {
        const tags = await remoteFunction('getAnnotationTags')(
            this.props.annotation.url,
        )
        this.setState({
            tags,
        })
    }

    getTruncatedObject = text => {
        // For the edge case where user enters a lot of newlines
        // This piece of code, counts the new lines and finds
        // the position until which to truncate

        let newlineCount = 0
        let i = 0
        let shouldTruncateForNewLines = false

        while (i < text.length) {
            if (text[i++] === '\n') {
                newlineCount++
            }
            if (newlineCount > 4) {
                shouldTruncateForNewLines = true
                // Now i stores the position for max possible characters
                break
            }
        }

        if (text.length > 280) {
            const truncatedText = text.slice(0, 280) + ' [..]'
            return {
                isTruncated: true,
                text: truncatedText,
            }
        } else if (shouldTruncateForNewLines) {
            const truncatedText = text.slice(0, i) + '[..]'
            return {
                isTruncated: true,
                text: truncatedText,
            }
        }
        return null
    }

    handleChange = e => {
        this.setState({
            annotationText: e.target.value,
        })
    }

    handleDeleteAnnotation = e => {
        e.preventDefault()
        e.stopPropagation()
        this._setFooterState('default')
        this.props.deleteAnnotation(this.props.annotation)
    }

    handleEditAnnotation = e => {
        e.preventDefault()
        e.stopPropagation()
        const { url, comment } = this.props.annotation
        const { annotationText, truncated } = this.state
        const newTruncated = {
            ...truncated,
        }

        if (annotationText !== comment) {
            this.props.editAnnotation({
                url,
                comment: annotationText,
            })
            // Recalculate if truncation is needed
            newTruncated.annotation = this.getTruncatedObject(annotationText)
        }

        this.reloadTags()
        this.setState({
            annotationEditMode: false,
            tagInput: false,
            footerState: 'default',
            truncated: newTruncated,
        })
    }

    getTags = () => this.state.tags.map(tag => tag.name)

    _setTagInput = value => () =>
        this.setState({
            tagInput: value,
        })

    getDateDetails = () => {
        if (this.state.annotationEditMode) {
            return {
                timestamp: '',
            }
        }

        const { createdWhen, lastEdited } = this.props.annotation
        let dateObject
        if (!lastEdited) {
            dateObject = new Date(createdWhen)
        } else {
            dateObject = new Date(lastEdited)
        }
        const timestamp = moment(dateObject)
            .format('MMMM D YYYY')
            .toUpperCase()
        return {
            timestamp,
            lastEdited,
        }
    }

    renderFooterIcons = () => {
        const { annotation, env } = this.props
        return (
            <div className={styles.footerAside}>
                <span
                    className={cx(styles.commonIcon, styles.editIcon)}
                    onClick={this.toggleEditAnnotation}
                    title={'Edit note'}
                />{' '}
                <span
                    className={cx(styles.commonIcon, styles.trashIcon)}
                    onClick={this._setFooterState('delete')}
                    title={'Delete note'}
                />{' '}
                <span
                    className={cx(styles.commonIcon, styles.shareIcon)}
                    onClick={this.setCrowdfunding(true, false)}
                    title={'Share this note'}
                />{' '}
                <span
                    className={cx(styles.commonIcon, styles.replyIcon)}
                    onClick={this.setCrowdfunding(true, true)}
                    title={'Reply to this note'}
                />{' '}
                {env === 'overview' && annotation.body ? (
                    <span
                        className={styles.goToPageIcon}
                        onClick={this.props.goToAnnotation(annotation)}
                    />
                ) : null}{' '}
            </div>
        )
    }

    renderEditButtons = () => {
        return (
            <div className={styles.footerAside}>
                <span
                    className={styles.footerBoldText}
                    onClick={this.handleEditAnnotation}
                >
                    Save{' '}
                </span>{' '}
                <span
                    className={styles.footerText}
                    onClick={this.toggleEditAnnotation}
                >
                    Cancel{' '}
                </span>{' '}
            </div>
        )
    }

    renderDeleteButtons = () => {
        return (
            <div className={styles.footerAside}>
                <span className={styles.deleteReally}> Really ? </span>{' '}
                <span
                    className={styles.footerBoldText}
                    onClick={this.handleDeleteAnnotation}
                >
                    Delete{' '}
                </span>{' '}
                <span
                    className={styles.footerText}
                    onClick={this._setFooterState('default')}
                >
                    Cancel{' '}
                </span>{' '}
            </div>
        )
    }

    findFooterRenderer(state) {
        if (state === 'default') {
            return this.renderFooterIcons()
        } else if (state === 'edit') {
            return this.renderEditButtons()
        } else if (state === 'delete') {
            return this.renderDeleteButtons()
        }
    }

    renderFooter = () => {
        const { footerState } = this.state
        return (
            <div className={styles.footer}>
                {' '}
                {this.findFooterRenderer(footerState)}{' '}
            </div>
        )
    }

    _toggleState = stateName => () => {
        const toggled = !this.state[stateName]
        this.setState({
            [stateName]: toggled,
        })
    }

    toggleTruncation = name => e => {
        e.preventDefault()
        e.stopPropagation()
        const truncated = { ...this.state.truncated }
        truncated[name].isTruncated = !truncated[name].isTruncated

        this.setState({
            truncated,
        })
    }

    _setFooterState = footerState => e => {
        e.preventDefault()
        e.stopPropagation()
        this.setState({
            footerState,
        })
    }

    toggleEditAnnotation = e => {
        this._toggleState('annotationEditMode')()
        if (this.state.footerState === 'edit') {
            this._setFooterState('default')(e)
        } else {
            this._setFooterState('edit')(e)
        }
    }

    setTagRef = node => {
        this.tagInputContainer = node
    }

    renderShowButton = name => {
        const { truncated } = this.state
        if (!truncated) {
            return null
        }
        if (truncated[name]) {
            return (
                <span
                    className={cx(styles.showMore, {
                        [styles.rotated]: !truncated[name].isTruncated,
                    })}
                    onClick={this.toggleTruncation(name)}
                />
            )
        }
        return null
    }

    getHighlightText = () => {
        const { truncated } = this.state
        if (
            truncated &&
            truncated.highlight &&
            truncated.highlight.isTruncated
        ) {
            return truncated.highlight.text
        } else {
            return this.props.annotation.body
        }
    }

    getAnnotationText = () => {
        const { truncated, annotationEditMode } = this.state
        if (annotationEditMode) {
            return ''
        }
        if (
            truncated &&
            truncated.annotation &&
            truncated.annotation.isTruncated
        ) {
            return truncated.annotation.text
        } else {
            return this.props.annotation.comment
        }
    }

    renderTagInput() {
        const tagStringArray = this.state.tags.map(tag => tag.name)
        if (this.state.tagInput) {
            return (
                <IndexDropdown
                    isForAnnotation
                    url={this.props.annotation.url}
                    initFilters={tagStringArray}
                    onFilterAdd={this.reloadTags}
                    onFilterDel={this.reloadTags}
                    source="tag"
                />
            )
        } else {
            return (
                <TagHolder
                    tags={this.state.tags}
                    clickHandler={this._setTagInput(true)}
                    deleteTag={tag => {
                        remoteFunction('delAnnotationTag')(tag)
                        this.reloadTags()
                    }}
                />
            )
        }
    }

    renderAnnotationInput = () => {
        if (!this.state.annotationEditMode) {
            return null
        }
        return (
            <div className={styles.annotationInput}>
                <textarea
                    rows="5"
                    cols="20"
                    className={styles.annotationTextarea}
                    value={this.state.annotationText}
                    onChange={this.handleChange}
                    onClick={() => {
                        this.setState({
                            tagInput: false,
                        })
                    }}
                    placeholder="Add comment..."
                />
                <div ref={this.setTagRef}> {this.renderTagInput()} </div>{' '}
            </div>
        )
    }

    deriveTagsClass = () =>
        cx({
            [styles.tagsContainer]: this.state.tags.length,
            [styles.noComment]:
                this.state.tags.length && !this.props.annotation.comment,
            [styles.noDisplay]: this.state.annotationEditMode,
        })

    deriveIsJustComment = () => !this.props.annotation.body

    deriveIsIFrame = () => this.props.env === 'iframe'

    /**
     * Comment box (#fafafa bg) should only be visible if there is a comment
     * or the annotaion isn't edit mode.
     */
    shouldCommentBoxBeVisible = () => {
        return (
            this.props.annotation.comment.length > 0 &&
            !this.state.annotationEditMode
        )
    }

    render() {
        const { goToAnnotation, annotation } = this.props
        if (this.state.crowdfunding && this.props.env === 'iframe') {
            return <CrowdfundingBox onClose={this.setCrowdfunding(false)} />
        }
        return (
            <React.Fragment>
                <Annotation
                    truncatedHighlightText={this.getHighlightText()}
                    truncatedAnnotationText={this.getAnnotationText()}
                    showMoreHighlight={this.renderShowButton('highlight')}
                    showMoreAnnotation={this.renderShowButton('annotation')}
                    annotationEditMode={this.state.annotationEditMode}
                    tagClasses={this.deriveTagsClass()}
                    tags={this.state.tags}
                    dateDetails={this.getDateDetails()}
                    renderAnnotationInput={this.renderAnnotationInput}
                    renderFooter={this.renderFooter}
                    goToAnnotation={goToAnnotation(annotation)}
                    isIFrame={this.deriveIsIFrame()}
                    shouldCommentBoxBeVisible={this.shouldCommentBoxBeVisible()}
                    isJustComment={this.deriveIsJustComment()}
                    onMouseEnter={this.props.onMouseEnter(
                        this.props.annotation,
                    )}
                    onMouseLeave={this.props.onMouseLeave}
                    isHovered={this.props.isHovered}
                    isActive={this.props.isActive}
                    id={this.props.annotation.url}
                />{' '}
                {this.state.crowdfunding &&
                    this.props.env === 'overview' && (
                        <CrowdfundingModal
                            onClose={this.setCrowdfunding(false)}
                            context="annotations"
                        />
                    )}{' '}
            </React.Fragment>
        )
    }
}

export default AnnotationContainer

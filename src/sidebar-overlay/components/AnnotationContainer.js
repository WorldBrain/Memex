import React from 'react'
import PropTypes from 'prop-types'
import moment from 'moment'

import Annotation from './Annotation'
import styles from './Annotation.css'

class AnnotationContainer extends React.Component {
    static propTypes = {
        annotation: PropTypes.object.isRequired,
        deleteAnnotation: PropTypes.func.isRequired,
        editAnnotation: PropTypes.func.isRequired,
        openAnnotationURL: PropTypes.func,
    }

    state = {
        truncated: {},

        annotationText: '',
        annotationEditMode: false,

        containsTags: false,

        footerState: 'default',
    }

    componentDidMount() {
        const { annotation } = this.props
        const truncated = {}
        let annotationText = ''
        let containsTags = false

        if (annotation.body)
            truncated.highlight = this.getTruncatedObject(annotation.body)

        if (annotation.comment) {
            truncated.annotation = this.getTruncatedObject(annotation.comment)
            annotationText = annotation.comment
        }

        if (annotation.tags && annotation.tags.length) containsTags = true

        this.setState({
            truncated,
            annotationText,
            containsTags,
        })
    }

    getTruncatedObject = text => {
        if (text.length > 280) {
            const truncatedText = text.slice(0, 280) + ' [..]'
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
        const { pageUrl, url } = this.props.annotation
        this.setFooterState('default')
        this.props.deleteAnnotation({ pageUrl, url })
    }

    handleEditAnnotation = e => {
        e.preventDefault()
        e.stopPropagation()
        const { pageUrl, url, comment } = this.props.annotation
        const { annotationText } = this.state

        if (annotationText === comment) return

        this.props.editAnnotation({ pageUrl, url, comment: annotationText })
        this.toggleEditAnnotation()
    }

    renderTimestamp = () => {
        const { footerState } = this.state
        const createdWhen = new Date(this.props.annotation.createdWhen)

        const timestamp = moment(createdWhen).format('MMMM D YYYY')

        return (
            <div className={styles.timestamp}>
                {footerState === 'default' ? timestamp : ''}
            </div>
        )
    }

    renderFooterIcons = () => {
        const goToUrl = this.props.openAnnotationURL(this.props.annotation.url)
        return (
            <div className={styles.footerAside}>
                <span
                    className={styles.trashIcon}
                    onClick={this.setFooterState('delete')}
                />
                <span
                    className={styles.editIcon}
                    onClick={this.toggleEditAnnotation}
                />
                <span className={styles.goToPageIcon} onClick={goToUrl} />
            </div>
        )
    }

    renderEditButtons = () => {
        return (
            <div className={styles.footerAside}>
                <span
                    className={styles.footerText}
                    onClick={this.toggleEditAnnotation}
                >
                    Cancel
                </span>
                <span
                    className={styles.footerGreenText}
                    onClick={this.handleEditAnnotation}
                >
                    Save
                </span>
            </div>
        )
    }

    renderDeleteButtons = () => {
        return (
            <div className={styles.footerAside}>
                <span
                    className={styles.footerGreenText}
                    onClick={this.handleDeleteAnnotation}
                >
                    Yes
                </span>
                <span
                    className={styles.footerText}
                    onClick={this.setFooterState('default')}
                >
                    Cancel
                </span>
            </div>
        )
    }

    renderTagPills = () => {
        const { tags } = this.props.annotation
        if (!tags) return
        return tags.map((tag, i) => (
            <span key={i} className={styles.tagPill}>
                {tag}
            </span>
        ))
    }

    findFooterRenderer(state) {
        if (state === 'default') return this.renderFooterIcons()
        else if (state === 'edit') return this.renderEditButtons()
        else if (state === 'delete') return this.renderDeleteButtons()
    }

    renderFooter = () => {
        const { footerState } = this.state
        return (
            <div className={styles.footer}>
                {this.renderTimestamp()}
                {this.findFooterRenderer(footerState)}
            </div>
        )
    }

    toggleState = stateName => () => {
        const toggled = !this.state[stateName]
        this.setState({
            [stateName]: toggled,
        })
    }

    toggleTruncation = name => () => {
        const truncated = { ...this.state.truncated }
        truncated[name].isTruncated = !truncated[name].isTruncated

        this.setState({
            truncated,
        })
    }

    setFooterState = footerState => () =>
        this.setState({
            footerState,
        })

    toggleEditAnnotation = () => {
        this.toggleState('annotationEditMode')()
        if (this.state.footerState === 'edit') this.setFooterState('default')()
        else this.setFooterState('edit')()
    }

    renderShowButton = name => {
        const { truncated } = this.state
        if (truncated[name]) {
            return (
                <div
                    className={styles.showMore}
                    onClick={this.toggleTruncation(name)}
                >
                    Show{' '}
                    {this.state.truncated[name].isTruncated ? 'more' : 'less'}
                </div>
            )
        }
        return null
    }

    renderHighlight = () => {
        const { truncated } = this.state
        if (truncated.highlight && truncated.highlight.isTruncated)
            return truncated.highlight.text
        else return this.props.annotation.body
    }

    renderAnnotation = () => {
        const { truncated, annotationEditMode } = this.state
        if (annotationEditMode) return ''
        if (truncated.annotation && truncated.annotation.isTruncated)
            return truncated.annotation.text
        else return this.props.annotation.comment
    }

    renderAnnotationInput = () => {
        if (this.state.annotationEditMode)
            return (
                <div className={styles.annotationInput}>
                    <textarea
                        rows="5"
                        cols="20"
                        className={styles.annotationTextarea}
                        value={this.state.annotationText}
                        onChange={this.handleChange}
                    />
                    <input
                        type="text"
                        className={styles.tagsInput}
                        placeholder="Add tags"
                    />
                </div>
            )
        return null
    }

    deriveTagsClass = () =>
        this.state.containsTags ? styles.tagsContainer : ''

    render() {
        return (
            <Annotation
                renderHighlight={this.renderHighlight}
                renderShowButton={this.renderShowButton}
                renderAnnotation={this.renderAnnotation}
                annotationEditMode={this.state.annotationEditMode}
                deriveTagsClass={this.deriveTagsClass}
                renderTagPills={this.renderTagPills}
                renderAnnotationInput={this.renderAnnotationInput}
                renderFooter={this.renderFooter}
            />
        )
    }
}

export default AnnotationContainer

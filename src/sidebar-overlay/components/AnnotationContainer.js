import React from 'react'
import PropTypes from 'prop-types'
import moment from 'moment'
import { remoteFunction } from '../../util/webextensionRPC'

import Annotation from './Annotation'
import styles from './Annotation.css'
import { IndexDropdown } from '../../common-ui/containers'

class AnnotationContainer extends React.Component {
    static propTypes = {
        annotation: PropTypes.object.isRequired,
        deleteAnnotation: PropTypes.func.isRequired,
        editAnnotation: PropTypes.func.isRequired,
        goToAnnotation: PropTypes.func.isRequired,
        env: PropTypes.string.isRequired,
    }

    state = {
        truncated: {},

        annotationText: '',
        annotationEditMode: false,

        containsTags: false,
        tags: [],

        footerState: 'default',
    }

    async componentDidMount() {
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

        const tags = await remoteFunction('getAnnotationTags')(annotation.url)
        if (tags.length) containsTags = true

        this.setState({
            truncated,
            annotationText,
            containsTags,
            tags,
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
        const { url } = this.props.annotation
        this.setFooterState('default')
        this.props.deleteAnnotation({ url })
    }

    handleEditAnnotation = e => {
        e.preventDefault()
        e.stopPropagation()
        const { url, comment } = this.props.annotation
        const { annotationText } = this.state

        if (annotationText === comment) {
            this.toggleEditAnnotation()
        }

        this.props.editAnnotation({ url, comment: annotationText })
        this.toggleEditAnnotation()
    }

    getTags = () => this.state.tags.map(tag => tag.name)

    renderTimestamp = () => {
        const { footerState } = this.state

        if (footerState !== 'default') {
            return <div className={styles.timestamp} />
        }

        const { createdWhen, lastEdited } = this.props.annotation
        let dateObject
        if (!lastEdited) dateObject = new Date(createdWhen)
        else dateObject = new Date(lastEdited)
        console.log('last ', lastEdited)
        const timestamp = moment(dateObject).format('MMMM D YYYY')

        return (
            <div className={styles.timestamp}>
                {lastEdited ? 'Last edit: ' : null}
                {timestamp}
            </div>
        )
    }

    renderFooterIcons = () => {
        const { annotation, env } = this.props
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
                {env === 'overview' && annotation.body ? (
                    <a href={annotation.url} target="blank">
                        <span className={styles.goToPageIcon} />
                    </a>
                ) : null}
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
        const { tags } = this.state
        if (!tags) return
        return tags.map((tag, i) => (
            <span key={i} className={styles.tagPill}>
                {tag.name}
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
                    <IndexDropdown
                        isForAnnotation
                        url={this.props.annotation.url}
                        initFilters={this.getTags()}
                        onFilterAdd={this.reloadTags}
                        onFilterDel={this.reloadTags}
                        source="tag"
                    />
                </div>
            )
        return null
    }

    deriveTagsClass = () =>
        this.state.containsTags ? styles.tagsContainer : ''

    deriveIsClickable = () => {
        return this.props.env === 'iframe' && this.props.annotation.body !== ''
    }

    render() {
        const { goToAnnotation, annotation } = this.props
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
                goToAnnotation={goToAnnotation(annotation)}
                isClickable={this.deriveIsClickable()}
            />
        )
    }
}

export default AnnotationContainer

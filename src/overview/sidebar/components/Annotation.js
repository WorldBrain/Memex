import React from 'react'
import PropTypes from 'prop-types'

import styles from './Annotation.css'

class Annotation extends React.Component {
    static propTypes = {
        annotation: PropTypes.object.isRequired,
        deleteFn: PropTypes.func.isRequired,
        updateFn: PropTypes.func.isRequired,
    }

    state = {
        truncated: {},

        annotationText: '',
        annotationEditMode: false,

        footerState: 'default',
    }

    componentDidMount() {
        const { annotation } = this.props
        const truncated = {}
        let annotationText = ''

        if (annotation.highlight)
            truncated.highlight = this.getTruncatedObject(annotation.highlight)

        if (annotation.body) {
            truncated.annotation = this.getTruncatedObject(annotation.body)
            annotationText = annotation.body
        }

        this.setState({
            truncated,
            annotationText,
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

    renderTimestamp() {
        const { footerState } = this.state
        return (
            <div className={styles.timestamp}>
                {footerState === 'default' ? 'October 12 2008' : ''}
            </div>
        )
    }

    renderFooterIcons() {
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
                <span className={styles.goToPageIcon} />
            </div>
        )
    }

    renderEditButtons() {
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
                    onClick={this.props.updateFn}
                >
                    Save
                </span>
            </div>
        )
    }

    renderDeleteButtons() {
        return (
            <div className={styles.footerAside}>
                <span
                    className={styles.footerGreenText}
                    onClick={this.props.deleteFn}
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

    findFooterRenderer(state) {
        if (state === 'default') return this.renderFooterIcons()
        else if (state === 'edit') return this.renderEditButtons()
        else if (state === 'delete') return this.renderDeleteButtons()
    }

    renderFooter() {
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

    renderShowButton(name) {
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

    renderHighlight() {
        const { truncated } = this.state
        if (truncated.highlight && truncated.highlight.isTruncated)
            return truncated.highlight.text
        else return this.props.annotation.highlight
    }

    renderAnnotation() {
        const { truncated, annotationEditMode } = this.state
        if (annotationEditMode) return ''
        if (truncated.annotation && truncated.annotation.isTruncated)
            return truncated.annotation.text
        else return this.props.annotation.body
    }

    renderAnnotationInput() {
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

    render() {
        return (
            <div className={styles.container}>
                <div className={styles.highlight}>
                    {this.renderHighlight()}
                    {this.renderShowButton('highlight')}
                </div>

                <div className={styles.annotationText}>
                    {this.renderAnnotation()}
                    {this.state.annotationEditMode
                        ? null
                        : this.renderShowButton('annotation')}
                </div>

                {this.renderAnnotationInput()}

                <div className={styles.footer}>{this.renderFooter()}</div>
            </div>
        )
    }
}

export default Annotation

import React from 'react'
import PropTypes from 'prop-types'

import styles from './Annotation.css'

class Annotation extends React.Component {
    static propTypes = {
        annotation: PropTypes.object,
    }

    state = {
        truncated: false,
        truncatedText: '',

        annotationText: '',
        annotationEditMode: false,

        footerState: 'default',
    }

    componentDidMount() {
        const { annotation } = this.props

        if (annotation.highlight.length > 280) {
            const truncatedText = annotation.highlight.slice(0, 280) + ' [..]'
            this.setState({
                truncatedText,
                truncated: true,
            })
        }

        if (annotation.body) {
            this.setState({
                annotationText: annotation.body,
            })
        }
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
                    className={styles.icon}
                    onClick={this.toggleEditAnnotation}
                >
                    x
                </span>
                <span className={styles.icon}>x</span>
                <span className={styles.icon}>x</span>
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
                <span className={styles.footerGreenText}>Save</span>
            </div>
        )
    }

    findFooterRenderer(state) {
        if (state === 'default') return this.renderFooterIcons()
        else if (state === 'edit') return this.renderEditButtons()
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

    setFooterState = footerState => () =>
        this.setState({
            footerState,
        })

    toggleEditAnnotation = () => {
        this.toggleState('annotationEditMode')()
        if (this.state.footerState === 'edit') this.setFooterState('default')()
        else this.setFooterState('edit')()
    }

    renderShowButton() {
        if (this.state.truncatedText) {
            return (
                <div className={styles.showMore} onClick={this.toggleTruncate}>
                    Show {this.state.truncated ? 'more' : 'less'}
                </div>
            )
        }
        return null
    }

    renderHighlight() {
        if (this.state.truncated) return this.state.truncatedText
        else return this.props.annotation.highlight
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
                    {this.renderShowButton()}
                </div>

                {this.renderAnnotationInput()}

                <div className={styles.footer}>{this.renderFooter()}</div>
            </div>
        )
    }
}

export default Annotation

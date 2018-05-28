import React from 'react'
import PropTypes from 'prop-types'

import styles from './annotation.css'

class Annotation extends React.Component {
    static propTypes = {
        annotation: PropTypes.object,
    }

    state = {
        truncated: false,
        truncatedText: '',
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
    }

    renderTimestamp() {
        return <div className={styles.timestamp}>Oct 12, 2008</div>
    }

    renderFooterIcons() {
        return (
            <div className={styles.footerAside}>
                <span className={styles.icon}>x</span>
                <span className={styles.icon}>x</span>
                <span className={styles.icon}>x</span>
            </div>
        )
    }

    toggleTruncate = () => {
        const truncated = !this.state.truncated
        this.setState({
            truncated,
        })
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

    render() {
        return (
            <div className={styles.container}>
                <div className={styles.body}>{this.renderHighlight()}</div>
                {this.renderShowButton()}
                <div className={styles.footer}>
                    {this.renderTimestamp()}
                    {this.renderFooterInfo()}
                </div>
            </div>
        )
    }
}

export default Annotation

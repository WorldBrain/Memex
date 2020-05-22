import * as React from 'react'

import { Anchor } from 'src/highlighting/types'

const localStyles = require('./truncated-text-renderer.css')
const styles = require('./annotation-box/annotation-box.css')

interface Props {
    anchor: Anchor
    truncateHighlight: boolean
    setTruncateHighlight: (value: boolean) => void
}

class AnnotationHighlight extends React.Component<Props> {
    /**
     * Method that decides whether a highlight is too long.
     */
    private _isHighlightLong = () => {
        return this.props.anchor.quote.length > 280
    }

    /**
     * Gets the text to be displayed from the highlight.
     * Returns full text if the text is not too long or if
     * `truncateHighlight` param is false, else returns
     * truncated text.
     */
    private _getHighlightText = () => {
        const { anchor } = this.props
        const { truncateHighlight } = this.props

        const highlight = anchor.quote
        if (this._isHighlightLong() && truncateHighlight) {
            const truncatedText = highlight.slice(0, 280) + ' [...]'
            return truncatedText
        }
        return highlight
    }

    private _toggleHighlightTruncation = () => {
        this.props.setTruncateHighlight(!this.props.truncateHighlight)
    }

    render() {
        const { truncateHighlight } = this.props

        return (
            <div className={styles.highlight}>
                <div className={styles.newAnnotation}>New Annotation</div>
                <span className={styles.highlightText}>
                    {this._getHighlightText()}
                    {this._isHighlightLong() && (
                        <button
                            className={localStyles.showMoreBtn}
                            onClick={this._toggleHighlightTruncation}
                        />
                    )}
                </span>
            </div>
        )
    }
}

export default AnnotationHighlight

import * as React from 'react'
import cx from 'classnames'

import { Anchor } from 'src/direct-linking/content_script/interactions'

const styles = require('./annotation-highlight.css')

interface Props {
    anchor: Anchor
}

interface State {
    truncateHighlight: boolean
}

class AnnotationHighlight extends React.Component<Props, State> {
    state = {
        truncateHighlight: true,
    }

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
        const { truncateHighlight } = this.state

        const highlight = anchor.quote
        if (this._isHighlightLong() && truncateHighlight) {
            const truncatedText = highlight.slice(0, 280) + ' [...]'
            return truncatedText
        }
        return highlight
    }

    private _toggleHighlightTruncation = () => {
        this.setState(prevState => ({
            truncateHighlight: !prevState.truncateHighlight,
        }))
    }

    render() {
        const { truncateHighlight } = this.state

        return (
            <div className={styles.highlighted}>
                <div className={styles.newAnnotation}>New Annotation</div>
                <div className={styles.highlightedText}>
                    "{this._getHighlightText()}"
                    {this._isHighlightLong() && (
                        <span
                            className={cx(styles.showMoreBtn, {
                                [styles.rotated]: !truncateHighlight,
                            })}
                            onClick={this._toggleHighlightTruncation}
                        />
                    )}
                </div>
            </div>
        )
    }
}

export default AnnotationHighlight

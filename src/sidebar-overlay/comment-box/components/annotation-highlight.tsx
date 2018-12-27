import * as React from 'react'
import cx from 'classnames'

import { Anchor } from '../../../direct-linking/content_script/interactions'

const styles = require('./annotation-highlight.css')

interface Props {
    anchor: Anchor
    truncateHighlight: boolean
    toggleHighlightTruncation: any
}

/**
 * Method that decides whether a highlight is too long.
 */
const isHighlightLong = (anchor: Anchor) => {
    return anchor.quote.length > 280
}

/**
 * Gets the text to be displayed from the highlight.
 * Returns full text if the text is not too long or if
 * `truncateHighlight` param is false, else returns
 * truncated text.
 */
const getHighlightText = (anchor: Anchor, truncateHighlight: boolean) => {
    const highlight = anchor.quote
    if (isHighlightLong(anchor) && truncateHighlight) {
        const truncatedText = highlight.slice(0, 280) + ' [...]'
        return truncatedText
    }
    return highlight
}

/* tslint:disable-next-line variable-name */
const AnnotationHighlight = ({
    anchor,
    truncateHighlight,
    toggleHighlightTruncation,
}: Props) => (
    <div className={styles.highlighted}>
        <div className={styles.newAnnotation}>New Annotation</div>
        <div className={styles.highlightedText}>
            "{getHighlightText(anchor, truncateHighlight)}"
            {isHighlightLong(anchor) && (
                <span
                    className={cx(styles.showMoreBtn, {
                        [styles.rotated]: !truncateHighlight,
                    })}
                    onClick={toggleHighlightTruncation}
                />
            )}
        </div>
    </div>
)

export default AnnotationHighlight

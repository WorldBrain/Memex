import React from 'react'

const styles = require('./tooltip.css')

/**
 * React component which gets rendered for 'search-bar' tooltip
 * in overview.
 */
const searchBarTooltip: React.SFC = () => (
    <div>
        Search with any word you remember from a website you've seen before
        <p className={styles.subInfo}>
            Make sure you visited some, or{' '}
            <a target="_blank" href="#import">
                imported your existing history
            </a>
        </p>
    </div>
)

export default searchBarTooltip

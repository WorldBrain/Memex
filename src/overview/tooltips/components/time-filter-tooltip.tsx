import React from 'react'

const styles = require('./tooltip.css')

const timeFilterTooltip: React.SFC = () => (
    <React.Fragment>
        Filter by time
        <br />
        <br />
        <span className={styles.emoji}>🤓</span>
        <span className={styles.proTip}>PRO Tip: </span>
        <span className={styles.noBold}>try </span>
        <span className={styles.example}>e.g. "1 hour ago"</span>
    </React.Fragment>
)

export default timeFilterTooltip

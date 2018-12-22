import React from 'react'

const styles = require('./tooltip.css')

const timeFilterTooltip: React.SFC = () => (
    <React.Fragment>
        After when did you visit it?
        <br />
        <br />
        <span className={styles.emoji}>🤓</span>
        PRO Tip: <span className={styles.noBold}>TYPE TIME</span>
        <p className={styles.example}>eg: "1 hour ago"</p>
    </React.Fragment>
)

export default timeFilterTooltip

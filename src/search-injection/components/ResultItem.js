import React from 'react'
import PropTypes from 'prop-types'
import niceTime from 'src/util/nice-time'

import styles from './ResultItem.css'

const ResultItem = props => {
    return (
        <div className={styles.result}>
            <a className={styles.title} href={props.url} target="_blank">
                {props.content.title}
            </a>
            <p className={styles.url}>{props.url}</p>
            <div className={styles.displayTime}>
                {' '}
                {niceTime(+props.displayTime)}{' '}
            </div>
        </div>
    )
}

ResultItem.propTypes = {
    displayTime: PropTypes.string.isRequired,
    url: PropTypes.string.isRequired,
    content: PropTypes.object.isRequired,
}
export default ResultItem

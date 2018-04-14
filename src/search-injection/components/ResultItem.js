import React from 'react'
import PropTypes from 'prop-types'
import niceTime from 'src/util/nice-time'
import classNames from 'classnames'

import styles from './ResultItem.css'

const ResultItem = props => (
    <div className={classNames(styles.result, styles[props.searchEngine])}>
        <a
            className={styles.title}
            href={props.url}
            onClick={props.onLinkClick}
            target="_blank"
        >
            {props.title}
        </a>
        <p className={styles.url}>{props.url}</p>
        <div className={styles.displayTime}>
            {' '}
            {niceTime(+props.displayTime)}{' '}
        </div>
    </div>
)

ResultItem.propTypes = {
    searchEngine: PropTypes.string.isRequired,
    displayTime: PropTypes.number.isRequired,
    url: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    onLinkClick: PropTypes.func.isRequired,
}
export default ResultItem

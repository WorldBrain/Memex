import React from 'react'
import PropTypes from 'prop-types'
import niceTime from 'src/util/nice-time'
import { matchURL } from '../utils'
import classNames from 'classnames'

import styles from './ResultItem.css'

const ResultItem = props => {
    const searchEngine = matchURL(location.href)
    return (
        <div className={classNames(styles.result, styles[searchEngine])}>
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
                {niceTime(props.displayTime)}{' '}
            </div>
        </div>
    )
}

ResultItem.propTypes = {
    displayTime: PropTypes.number.isRequired,
    url: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    onLinkClick: PropTypes.func.isRequired,
}
export default ResultItem

import React from 'react'
import PropTypes from 'prop-types'
import niceTime from 'src/util/nice-time'
import classNames from 'classnames'

import styles from './ResultItem.css'

const ResultItem = props => (
    <div className={classNames(styles.rootContainer, styles[props.searchEngine])}>
        <a
            className={styles.root}
            href={props.url}
            target="_blank"
            onClick={props.onLinkClick}
        >
            <div className={styles.infoContainer}> 
                <div className={styles.firstlineContainer}>
                        <span className={styles.Title}>
                        {props.title}
                        </span>
                </div>
                <div className={styles.url}>{props.url}</div>
                
                <div className={styles.detailsContainer}>
                    <div className={styles.detailsBox}>
                        <div className={styles.displayTime}>
                            {' '}
                            {niceTime(props.displayTime)}{' '}
                        </div>
                    </div>
                </div>
            </div>
        </a>
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

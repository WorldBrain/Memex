import React from 'react'
import PropTypes from 'prop-types'
import niceTime from 'src/util/nice-time'

import styles from './ResultItem.css'

const ResultItem = props => {
    return (
        <div>
            <a className="root" href={props.url} target="_blank">
                {props.content.title}
            </a>
            <div className="descriptionContainer">
                <div className={styles.url}>{props.url}</div>
                <div className="time">
                    <div className={styles.displayTime}>
                        {' '}
                        {niceTime(+props.displayTime)}{' '}
                    </div>
                </div>
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

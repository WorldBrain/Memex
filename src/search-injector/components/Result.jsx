import React from 'react'
import PropTypes from 'prop-types'

import niceTime from 'src/util/nice-time'

import styles from './Result.css'

const Result = props => (
    <li className={styles.wrapper}>
        <a className={styles.anchorTag} href={props.url} target="_blank">
            <div className={styles.resultItems}>
                <div>
                    <h3 className={styles.title}>
                        {' '}
                        {props.title || props.content.title}
                    </h3>
                    <span className={styles.externalUrl}>{props.url}</span>
                    <div className={styles.displayTime}>
                        {' '}
                        {niceTime(+props.displayTime)}{' '}
                    </div>
                </div>
            </div>
        </a>
    </li>
)

Result.propTypes = {
    displayTime: PropTypes.string.isRequired,
    url: PropTypes.string.isRequired,
    title: PropTypes.string,
    content: PropTypes.object.isRequired,
}

export default Result

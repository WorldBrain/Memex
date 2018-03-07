import React from 'react'
import PropTypes from 'prop-types'
import styles from './RemovedText.css'

const RemovedText = props => {
    return (
        <div className={styles.removed}>
            <p className={styles.removedP}>
                You have removed Memex results but you can always enable them
                from your settings.
            </p>
            <a onClick={props.undo} className={styles.removedA}>
                UNDO
            </a>
        </div>
    )
}

RemovedText.propTypes = {
    undo: PropTypes.func.isRequired,
}

export default RemovedText

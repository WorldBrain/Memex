import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import styles from './RemovedText.css'

const RemovedText = props => {
    return (
        <div
            className={classNames(
                styles.removed,
                styles[`removed-${props.position}`],
            )}
        >
            <p
                className={classNames(
                    styles.removedP,
                    styles[`removedP-${props.position}`],
                )}
            >
                You can always enable this feature again via the settings.
            </p>
            <a
                onClick={props.undo}
                className={classNames(
                    styles.removedA,
                    styles[`removedA-${props.position}`],
                )}
            >
                UNDO
            </a>
        </div>
    )
}

RemovedText.propTypes = {
    undo: PropTypes.func.isRequired,
    position: PropTypes.string.isRequired,
}

export default RemovedText

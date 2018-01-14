import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import styles from './Button.css'

const getIconStyles = isPaused =>
    classNames({
        [styles.customIcon]: true,
        [styles.playIcon]: isPaused,
        [styles.pauseIcon]: !isPaused,
    })

const HistoryPauser = ({
    onConfirm,
    value,
    onChange,
    isPaused,
    children,
    ...selectProps
}) => (
    <div className={classNames(styles.item, styles.itemDropdown)}>
        <div
            className={classNames(getIconStyles(isPaused))}
            onClick={onConfirm}
        />
        {isPaused ? (
            'Indexing paused'
        ) : (
            <div>
                Pause indexing for
                <select
                    className={styles.dropdown}
                    value={value}
                    onChange={onChange}
                    {...selectProps}
                >
                    {children}
                </select>
                mins
            </div>
        )}
    </div>
)

HistoryPauser.propTypes = {
    children: PropTypes.arrayOf(PropTypes.node).isRequired,
    onConfirm: PropTypes.func.isRequired,
    onChange: PropTypes.func.isRequired,
    value: PropTypes.number.isRequired,
    isPaused: PropTypes.bool.isRequired,
}

export default HistoryPauser

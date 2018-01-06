import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import styles from './Button.css'

const getIconStyles = isPaused =>
    classNames({
        'material-icons': true,
        [styles.clickableIcon]: true,
        [styles.clickableIconNeg]: !isPaused,
    })
const getIcon = isPaused =>
    isPaused ? 'play_circle_outline' : 'pause_circle_outline'

const HistoryPauser = ({
    onConfirm,
    value,
    onChange,
    isPaused,
    children,
    ...selectProps
}) => (
    <div className={classNames(styles.item, styles.itemDropdown)}>
        <i className={getIconStyles(isPaused)} onClick={onConfirm}>
            {getIcon(isPaused)}
        </i>
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

import React from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'

import styles from './Filters.css'

const FilterPill = ({ value, onClick = f => f, isExclusive = false }) => (
    <span
        className={cx(styles.pillContainer, {
            [styles.isExclusive]: isExclusive,
        })}
    >
        <div className={styles.pillSecondaryContainer}>
            <span
                className={cx(styles.tagname, {
                    [styles.notExpanded]: true,
                })}
                title={value}
            >
                {value}
            </span>
            <span className={styles.closeIcon}>
                <i className="material-icons" onClick={onClick}>
                    clear
                </i>
            </span>
        </div>
    </span>
)

FilterPill.propTypes = {
    value: PropTypes.string.isRequired,
    onClick: PropTypes.func,
    isExclusive: PropTypes.bool,
}

export default FilterPill

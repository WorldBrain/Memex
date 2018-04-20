import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import localStyles from './Filters.css'

const getTagClass = () =>
    classNames(localStyles.tagname, {
        [localStyles.notExpanded]: true,
    })

const FilterPill = ({ value, onClick = f => f }) => (
    <span className={localStyles.pillContainer}>
        <div className={localStyles.pillSecondaryContainer}>
            <span className={getTagClass()} title={value}>
                {value}
            </span>
            <span className={localStyles.closeIcon}>
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
}

export default FilterPill

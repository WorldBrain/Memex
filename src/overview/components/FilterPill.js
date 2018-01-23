import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import localStyles from './Filters.css'

const getTagClass = noBg =>
    classNames(localStyles.tagname, {
        [localStyles.notExpanded]: !noBg,
    })

const FilterPill = ({ value, noBg = false, onClick = f => f, setRef }) => (
    <span className={localStyles.pillContainer}>
        <span
            ref={setRef}
            className={getTagClass(noBg)}
            onClick={noBg ? onClick : null}
        >
            {value}
        </span>
        <span className={localStyles.closeIcon}>
            {!noBg && (
                <i className="material-icons" onClick={onClick}>
                    clear
                </i>
            )}
        </span>
    </span>
)

FilterPill.propTypes = {
    value: PropTypes.string.isRequired,
    onClick: PropTypes.func,
    noBg: PropTypes.bool,
    setRef: PropTypes.func,
}

export default FilterPill

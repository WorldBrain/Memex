import React from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'

import localStyles from './Tags.css'

const TagRow = ({ value, active, onClick, focused = false }) => (
    <div
        className={cx(localStyles.menuItem, {
            [localStyles.menuItemFocused]: focused,
        })}
        onClick={onClick}
    >
        {value}
        {active && <i className="material-icons">done</i>}
    </div>
)

TagRow.propTypes = {
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.element])
        .isRequired,
    active: PropTypes.bool,
    onClick: PropTypes.func.isRequired,
    focused: PropTypes.bool,
}

export default TagRow

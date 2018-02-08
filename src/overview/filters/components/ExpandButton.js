import React from 'react'
import PropTypes from 'prop-types'

import localStyles from './Filters.css'

const ExpandButton = ({ value, onClick = f => f, setRef }) => (
    <span ref={setRef} className={localStyles.expandButton} onClick={onClick}>
        {value}
    </span>
)

ExpandButton.propTypes = {
    value: PropTypes.string.isRequired,
    onClick: PropTypes.func,
    setRef: PropTypes.func,
}

export default ExpandButton

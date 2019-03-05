import React from 'react'
import PropTypes from 'prop-types'

import IndexDropdownRow from './IndexDropdownRow'
import localStyles from './IndexDropdown.css'

const IndexDropdownNewRow = ({ value, ...props }) => (
    <IndexDropdownRow
        {...props}
        value={
            <React.Fragment>
                <span className={localStyles.bold}>add new: </span><span className={localStyles.value}>{value}</span>
            </React.Fragment>
        }
    />
)

IndexDropdownNewRow.propTypes = {
    value: PropTypes.string.isRequired,
}

export default IndexDropdownNewRow

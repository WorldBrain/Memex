import React from 'react'
import PropTypes from 'prop-types'

import IndexDropdownRow from './IndexDropdownRow'

const IndexDropdownNewRow = ({ value, isNew = true, ...props }) => (
    <IndexDropdownRow
        {...props}
        value={
            <React.Fragment>
                <span>{value}</span>
            </React.Fragment>
        }
        isNew
    />
)

IndexDropdownNewRow.propTypes = {
    value: PropTypes.string.isRequired,
    isNew: PropTypes.bool,
}

export default IndexDropdownNewRow

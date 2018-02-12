import React from 'react'
import PropTypes from 'prop-types'

import IndexDropdownRow from './IndexDropdownRow'
import Wrapper from './Wrapper'
import localStyles from './IndexDropdown.css'

const IndexDropdownNewRow = ({ value, ...props }) => (
    <IndexDropdownRow
        {...props}
        value={
            <Wrapper>
                <span className={localStyles.bold}>add new: </span> {value}
            </Wrapper>
        }
    />
)

IndexDropdownNewRow.propTypes = {
    value: PropTypes.string.isRequired,
}

export default IndexDropdownNewRow

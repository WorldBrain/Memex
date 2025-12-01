import React from 'react'
import PropTypes from 'prop-types'

const FilterBar = ({ filter, onBarClick }) => (
    <div>
        <div onClick={onBarClick}>
            <span> {`${filter}s`} </span>
            <span />
        </div>
    </div>
)

FilterBar.propTypes = {
    filter: PropTypes.string.isRequired,
    onBarClick: PropTypes.func,
}

export default FilterBar

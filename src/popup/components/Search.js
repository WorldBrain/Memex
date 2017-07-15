import React from 'react'
import PropTypes from 'prop-types'

const Search = ({ onSearchEnter, onSearchChange, searchValue }) => (
    <form className='popup-search-container'>
        <i className='material-icons'>search</i>
        <input
            className='popup-search'
            name='query'
            placeholder='Search your memory'
            onKeyDown={onSearchEnter}
            onChange={onSearchChange}
            value={searchValue}
        />
    </form>
)

Search.propTypes = {
    onSearchEnter: PropTypes.func.isRequired,
    onSearchChange: PropTypes.func.isRequired,
    searchValue: PropTypes.string.isRequired,
}

export default Search

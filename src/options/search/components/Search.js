import React from 'react'
import PropTypes from 'prop-types'

const Search = ({
    children, searchVal, onSearchChange, onSingleSearchClick, onDestroyClick,
    onMultiSearchClick, onSearchSizeClick, onStreamSearchClick,
}) => (
    <div>
        <label htmlFor='test-search'>search-index</label>
        <input
            id='test-search'
            type='text'
            value={searchVal}
            onChange={onSearchChange}
        />
        <button onClick={onSingleSearchClick}>Find one</button>
        <button onClick={onMultiSearchClick}>Find many</button>
        <button onClick={onStreamSearchClick}>Find streamed</button>
        <button onClick={onSearchSizeClick}>Check index size</button>
        <button onClick={onDestroyClick}>Destroy index</button>
        <ul>
            {children}
        </ul>
    </div>
)

Search.propTypes = {
    searchVal: PropTypes.string.isRequired,
    onSearchChange: PropTypes.func.isRequired,
    onSingleSearchClick: PropTypes.func.isRequired,
    onMultiSearchClick: PropTypes.func.isRequired,
    onSearchSizeClick: PropTypes.func.isRequired,
    onStreamSearchClick: PropTypes.func.isRequired,
    onDestroyClick: PropTypes.func.isRequired,
    children: PropTypes.arrayOf(PropTypes.node).isRequired,
}

export default Search

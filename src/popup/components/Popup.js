import React from 'react'
import PropTypes from 'prop-types'

import Search from './Search'

const Popup = ({ children, ...searchProps }) => (
    <div className='popup'>
        <Search {...searchProps} />
        {children}
    </div>
)

Popup.propTypes = {
    children: PropTypes.arrayOf(PropTypes.element).isRequired,
}

export default Popup

import React from 'react'
import PropTypes from 'prop-types'

import TestDataUpload from './TestDataUpload'

const DevOptions = ({ devMode, toggleDevMode, ...uploadProps }) => (
    <div>
        <input type='checkbox' id='devModeCheckbox' onChange={toggleDevMode} checked={devMode} />
        <label htmlFor='devModeCheckbox'>Enable dev mode</label>

        {devMode && <TestDataUpload {...uploadProps} />}
    </div>
)

DevOptions.propTypes = {
    devMode: PropTypes.bool.isRequired,
    toggleDevMode: PropTypes.func.isRequired,
}

export default DevOptions

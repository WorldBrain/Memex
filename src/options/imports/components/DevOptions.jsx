import React from 'react'
import PropTypes from 'prop-types'

import { LoadingIndicator } from 'src/common-ui/components'

const DevOptions = ({ devMode, isRestoring, toggleDevMode }) => (
    <div>
        <input type='checkbox' id='devModeCheckbox' onChange={toggleDevMode} checked={devMode} />
        <label htmlFor='devModeCheckbox'>Enable dev mode</label>
    </div>
)

DevOptions.propTypes = {
    devMode: PropTypes.bool.isRequired,
    isRestoring: PropTypes.bool.isRequired,
    toggleDevMode: PropTypes.func.isRequired,
}

export default DevOptions

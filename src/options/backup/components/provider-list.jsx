import React from 'react'
import PropTypes from 'prop-types'

export function ProviderList({ onChange }) {
    return (
        <div>
            <label>
                <input type="radio" onChange={() => onChange('google-drive')} />
                <strong style={{ cursor: 'pointer' }}>Google Drive</strong>
            </label>
            <br />
            <input type="radio" disabled />
            Dropbox
            <br />
            <input type="radio" disabled />
            Self hosting
        </div>
    )
}

ProviderList.propTypes = {
    onChange: PropTypes.func.isRequired,
}

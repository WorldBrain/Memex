import React from 'react'
import PropTypes from 'prop-types'
import Styles from './provider-list.css'

export function ProviderList({ onChange }) {
    return (
        <div>
            <label>
                <input type="radio" onChange={() => onChange('google-drive')} />
                <span style={{ cursor: 'pointer' }}>
                    <img className={Styles.logo} src={'img/google-drive.png'} />
                    <span className={Styles.name}>Google Drive</span>
                </span>
            </label>
            <br />
            <input type="radio" disabled />
            <span className={Styles.disabled}>Dropbox</span>
            <br />
            <input type="radio" disabled />
            <span className={Styles.disabled}>Self hosting</span>
        </div>
    )
}

ProviderList.propTypes = {
    onChange: PropTypes.func.isRequired,
}

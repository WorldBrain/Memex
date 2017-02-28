import React from 'react'
import { Link } from 'react-router'

import { routeTitle } from '../../base.css'

class SettingsContainer extends React.Component {
    render() {
        return (
            <div>
                <h1 className={routeTitle}>Settings</h1>
                <p>Settings specific components to come in here.</p>
            </div>
        )
    }
}

export default SettingsContainer

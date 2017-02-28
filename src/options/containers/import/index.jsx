import React from 'react'
import { Link } from 'react-router'

import { routeTitle } from '../../base.css'

class ImportContainer extends React.Component {
    render() {
        return (
            <div>
                <h1 className={routeTitle}>Import</h1>
                <p>Import specific components to come in here.</p>
            </div>
        )
    }
}

export default ImportContainer

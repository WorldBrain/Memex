import React from 'react';
import { Link } from 'react-router';

class SettingsContainer extends React.Component {
    render() {
        return (
            <div>
                <p>Hey, I'm the settings page!</p>
                <Link to="/import">Import</Link>
            </div>
        );
    }
}

export default SettingsContainer;
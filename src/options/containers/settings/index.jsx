import React from 'react';
import { Link } from 'react-router';

import PageTitle from '../../components/page-title';

class SettingsContainer extends React.Component {
    render() {
        return (
            <div>
                <PageTitle title="Settings" />
                <p>Settings specific components to come in here.</p>
            </div>
        );
    }
}

export default SettingsContainer;

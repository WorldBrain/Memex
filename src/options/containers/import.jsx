import React from 'react';
import { Link } from 'react-router';

class ImportContainer extends React.Component {
    render() {
        return (
            <div>
                <p>Hey, I'm the imports page!</p>
                <Link to="/settings">Settings</Link>
            </div>
        );
    }
}

export default ImportContainer;
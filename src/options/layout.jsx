import React, { PropTypes } from 'react';
import Navigation from './components/navigation';

class Layout extends React.Component {
    render() {
        return (
            <div>
                <Navigation currentLocation={this.props.location} />
                { this.props.children }
            </div>
        );
    }
}

Layout.propTypes = {
    location: PropTypes.object.isRequired,
    children: PropTypes.object.isRequired
};

export default Layout;

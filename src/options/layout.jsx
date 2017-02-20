import React, { PropTypes } from 'react'
import Navigation from './components/navigation'
import Routes from './routes'
import styles from './styles'

class Layout extends React.Component {
    render() {
        return (
            <div style={styles.root}>
                <Navigation currentLocation={this.props.location} routes={Routes} />
                <div style={styles.route}>
                    { this.props.children }
                </div>
            </div>
        )
    }
}

Layout.propTypes = {
    location: PropTypes.object.isRequired,
    children: PropTypes.object.isRequired
}

export default Layout

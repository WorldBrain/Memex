import React, { PropTypes } from 'react';
import { Link } from 'react-router';

import routes from './routes';
import styles from './styles';

const Navigation = ({ currentLocation }) => {
    function buildRoutes() {
        return routes.map((route, idx) => {
            return (
                <li style={styles.navItem} key={idx}>
                    <Link style={styles.navLink(isActive(route))} to={route.pathname}>{route.name}</Link>
                </li>
            );
        });
    }

    function isActive(route) {
        return currentLocation.pathname === route.pathname;
    }

    return (
        <nav style={styles.root}>
            <h1 style={styles.title}>Web Memex</h1>
            
            <ul style={styles.nav}>
                { buildRoutes() }
            </ul>
        </nav>
    );
}

Navigation.propTypes = {
    currentLocation: PropTypes.object.isRequired
};

export default Navigation;

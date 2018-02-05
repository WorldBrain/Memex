import React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router'
import styles from './styles.css'

const SubNavLink = ({ route = {} }) => {
    return (
        <li>
            {route.subLink && (
                <div className={styles.importSubItems}>
                    <Link className={styles.subLink} to={route.pathname}>
                        {' '}
                        {route.name}
                    </Link>
                </div>
            )}
        </li>
    )
}

SubNavLink.propTypes = {
    route: PropTypes.object.isRequired,
}

export default SubNavLink

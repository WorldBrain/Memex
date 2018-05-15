import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router'
import cx from 'classnames'

import { OutLink } from 'src/common-ui/containers'
import styles from './styles.css'

class NavLink extends PureComponent {
    static propTypes = {
        name: PropTypes.string.isRequired,
        icon: PropTypes.string.isRequired,
        pathname: PropTypes.string.isRequired,
        isActive: PropTypes.bool,
        isExternal: PropTypes.bool,
    }

    get LinkComponent() {
        return this.props.isExternal ? OutLink : Link
    }

    navClasses = () =>
        cx(styles.navLink, { [styles.isActive]: this.props.isActive })

    render() {
        return (
            <li>
                <div className={this.navClasses()}>
                    <i className={cx(styles.navIcon, 'material-icons')}>
                        {this.props.icon}
                    </i>
                    <this.LinkComponent
                        className={this.navClasses()}
                        to={this.props.pathname}
                    >
                        {this.props.name}
                    </this.LinkComponent>
                </div>
            </li>
        )
    }
}

export default NavLink

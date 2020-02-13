import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router'
import cx from 'classnames'

import { OutLink } from 'src/common-ui/containers'
import styles from './styles.css'
import icons from 'src/common-ui/icons.css'

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
            <li className={styles.listElements}>
                <this.LinkComponent
                    className={this.navClasses()}
                    to={this.props.pathname}
                >
                    <span
                        className={cx(icons.standardMenu, {
                            [icons.searchGreyIcon]:
                                this.props.icon === 'search',
                            [icons.settingsIcon]:
                                this.props.icon === 'settings',
                            [icons.importIcon]: this.props.icon === 'import',
                            [icons.backupIcon]: this.props.icon === 'backup',
                            [icons.syncIcon]: this.props.icon === 'sync',
                            [icons.blockIcon]: this.props.icon === 'block',
                            [icons.privacyIcon]: this.props.icon === 'privacy',
                            [icons.teamIcon]: this.props.icon === 'team',
                            [icons.helpIcon]: this.props.icon === 'help',
                            [icons.tutorialIcon]: this.props.icon === 'info',
                        })}
                    />
                    {this.props.name}
                </this.LinkComponent>
            </li>
        )
    }
}

export default NavLink

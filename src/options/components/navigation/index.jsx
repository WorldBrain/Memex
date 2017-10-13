import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { Link } from 'react-router'
import classNames from 'classnames'
import * as selectors from '../../imports/selectors'
import * as actions from '../../imports/actions'
import styles from './styles.css'
import { bindActionCreators } from 'redux'

class Navigation extends Component {
    constructor(props) {
        super(props)
        this.isActive = this.isActive.bind(this)
        this.buildRoutes = this.buildRoutes.bind(this)
    }

    isActive(route) {
        return this.props.currentLocation.pathname === route.pathname
    }

    buildRoutes() {
        const { routes, isIdle, isRunning, isStopped } = this.props

        return routes.map((route, idx) => {
            const navClasses = classNames({
                [styles.navLink]: true,
                [styles.isActive]: this.isActive(route),
            })

            const navIcon = classNames({
                [styles.navIcon]: true,
                'material-icons': true,
            })

            return (
                <li>
                    <li className={navClasses} key={idx}>
                        <i className={navIcon}>{route.icon}</i>
                        {route.component === 'faq' && (
                            <a
                                className={navClasses}
                                href={route.pathname}
                                target="_blank"
                            >
                                {route.name}
                            </a>
                        )}
                        {route.component !== 'faq' && (
                            <Link className={navClasses} to={route.pathname}>
                                {route.name}
                            </Link>
                        )}
                    </li>
                    {route.name === 'Import' &&
                        this.isActive(route) && (
                            <div className={styles.importSubItems}>
                                <div
                                    className={
                                        isIdle
                                            ? styles.active
                                            : isRunning || isStopped
                                              ? styles.done
                                              : null
                                    }
                                >
                                    1. Analysis
                                </div>
                                <div
                                    className={
                                        isRunning
                                            ? styles.active
                                            : isStopped ? styles.done : null
                                    }
                                >
                                    2. Download Progress
                                </div>
                                <div
                                    className={isStopped ? styles.active : null}
                                >
                                    3. Status Report
                                </div>
                            </div>
                        )}
                </li>
            )
        })
    }

    render() {
        console.log(this.props)
        return (
            <nav className={styles.root}>
                <div className={styles.icon_div}>
                    <img
                        src="/img/worldbrain-logo.png"
                        className={styles.icon}
                    />
                </div>
                <ul className={styles.nav}>{this.buildRoutes()}</ul>
            </nav>
        )
    }
}

Navigation.propTypes = {
    isRunning: PropTypes.bool.isRequired,
    isStopped: PropTypes.bool.isRequired,
    isIdle: PropTypes.bool.isRequired,
    currentLocation: PropTypes.object.isRequired,
    routes: PropTypes.array.isRequired,
}

const mapStateToProps = state => ({
    isRunning: selectors.isRunning(state),
    isPaused: selectors.isPaused(state),
    isStopped: selectors.isStopped(state),
    isLoading: selectors.isLoading(state),
    isIdle: selectors.isIdle(state),
    isStartBtnDisabled: selectors.isStartBtnDisabled(state),
})

const mapDispatchToProps = dispatch => ({
    boundActions: bindActionCreators(actions, dispatch),
})

export default connect(mapStateToProps, mapDispatchToProps)(Navigation)

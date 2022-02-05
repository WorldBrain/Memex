import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Navigation from './components/navigation'
import routes from './routes'
import Head from './containers/Head'
import styles from './base.css'
import { HelpBtn } from '../overview/help-btn'
import AccountMenu from '../authentication/components/AccountMenu'
import styled from 'styled-components'

class Layout extends Component {
    isActive = (route) => this.props.location.pathname === route.pathname

    render() {
        return (
            <RootContainer>
                <Head />
                <Navigation
                    currentLocation={this.props.location}
                    routes={routes}
                />
                <div className={styles.route}>{this.props.children}</div>
                <AccountMenu />
                <HelpBtn />
            </RootContainer>
        )
    }
}

const RootContainer = styled.div`
    background-color: ${(props) => props.theme.colors.backgroundColor};
    display: flex;
    flex-direction: row;

    & * {
        box-sizing: border-box;
        font-family: 'Inter', sans-serif;
    }
`

Layout.propTypes = {
    location: PropTypes.object.isRequired,
    children: PropTypes.object.isRequired,
}

export default Layout

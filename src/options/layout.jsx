import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Navigation from './components/navigation'
import routes from './routes'
import styles from './base.css'
import { HelpBtn } from '../overview/help-btn'
import AccountMenu from '../authentication/components/AccountMenu'
import styled from 'styled-components'

class Layout extends Component {
    isActive = (route) => this.props.location.pathname === route.pathname

    render() {
        return (
            <RootContainer>
                <Navigation
                    currentLocation={this.props.location}
                    routes={routes}
                >
                    <AccountMenu />
                </Navigation>
                <div className={styles.route}>{this.props.children}</div>
                <HelpBtn />
            </RootContainer>
        )
    }
}

const RootContainer = styled.div`
    background-color: ${(props) => props.theme.colors.black};
    display: flex;
    flex-direction: row;
    min-width: fit-content;

    & * {
        box-sizing: border-box;
        font-family: 'Satoshi', sans-serif;
        font-feature-settings: 'pnum' on, 'lnum' on, 'case' on, 'ss03' on,
            'ss04' on, 'liga' off;
        letter-spacing: 0.8px;
    }
`

Layout.propTypes = {
    location: PropTypes.object.isRequired,
    children: PropTypes.object.isRequired,
}

export default Layout

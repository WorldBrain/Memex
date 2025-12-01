import React from 'react'
import { useLocation, Outlet } from 'react-router-dom'
import PropTypes from 'prop-types'
import Navigation from './components/navigation'
import routes from './routes'
import { HelpBtn } from '../overview/help-btn'
import AccountMenu from '../authentication/components/AccountMenu'
import styled from 'styled-components'

const Layout = () => {
    const location = useLocation()

    const shouldFullScreen =
        location.pathname === '/changelog' || location.pathname === '/feedback'

    return (
        <RootContainer>
            <Navigation currentLocation={location} routes={routes}>
                <AccountMenu />
            </Navigation>
            <div className={shouldFullScreen ? 'fullScreen' : 'route'}>
                <Outlet />
            </div>
            <HelpBtn />
        </RootContainer>
    )
}

const RootContainer = styled.div`
    background-color: ${(props) => props.theme.colors.black};
    display: flex;
    flex-direction: row;
    min-width: fit-content;

    & * {
        box-sizing: border-box;
        font-family: 'Satoshi', sans-serif;
        font-feature-settings:
            'pnum' on,
            'lnum' on,
            'case' on,
            'ss03' on,
            'ss04' on,
            'liga' off;
        letter-spacing: 0.8px;
    }
`

Layout.propTypes = {
    routeData: PropTypes.object,
}

export default Layout

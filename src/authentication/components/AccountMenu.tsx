import React from 'react'
import styled from 'styled-components'
import OverlayMenu from 'src/common-ui/components/design-library/overlay-menu/OverlayMenu'
import { TypographyHeadingBig } from 'src/common-ui/components/design-library/typography'
import { auth } from 'src/util/remote-functions-background'
import { withCurrentUser } from 'src/authentication/components/AuthConnector'
import { LOGIN_URL } from 'src/constants'
import { ButtonSideMenu } from 'src/common-ui/components/design-library/buttons'
import { MemexLogo } from 'src/common-ui/components/MemexLogo'
import { connect } from 'react-redux'
import { show } from 'src/overview/modals/actions'
import { AuthContextInterface } from 'src/authentication/background/types'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import * as icons from 'src/common-ui/components/design-library/icons'

const handleLoginClick = () => {
    window.location.href = LOGIN_URL
}

const handleAccountClick = () => {
    window.location.href = LOGIN_URL
}

const handleLogOutClick = () => {
    window.location.reload()
    return auth.signOut()
}

const AccountMenu = (
    props: AuthContextInterface & { showSubscriptionModal: () => void },
) => {
    if (props.currentUser === null) {
        return (
            <BottomLeft onClick={handleLoginClick}>
                <Icon filePath={icons.login} heightAndWidth="20px" hoverOff />
                <Title>Login to Memex</Title>
            </BottomLeft>
        )
    }

    return (
        <BottomLeft onClick={handleLogOutClick}>
            <Icon filePath={icons.logout} heightAndWidth="16px" hoverOff />
            <Title>Logout from Memex</Title>
        </BottomLeft>
    )
}

const Title = styled.div`
    color: ${(props) => props.theme.colors.normalText};
    font-size: 14px;
    font-weight: 500;
    text-align: left;
    text-decoration: none;
    display: flex;
    justify-content: flex-start;
    width: 100%;
`

const BottomLeft = styled.div`
    display: flex;
    grid-gap: 10px;
    padding: 0 25px;
    height: 50px;
    justify-content: flex-start;
    align-items: center;
    position: fixed;
    bottom: 20px;
    margin: 0 10px;
    border-radius: 5px;
    width: 240px;

    & * {
        cursor: pointer;
    }

    &: hover {
        background-color: ${(props) =>
            props.theme.colors.backgroundColorDarker};
    }
`

export default connect(null, (dispatch) => ({
    showSubscriptionModal: () => dispatch(show({ modalId: 'Subscription' })),
}))(withCurrentUser(AccountMenu))

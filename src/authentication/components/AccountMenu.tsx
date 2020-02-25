import React from 'react'
import styled from 'styled-components'
import OverlayMenu from 'src/common-ui/components/design-library/overlay-menu/OverlayMenu'
import { TypographyHeadingBig } from 'src/common-ui/components/design-library/typography'
import { auth } from 'src/util/remote-functions-background'
import {
    UserProps,
    withCurrentUser,
} from 'src/authentication/components/AuthConnector'
import { LOGIN_URL } from 'src/constants'
import { ButtonSideMenu } from 'src/common-ui/components/design-library/buttons'
import { MemexLogo } from 'src/common-ui/components/MemexLogo'
import { connect } from 'react-redux'
import { show } from 'src/overview/modals/actions'

const handleLoginClick = () => {
    window.location.href = LOGIN_URL
}

const handleAccountClick = () => {
    window.location.href = LOGIN_URL
}

const handleLogOutClick = () => {
    return auth.signOut()
}

const AccountMenu = (
    props: UserProps & { showSubscriptionModal: () => void },
) => {
    if (props.currentUser === null) {
        return (
            <BottomLeft>
                <ButtonSideMenu onClick={handleLoginClick}>
                    <MemexLogo />
                    <TypographyHeadingBig>Login to Memex</TypographyHeadingBig>
                </ButtonSideMenu>
            </BottomLeft>
        )
    }

    return (
        <BottomLeft>
            <OverlayMenu
                menuHeader={
                    <ButtonSideMenu>
                        <MemexLogo />
                        <TypographyHeadingBig>My Account</TypographyHeadingBig>
                    </ButtonSideMenu>
                }
                menuItems={[
                    {
                        label: '⭐️ Upgrade',
                        handler: props.showSubscriptionModal,
                    },
                    { label: 'Account Info', handler: handleAccountClick },
                    { label: 'Log Out', handler: handleLogOutClick },
                ]}
            />
        </BottomLeft>
    )
}

const BottomLeft = styled.div`
    position: fixed;
    bottom: 1.5em;
    display: flex;
    width: 400px;
    min-width: 260px;
`

export default connect(null, dispatch => ({
    showSubscriptionModal: () => dispatch(show({ modalId: 'Subscription' })),
}))(withCurrentUser(AccountMenu))

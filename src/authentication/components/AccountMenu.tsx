import React from 'react'
import styled from 'styled-components'
import OverlayMenu from 'src/common-ui/components/design-library/overlay-menu/OverlayMenu'
import { TypographyHeadingSmall, TypographyHeadingBig } from 'src/common-ui/components/design-library/typography'
import { auth } from 'src/util/remote-functions-background'
import {
    UserProps,
    withCurrentUser,
} from 'src/authentication/components/AuthConnector'
import { LOGIN_URL } from 'src/constants'
import { ButtonSideMenu } from 'src/common-ui/components/design-library/buttons'
import { MemexLogo } from 'src/common-ui/components/MemexLogo'

const handleLoginClick = () => {
    window.location.href = LOGIN_URL
}

const handleLogOutClick = () => {
    return auth.signOut()
}

const AccountMenu = (props: UserProps) => {
    if (props.currentUser === null) {
        return (
            <BottomLeft>
                <ButtonSideMenu onClick={handleLoginClick}>
                    <MemexLogo />
                    <TypographyHeadingBig>
                        Login to Memex
                    </TypographyHeadingBig>
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
                        <TypographyHeadingBig>
                            My Account
                        </TypographyHeadingBig>
                    </ButtonSideMenu>
                }
                menuItems={[
                    { label: 'Account Info', handler: handleLoginClick },
                    { label: 'Log Out', handler: handleLogOutClick },
                ]}
            />
        </BottomLeft>
    )
}

const BottomLeft = styled.div`
    position: fixed;
    bottom: 1.5em;
    max-width: 280px;
    min-width: 260px;
`

export default withCurrentUser(AccountMenu)

import React from 'react'
import styled from 'styled-components'
import OverlayMenu from 'src/common-ui/components/design-library/overlay-menu/OverlayMenu'
import { TypographyHeadingSmall } from 'src/common-ui/components/design-library/typography'
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
                    <TypographyHeadingSmall>
                        Login to Memex
                    </TypographyHeadingSmall>
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
                        <TypographyHeadingSmall>
                            My Account
                        </TypographyHeadingSmall>
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
    left: 0.2em;
    bottom: 1em;
`

export default withCurrentUser(AccountMenu)

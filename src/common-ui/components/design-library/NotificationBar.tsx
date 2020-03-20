import React from 'react'
import styled from 'styled-components'
import { lighten } from 'polished'
import {
    colorDarkText,
    colorBrandMintGreen,
} from 'src/common-ui/components/design-library/colors'

export const NotificationBar = ({
    children,
    onClick,
    onClose,
}: {
    children: any
    onClick: () => void
    onClose: () => void
}) => (
    <NotificationBarWrapper>
        <NotificationBarInner>
            <Flex>
                <NotificationBarTitle>What's new</NotificationBarTitle>
                <NotificationBarLink onClick={onClick}>
                    {children}
                </NotificationBarLink>
            </Flex>
            <Close onClose={onClose}>x</Close>
        </NotificationBarInner>
    </NotificationBarWrapper>
)

const NotificationBarWrapper = styled.div`
    font-family: 'Poppins', sans-seriif;
    background-color: ${lighten(0.3, colorBrandMintGreen)};
    padding: 5px;
    font-size: 0.9375rem; // 15px
    color: ${colorDarkText};
`

const NotificationBarInner = styled.div`
    width: 100%;
    max-width: 800px;
    margin: auto;
    display: flex;
    justify-content: space-between;
`

const NotificationBarTitle = styled.div`
    margin-right: 20px;
`

const NotificationBarLink = styled.div`
    text-decoration: underline;
`

const Flex = styled.div`
    display: flex;
`

const Close = styled.div`
    display: flex;
    justify-self: flex-end;
`

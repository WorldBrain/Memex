import React from 'react'
import styled, { keyframes } from 'styled-components'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'

import { MenuOptions, MenuOption } from '../types'

const styles = require('./help-menu.css')

export interface Props {
    menuOptions: MenuOptions
    extVersion: string
}

export class HelpMenu extends React.PureComponent<Props> {
    private renderFooter() {
        return <FooterText>Memex {this.props.extVersion}</FooterText>
    }

    private renderMenuOption = (
        { text, link, small, icon, top }: MenuOption,
        i: number,
    ) => (
        <MenuItem key={i} order={i} top={top}>
            <Link target="_blank" href={link} top={top}>
                {icon && (
                    <Icon
                        filePath={icon}
                        heightAndWidth="22px"
                        hoverOff
                        color={top ? 'black' : null}
                    />
                )}
                {text}
            </Link>
        </MenuItem>
    )

    private renderSeparator = (val, i: number) => (
        <ItemSeparator key={i} className={styles.menuSeparator} />
    )

    render() {
        return (
            <Container>
                {this.props.menuOptions.map((opt, i) =>
                    opt === '-'
                        ? this.renderSeparator(opt, i)
                        : this.renderMenuOption(opt, i),
                )}
                {this.renderFooter()}
            </Container>
        )
    }
}

const openAnimation = keyframes`
 0% { padding-bottom: 10px; opacity: 0 }
 100% { padding-bottom: 0px; opacity: 1 }
`

const Container = styled.div`
    padding: 15px;
    position: relative;
    width: 250px;
    height: 420px;
`

const MenuItem = styled.div<{ order: number }>`
    animation-name: ${openAnimation};
    animation-delay: ${(props) => props.order * 40}ms;
    animation-duration: 0.2s;
    animation-timing-function: ease-in-out;
    animation-fill-mode: backwards;
    overflow: hidden;
    height: 43px;
    display: flex;
    align-items: center;
    padding-bottom: 0px;

    border-radius: 5px;
    border: none;
    list-style: none;
    background-color: ${(props) => props.top && props.theme.colors.prime1};

    &:hover {
        outline: 1px solid ${(props) => props.theme.colors.greyScale3};
    }
`

const Link = styled.a<{ top }>`
    color: ${(props) =>
        props.top ? props.theme.colors.black : props.theme.colors.white};
    font-weight: ${(props) => (props.top ? '600' : '400')};
    height: 40px;
    padding: 0 10px;
    display: flex;
    align-items: center;
    text-decoration: none;
    font-size: 14px;
    grid-gap: 10px;
`

const ItemSeparator = styled.hr`
    color: ${(props) => props.theme.colors.lightgrey};
`

const FooterText = styled.div`
    height: 20px;
    display: flex;
    font-size: 14px;
    align-items: center;
    font-weight: 300;
    color: ${(props) => props.theme.colors.darkText};
    padding: 5px 10px 0 10px;
    margin-top: 5px;
`

import React from 'react'
import cx from 'classnames'
import * as icons from 'src/common-ui/components/design-library/icons'
import styled from 'styled-components'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import { HoverBox } from 'src/common-ui/components/design-library/HoverBox'

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
        <MenuItem key={i} top={top}>
            <Link target="_blank" href={link} top={top}>
                {icon && (
                    <Icon
                        filePath={icon}
                        heightAndWidth="16px"
                        hoverOff
                        color={top ? 'purple' : null}
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
            <HoverBox
                position={'absolute'}
                right={'20px'}
                bottom={'60px'}
                padding={'10px'}
                width={'240px'}
            >
                {this.props.menuOptions.map((opt, i) =>
                    opt === '-'
                        ? this.renderSeparator(opt, i)
                        : this.renderMenuOption(opt, i),
                )}
                {this.renderFooter()}
            </HoverBox>
        )
    }
}

const MenuItem = styled.div<{ top }>`
    border-radius: 5px;
    border: none;
    list-style: none;
    background-color: ${(props) =>
        props.top && props.theme.colors.backgroundHighlight};

    &:hover {
        background-color: ${(props) =>
            props.theme.colors.backgroundColorDarker};
    }
`

const Link = styled.a<{ top }>`
    color: ${(props) =>
        props.top
            ? props.theme.colors.darkerText
            : props.theme.colors.normalText};
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
    align-items: center;
    font-weight 400;
    color: ${(props) => props.theme.colors.lighterText};
    padding: 5px 10px 0 10px;
    margin-top: 5px;
    border-top: 1px solid ${(props) => props.theme.colors.lightgrey};
`

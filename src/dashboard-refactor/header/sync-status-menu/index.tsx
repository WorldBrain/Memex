import React, { PureComponent } from 'react'
import onClickOutside from 'react-onclickoutside'
import styled, { css } from 'styled-components'
import moment from 'moment'

import styles, { fonts } from 'src/dashboard-refactor/styles'
import colors from 'src/dashboard-refactor/colors'
import { RootState } from './types'
import { HoverBox } from 'src/common-ui/components/design-library/HoverBox'
import { SyncStatusIcon } from './sync-status-icon'
import Margin from 'src/dashboard-refactor/components/Margin'
import type { SyncStatusIconState } from '../types'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'
import { ColorThemeKeys } from '@worldbrain/memex-common/lib/common-ui/styles/types'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'

export const timeSinceNowToString = (date: Date | null): string => {
    if (date === null) {
        return 'Never'
    }

    const now = moment(new Date())
    const dt = moment(date)
    const seconds = now.diff(dt, 'seconds')
    const minutes = now.diff(dt, 'minutes')
    const hours = now.diff(dt, 'hours')
    const days = now.diff(dt, 'days')
    const years = now.diff(dt, 'years')

    if (seconds < 60) {
        return `${seconds} seconds ago`
    }
    if (minutes < 2) {
        return '1 min ago'
    }
    if (hours < 1) {
        return `${minutes} minutes ago`
    }
    if (hours < 2) {
        return `${hours} hours ago`
    }
    if (days < 1) {
        return `${hours} hours ago`
    }
    if (days < 2) {
        return 'One day ago'
    }
    if (days < 30) {
        return `${days} days ago`
    }
    if (years < 1) {
        return dt.format('MMM Do')
    }
    return dt.format('ll')
}

export interface SyncStatusMenuProps extends RootState {
    isLoggedIn: boolean
    outsideClickIgnoreClass?: string
    pendingLocalChangeCount: number
    pendingRemoteChangeCount: number
    onLoginClick: React.MouseEventHandler
    onClickOutside: React.MouseEventHandler
    syncStatusIconState: SyncStatusIconState
    onToggleDisplayState: React.MouseEventHandler
}

class SyncStatusMenu extends PureComponent<SyncStatusMenuProps> {
    handleClickOutside = this.props.onClickOutside

    private renderTitleText(): string {
        const { syncStatusIconState, lastSuccessfulSyncDate } = this.props
        if (syncStatusIconState === 'green' && lastSuccessfulSyncDate) {
            return 'Everything is synced'
        }

        if (!lastSuccessfulSyncDate && syncStatusIconState === 'green') {
            return 'Nothing to sync yet'
        }
    }

    private renderLastSyncText(): string {
        const { syncStatusIconState, lastSuccessfulSyncDate } = this.props

        if (new Date(lastSuccessfulSyncDate).getTime() === 0) {
            return null
        }
        if (syncStatusIconState === 'green' && lastSuccessfulSyncDate) {
            return (
                'Last download: ' + timeSinceNowToString(lastSuccessfulSyncDate)
            )
        }
        if (!lastSuccessfulSyncDate && syncStatusIconState === 'green') {
            return 'Save your first page or annotation'
        }
        return 'in progress'
    }

    private renderStatus() {
        const { isLoggedIn, onLoginClick, syncStatusIconState } = this.props

        if (!isLoggedIn) {
            return (
                <RowContainer>
                    <TopBox>
                        <TextBlock color={'normalText'}>
                            You're not logged in
                        </TextBlock>
                        <TextBlockSmall>
                            Sync, sharing and collaboration disabled.
                        </TextBlockSmall>
                        <ActionButton>
                            <PrimaryAction
                                backgroundColor={'purple'}
                                label="Login"
                                onClick={onLoginClick}
                            />
                        </ActionButton>
                    </TopBox>
                </RowContainer>
            )
        }

        if (syncStatusIconState === 'yellow') {
            return (
                <RowContainer>
                    <TopBox>
                        <TextBlock color={'orange'}>
                            Syncing changes...
                        </TextBlock>
                    </TopBox>
                </RowContainer>
            )
        }

        if (syncStatusIconState === 'red') {
            return (
                <RowContainer>
                    <TopBox>
                        <TextBlock color={'warning'}>
                            There was an error
                        </TextBlock>
                        <TextBlockSmall>Please contact support</TextBlockSmall>
                        <ActionButton>
                            <PrimaryAction
                                label="support@memex.garden"
                                onClick={() =>
                                    window.open('mailto:support@memex.garden')
                                }
                            />
                        </ActionButton>
                    </TopBox>
                </RowContainer>
            )
        }

        if (syncStatusIconState === 'green') {
            return (
                <RowContainer>
                    <TopBox>
                        <TextBlock color={'purple'}>
                            {this.renderTitleText()}
                        </TextBlock>
                        {new Date(this.props.lastSuccessfulSyncDate).getTime() >
                            0 && (
                            <TextBlockSmall>
                                {this.renderLastSyncText()}
                            </TextBlockSmall>
                        )}
                    </TopBox>
                </RowContainer>
            )
        }

        return (
            <RowContainer>
                <Row>
                    <LoadingBox>
                        <LoadingIndicator />
                    </LoadingBox>
                </Row>
            </RowContainer>
        )
    }

    render() {
        const {
            isDisplayed,
            pendingLocalChangeCount,
            pendingRemoteChangeCount,
        } = this.props

        if (!isDisplayed) {
            return null
        }

        return (
            <StyledHoverBox
                padding={'5px 0px 10px 0px'}
                width="min-content"
                right="50px"
                top="40px"
            >
                {this.renderStatus()}
                <Separator />
                <RowContainer>
                    <Row>
                        <InfoText> pending local changes</InfoText>
                        <SectionCircle>
                            {pendingLocalChangeCount < 0
                                ? 0
                                : pendingLocalChangeCount}
                        </SectionCircle>
                        {/* This is a hack to make sure we don't show negative numbers but it'll hide some problems away */}
                    </Row>
                    {/*
                    TODO: Re-implement this
                    <Row>
                        <SectionCircle>
                            {pendingRemoteChangeCount < 0
                                ? 0
                                : pendingRemoteChangeCount}
                        </SectionCircle>
                        <InfoText> pending remote changes</InfoText>
                    </Row> */}
                </RowContainer>
                <Separator />
                <BottomRow>
                    <HelpTextBlock> Report sync problems:</HelpTextBlock>
                    <HelpTextBlockLink
                        target="_blank"
                        href="https://worldbrain.io/faq/new-sync"
                    >
                        {' '}
                        Forum
                    </HelpTextBlockLink>
                    <HelpTextBlockLink
                        target="_blank"
                        href="mailto:support@worldbrain.io"
                    >
                        {' '}
                        Email
                    </HelpTextBlockLink>
                </BottomRow>
            </StyledHoverBox>
        )
    }
}

export default onClickOutside(SyncStatusMenu)

const LoadingBox = styled.div`
    height: 100px;
    width: fill-available;
    display: flex;
    justify-content: center;
    align-items: center;
`

const ExternalLink = styled.a`
    color: ${(props) => props.theme.colors.purple};
    text-decoration: none;
`

const StyledHoverBox = styled(HoverBox)`
    height: min-content;
    width: min-content;
    min-width: 270px;
    flex-direction: column;
    overflow: hidden;
`

const Separator = styled.div`
    border-bottom: 1px solid ${(props) => props.theme.colors.lineGrey};
`

const TopBox = styled(Margin)`
    height: min-content;
    display: flex;
    align-items: flex-start;
    justify-content: flex-start;
    grid-auto-flow: row;
    grid-gap: 10px;
    flex-direction: column;
    padding: 5px 10px;
    width: fill-available;

    & > div {
        width: 100%;
    }
`

const Row = styled(Margin)`
    height: min-content;
    display: grid;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    grid-auto-flow: column;
    height: 30px;
    grid-gap: 10px;
    padding: 0 10px;
    width: fill-available;

    &:first-child {
        height: fit-content;
    }

    &:last-child {
        margin-bottom: 0px;
    }
`

const BottomRow = styled.div`
    padding: 15px 10px 5px 20px;
    display: flex;
    justify-content: flex-start;
    cursor: pointer;
`

const RowContainer = styled.div`
    height: max-content;
    width: fill-available;
    display: flex;
    flex-direction: column;
    padding: 10px;
`

const Count = styled.span`
    font-weight: ${fonts.primary.weight.bold};
    padding-left: 5px;
`

const textStyles = `
    font-family: ${fonts.primary.name};
    color: ${colors.fonts.primary};
`

const SectionCircle = styled.div`
    background: ${(props) => props.theme.colors.lightHover};
    border-radius: 6px;
    height: 20px;
    width: fit-content;
    font-weight: bold;
    display: flex;
    padding: 0 8px;
    justify-content: center;
    align-items: center;
    color: ${(props) => props.theme.colors.normalText};
`

const TextBlock = styled.div<{
    bold: boolean
    color: ColorThemeKeys
}>`
    font-size: 14px;
    line-height: 15px;
    display: flex;
    align-items: center;
    text-align: center;
    color: ${(props) => props.theme.colors.normalText};
    font-weight: bold;
    color: ${(props) => props.theme.colors[props.color]};
    width: 100%;
`

const InfoText = styled.div`
    color: ${(props) => props.theme.colors.normalText};
    font-size: 14px;
    height: 20px;
    font-weight: 300;
    white-space: nowrap;
`

const HelpTextBlock = styled.span<{
    bold: boolean
}>`
    height: 18px;
    font-weight: 300;
    font-size: 12px;
    line-height: 15px;
    display: flex;
    align-items: center;
    color: ${(props) => props.theme.colors.greyScale8};
    text-decoration: none;
    white-space: nowrap;
`

const HelpTextBlockLink = styled.a<{
    bold: boolean
}>`
    height: 18px;
    ${textStyles}
    font-size: 12px;
    line-height: 15px;
    display: flex;
    align-items: center;
    color: ${colors.midGrey};
    padding-left: 5px;
`

const TextBlockSmall = styled.div`
    font-weight: 300;
    color: ${(props) => props.theme.colors.greyScale8};
    font-size: 14px;
    line-height: 16px;
    text-align: left;
    white-space: nowrap;
`

const ActionButton = styled.div`
    margin-top: 10px;
`

const TextContainer = styled.div`
    flex-direction: column;
    display: flex;
    align-items: flex-start;
    grid-gap: 5px;
    padding-left: 5px;
`

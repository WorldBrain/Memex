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
import { PrimaryAction } from 'src/common-ui/components/design-library/actions/PrimaryAction'

const StyledHoverBox = styled(HoverBox)`
    height: min-content;
    width: 270px;
    background-color: ${colors.white};
    flex-direction: column;
    overflow: hidden;
`

const Separator = styled.div`
    border-bottom: 1px solid ${(props) => props.theme.colors.lightgrey};
`

const TopBox = styled(Margin)`
    height: min-content;
    display: grid;
    align-items: center;
    justify-content: center;
    grid-auto-flow: row;
    grid-gap: 15px;
    flex-direction: column;
`

const Row = styled(Margin)`
    height: min-content;
    display: grid;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    grid-auto-flow: column;
    height: 30px;
    grid-gap: 10px;
    padding: 0 10px;

    &:first-child {
        height: fit-content;
    }

    &:last-child {
        margin-bottom: 0px;
    }
`

const BottomRow = styled.div`
    padding: 10px 10px 5px 10px;
    display: flex;
    justify-content: center;
    cursor: pointer;
}
`

const RowContainer = styled.div`
    height: max-content;
    width: fill-available;
    display: flex;
    flex-direction: column;
    padding: 15px;
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
    background: ${(props) => props.theme.colors.backgroundHighlight};
    border-radius: 100px;
    height: 20px;
    width: fit-content;
    font-weight: bold;
    display: flex;
    padding: 0 8px;
    justify-content: center;
    align-items: center;
    color: ${(props) => props.theme.colors.purple};
`

const TextBlock = styled.div<{
    bold: boolean
}>`
    font-size: 14px;
    line-height: 15px;
    display: grid;
    align-items: center;
    text-align: center;
    color: ${(props) => props.theme.colors.darkerText};

    ${(props) =>
        css`
            font-weight: ${props.bold
                ? fonts.primary.weight.bold
                : fonts.primary.weight.normal};
        `}
`

const InfoText = styled.div`
    color: ${(props) => props.theme.colors.lighterText};
    font-size: 14px;
    height: 20px;
`

const HelpTextBlock = styled.span<{
    bold: boolean
}>`
    height: 18px;
    ${textStyles}
    font-size: 12px;
    line-height: 15px;
    display: flex;
    align-items: center;
    color: ${colors.midGrey};
    text-decoration: none;
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
    font-weight: ${fonts.primary.weight.normal};
    color: ${(props) => props.theme.colors.lighterText};
    font-size: 14px;
    line-height: 16px;
    text-align: left;
`

const TextContainer = styled.div`
    flex-direction: column;
    display: flex;
    align-items: flex-start;
    grid-gap: 5px;
    padding-left: 5px;
`

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
    isCloudEnabled: boolean
    outsideClickIgnoreClass?: string
    pendingLocalChangeCount: number
    pendingRemoteChangeCount: number
    onLoginClick: React.MouseEventHandler
    onMigrateClick: React.MouseEventHandler
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

        return 'Syncing changes...'
    }

    private renderLastSyncText(): string {
        const { syncStatusIconState, lastSuccessfulSyncDate } = this.props

        console.log(new Date(lastSuccessfulSyncDate).getTime())

        if (new Date(lastSuccessfulSyncDate).getTime() === 0) {
            return null
        }
        if (syncStatusIconState === 'green' && lastSuccessfulSyncDate) {
            return 'Last sync: ' + timeSinceNowToString(lastSuccessfulSyncDate)
        }
        if (!lastSuccessfulSyncDate && syncStatusIconState === 'green') {
            return 'Save your first page or annotation'
        }
        return 'in progress'
    }

    private renderStatus() {
        const {
            isLoggedIn,
            isCloudEnabled,
            onLoginClick,
            onMigrateClick,
            syncStatusIconState,
        } = this.props

        if (!isLoggedIn) {
            return (
                <RowContainer>
                    <TopBox>
                        <TextBlock bold>
                            You're logged out and not syncing
                        </TextBlock>
                        <PrimaryAction label="Login" onClick={onLoginClick} />
                    </TopBox>
                </RowContainer>
            )
        }

        if (!isCloudEnabled) {
            return (
                <RowContainer>
                    <TopBox>
                        <TextBlock bold>
                            You haven't migrated to Memex Cloud
                        </TextBlock>
                        <PrimaryAction
                            label="Migrate"
                            onClick={onMigrateClick}
                        />
                    </TopBox>
                </RowContainer>
            )
        }

        return (
            <RowContainer>
                <Row>
                    <SyncStatusIcon color={syncStatusIconState} />
                    <TextContainer>
                        <TextBlock bold>{this.renderTitleText()}</TextBlock>
                        {new Date(this.props.lastSuccessfulSyncDate).getTime() >
                            0 && (
                            <TextBlockSmall>
                                {this.renderLastSyncText()}
                            </TextBlockSmall>
                        )}
                    </TextContainer>
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
            <StyledHoverBox width="min-content" right="50px" top="65px">
                {this.renderStatus()}
                <Separator />
                <RowContainer>
                    <Row>
                        <SectionCircle>
                            {pendingLocalChangeCount < 0
                                ? 0
                                : pendingLocalChangeCount}
                        </SectionCircle>
                        {/* This is a hack to make sure we don't show negative numbers but it'll hide some problems away */}
                        <InfoText> pending local changes</InfoText>
                    </Row>
                    <Row>
                        <SectionCircle>
                            {pendingRemoteChangeCount < 0
                                ? 0
                                : pendingRemoteChangeCount}
                        </SectionCircle>
                        <InfoText> pending remote changes</InfoText>
                    </Row>
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

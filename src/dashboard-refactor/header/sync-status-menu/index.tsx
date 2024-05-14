import React, { PureComponent } from 'react'
import styled from 'styled-components'

import { fonts } from 'src/dashboard-refactor/styles'
import colors from 'src/dashboard-refactor/colors'
import { RootState } from './types'
import Margin from 'src/dashboard-refactor/components/Margin'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'
import { ColorThemeKeys } from '@worldbrain/memex-common/lib/common-ui/styles/types'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'
import {
    diffTimestamp,
    formatTimestamp,
} from '@worldbrain/memex-common/lib/utils/date-time'
import checkBrowser from 'src/util/check-browser'
import { Browser } from 'webextension-polyfill'

export const timeSinceNowToString = (date: Date | null): string => {
    if (date === null) {
        return 'Never'
    }
    const timestamp = date.getTime()

    const now = Date.now()
    const seconds = diffTimestamp(now, timestamp, 'seconds')
    const minutes = diffTimestamp(now, timestamp, 'minutes')
    const hours = diffTimestamp(now, timestamp, 'hours')
    const days = diffTimestamp(now, timestamp, 'days')
    const years = diffTimestamp(now, timestamp, 'years')

    if (seconds === 0) {
        return `Just now`
    }
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
        return formatTimestamp(timestamp, 'MMM Do')
    }
    return formatTimestamp(timestamp, 'll')
}

export interface SyncStatusMenuProps extends RootState {
    isLoggedIn: boolean
    outsideClickIgnoreClass?: string
    pendingLocalChangeCount: number
    pendingRemoteChangeCount: number
    onLoginClick: React.MouseEventHandler
    syncStatusIconState?: any
    getRootElement: () => HTMLElement
    onToggleDisplayState?: () => void
    syncNow: (preventUpdateStats: boolean) => void
    browserAPIs: Browser
}

class SyncStatusMenu extends PureComponent<SyncStatusMenuProps> {
    private renderTitleText(): string {
        const { syncStatusIconState, lastSuccessfulSyncDate } = this.props
        if (syncStatusIconState === 'green' && lastSuccessfulSyncDate) {
            return 'Everything is synced'
        }

        if (!lastSuccessfulSyncDate && syncStatusIconState === 'green') {
            return 'Nothing to sync yet'
        }
    }

    state = {
        ShowBraveSyncNotif: false,
    }

    async componentDidMount(): Promise<void> {
        if (checkBrowser() === 'brave') {
            const cachedSetting = await this.props.browserAPIs.storage.local.get(
                'ShowBraveSyncNotif',
            )
            const cachedValue = cachedSetting['ShowBraveSyncNotif']
            let showNotif = true

            // Check if cachedSetting is an empty object
            if (Object.keys(cachedSetting).length > 0) {
                showNotif = cachedValue
            }
            this.setState({ ['ShowBraveSyncNotif']: showNotif })
            await this.props.browserAPIs.storage.local.set({
                ShowBraveSyncNotif: showNotif,
            })
        }
    }

    private renderLastSyncText(): string {
        const { syncStatusIconState, lastSuccessfulSyncDate } = this.props

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
        const { isLoggedIn, onLoginClick, syncStatusIconState } = this.props

        if (!isLoggedIn) {
            return (
                <RowContainer>
                    <TopBox>
                        <TextBlock color={'white'}>
                            You're not logged in
                        </TextBlock>
                        <TextBlockSmall>
                            Sync, sharing and collaboration disabled.
                        </TextBlockSmall>
                        <ActionButton>
                            <PrimaryAction
                                backgroundColor={'prime1'}
                                label="Login"
                                onClick={onLoginClick}
                                size={'medium'}
                                fullWidth
                                type={'secondary'}
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
                            There was an error.
                        </TextBlock>
                        <TextBlockSmall>Contact support</TextBlockSmall>
                        <ActionButton>
                            <PrimaryAction
                                label="support@memex.garden"
                                onClick={() =>
                                    window.open('mailto:support@memex.garden')
                                }
                                size={'small'}
                                icon={'mail'}
                                fullWidth
                                type={'secondary'}
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
                        <TextBlock color={'prime1'}>
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
                        <LoadingIndicator size={30} />
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
            <Container>
                {this.renderStatus()}
                <Separator />
                <RowContainer>
                    <Row>
                        <InfoText> pending uploads</InfoText>
                        {pendingLocalChangeCount == null ? (
                            <LoadingIndicator size={14} />
                        ) : (
                            <SectionCircle>
                                {pendingLocalChangeCount}
                            </SectionCircle>
                        )}
                        {/* This is a hack to make sure we don't show negative numbers but it'll hide some problems away */}
                    </Row>

                    {/* TODO: Re-implement this */}
                    {this.props.syncStatusIconState !== 'yellow' &&
                    this.props.syncStatusIconState !== 'red' ? (
                        <Row>
                            <InfoText> pending downloads</InfoText>
                            {pendingRemoteChangeCount == null ? (
                                <LoadingIndicator size={14} />
                            ) : (
                                <SectionCircle>
                                    {pendingRemoteChangeCount}
                                </SectionCircle>
                            )}
                        </Row>
                    ) : null}
                </RowContainer>
                <Separator />
                <BottomRow>
                    {this.props.syncStatusIconState === 'green' && (
                        <PrimaryAction
                            label="Sync Now"
                            onClick={() => this.props.syncNow(true)}
                            size={'medium'}
                            icon={'reload'}
                            fullWidth
                            type={'primary'}
                        />
                    )}
                    <ReportProblemRow>
                        <HelpTextBlock> Report sync problems:</HelpTextBlock>
                        <HelpTextBlockLink
                            target="_blank"
                            href="https://memex.featurebase.app/"
                        >
                            {' '}
                            Forum
                        </HelpTextBlockLink>
                        <HelpTextBlockLink
                            target="_blank"
                            href="mailto:support@memex.garden"
                        >
                            {' '}
                            Email
                        </HelpTextBlockLink>
                    </ReportProblemRow>
                </BottomRow>
                {checkBrowser() === 'brave' && this.state.ShowBraveSyncNotif && (
                    <>
                        <Separator />
                        <BraveBlockInfo>
                            <strong>
                                (Near)-live-sync disabled by default on Brave
                            </strong>
                            Falls back to sync ever 60min
                            <br />
                            1. Go to{' '}
                            <BraveBlockInfoLink
                                onClick={() =>
                                    this.props.browserAPIs.tabs.create({
                                        url: 'brave://settings/privacy',
                                    })
                                }
                            >
                                brave://settings/privacy{' '}
                            </BraveBlockInfoLink>
                            <br />
                            2. enable "Use Google services for push messaging"
                            <br />
                            3. Create new sync update on other devices
                        </BraveBlockInfo>
                        <RemoveButtonContainer>
                            <PrimaryAction
                                type={'glass'}
                                icon={'removeX'}
                                size="small"
                                onClick={async () => {
                                    this.setState({ ShowBraveSyncNotif: false })
                                    await this.props.browserAPIs.storage.local.set(
                                        {
                                            ShowBraveSyncNotif: false,
                                        },
                                    )
                                }}
                                width="fill-available"
                                label="Remove Notice"
                            />
                        </RemoveButtonContainer>
                    </>
                )}
            </Container>
        )
    }
}

export default SyncStatusMenu

const LoadingBox = styled.div`
    height: 100px;
    width: fill-available;
    display: flex;
    justify-content: center;
    align-items: center;
`

const ExternalLink = styled.a`
    color: ${(props) => props.theme.colors.prime1};
    text-decoration: none;
`

const Container = styled.div`
    width: 350px;
`

const Separator = styled.div`
    border-bottom: 1px solid ${(props) => props.theme.colors.greyScale2};
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
    display: flex;
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
    padding: 15px 10px 15px 15px;
    display: flex;
    justify-content: flex-start;
    flex-direction: column;
    grid-gap: 10px;
    cursor: pointer;
`

const ReportProblemRow = styled.div`
    display: flex;
    justify-content: center;
    cursor: pointer;
    width: 100%;
    box-sizing: border-box;
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
    background: ${(props) => props.theme.colors.greyScale3};
    border-radius: 6px;
    height: 20px;
    width: fit-content;
    font-weight: bold;
    display: flex;
    padding: 0 8px;
    justify-content: center;
    align-items: center;
    color: ${(props) => props.theme.colors.white};
`

const TextBlock = styled.div<{
    bold?: boolean
    color?: ColorThemeKeys | 'orange'
}>`
    font-size: 14px;
    line-height: 15px;
    display: flex;
    align-items: center;
    text-align: center;
    color: ${(props) => props.theme.colors.white};
    font-weight: bold;
    color: ${(props) => props.theme.colors[props.color]};
    width: 100%;
`

const InfoText = styled.div`
    color: ${(props) => props.theme.colors.white};
    font-size: 14px;
    height: 20px;
    font-weight: 300;
    white-space: nowrap;
`

const BraveBlockInfo = styled.span<{
    bold?: boolean
    wrap?: boolean
}>`
    font-weight: 400;
    font-size: 14px;
    padding: 15px;
    line-height: 20x;
    position: relative;
    display: flex;
    grid-gap: 5px;
    align-items: flex-start;
    text-decoration: none;
    flex-direction: column;

    color: ${(props) => props.theme.colors.greyScale6};
    strong {
        color: ${(props) => props.theme.colors.warning};
    }
`

const BraveBlockInfoLink = styled.a<{
    bold?: boolean
}>`
    font-size: inherit;
    font-size: 13px;
    display: contents;
    align-items: center;
    padding-left: 5px;
    padding-right: 5px;
    color: ${(props) => props.theme.colors.prime1};
`
const HelpTextBlock = styled.span<{
    bold?: boolean
    wrap?: boolean
}>`
    font-weight: 300;
    font-size: 13px;
    line-height: 15px;
    display: flex;
    align-items: center;
    color: ${(props) => props.theme.colors.greyScale5};
    text-decoration: none;
    white-space: ${(props) => (props.wrap ? 'wrap' : 'nowrap')};
`

const HelpTextBlockLink = styled.a<{
    bold?: boolean
}>`
    font-size: inherit;
    font-size: 13px;
    display: flex;
    align-items: center;
    padding-left: 5px;
    padding-right: 5px;
    color: ${(props) => props.theme.colors.prime1};
`

const TextBlockSmall = styled.div`
    font-weight: 300;
    color: ${(props) => props.theme.colors.greyScale5};
    font-size: 14px;
    text-align: left;
    white-space: pre-wrap;
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
const RemoveButtonContainer = styled.div`
    padding: 10px;
`

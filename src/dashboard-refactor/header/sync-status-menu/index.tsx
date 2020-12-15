import React, { PureComponent } from 'react'
import styled, { css } from 'styled-components'
import moment, { MomentInput } from 'moment'

import styles, { fonts } from 'src/dashboard-refactor/styles'
import colors from 'src/dashboard-refactor/colors'

import { LoadingIndicator } from 'src/common-ui/components'
import { Icon } from 'src/dashboard-refactor/styled-components'

import { BackupState, SyncState, UnSyncedItemState } from './types'
import { DisplayState, HoverState } from 'src/dashboard-refactor/types'

const Container = styled.div<{
    isDisplayed: boolean
}>`
    height: min-content;
    width: 183px;
    padding: 7px;
    background-color: ${colors.white};
    display: ${(props) => (props.isDisplayed ? 'flex' : 'none')};
    flex-direction: column;
    box-shadow: ${styles.boxShadow.overlayElement};
`

const Row = styled.div`
    height: min-content;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
`

const RowContainer = styled.div`
    height: max-content;
    width: 100%;
    padding-top: 5px;
    padding-bottom: 5px;
    padding-left: 10px;
    padding-right: 10px;
    display: flex;
    flex-direction: column;
`

const NotificationBox = styled(RowContainer)`
    height: 32px;
    padding: 0 !important;
    justify-content: center;
    align-items: center;
    background-color: ${colors.error.pink};
    box-shadow: ${styles.boxShadow.overlayElement};
    border-radius: ${styles.borderRadius.medium};
`

const IconContainer = styled(Icon)<{
    disabled: boolean
}>`
    padding-right: 10px;
    ${(props) =>
        props.disabled &&
        css`
            opacity: 0.5;
        `}
    ${(props) =>
        !props.disabled &&
        css`
            cursor: pointer;
        `}
`

const textStyles = `
    font-family: ${fonts.primary.name};
    color: ${colors.fonts.primary};
`

const TextBlock = styled.div<{
    bold: boolean
}>`
    height: 18px;
    ${textStyles}
    font-size: 10px;
    line-height: 15px;
    ${(props) =>
        css`
            font-weight: ${props.bold
                ? fonts.primary.weight.bold
                : fonts.primary.weight.normal};
        `}
`

const TextBlockSmall = styled.div`
    ${textStyles}
    font-weight: ${fonts.primary.weight.bold};
    font-size: 8px;
    line-height: 12px;
    text-align: center;
`

const StyledAnchor = styled.a`
    color: ${colors.fonts.secondary};
    text-decoration: none;
`

export interface SyncStatusMenuProps {
    displayState: DisplayState
    syncState: SyncState
    backupState: BackupState
    lastSuccessfulSyncDateTime: Date
    lastSuccessfulBackupDateTime: Date
    unSyncedItemState: UnSyncedItemState
    syncRunHoverState: HoverState
    backupRunHoverState: HoverState
    onInitiateSync: () => void
    onInitiateBackup: () => void
}

export default class SyncStatusMenu extends PureComponent<SyncStatusMenuProps> {
    private getTimeSinceNowString: any = (inputDate: Date) => {
        const now: MomentInput = moment(new Date())
        const dt: MomentInput = moment(inputDate)
        const seconds: number = now.diff(dt, 'seconds')
        const minutes: number = now.diff(dt, 'minutes')
        const hours: number = now.diff(dt, 'hours')
        const days: number = now.diff(dt, 'days')
        const years: number = now.diff(dt, 'years')
        let str: string
        if (seconds < 60) str = 'Seconds ago'
        if (minutes < 2) str = '1 min ago'
        if (minutes < 15) str = 'Minutes ago'
        if (minutes < 30) str = '15 min ago'
        if (hours < 1) str = '30 min ago'
        if (hours < 2) str = 'An hour ago'
        if (days < 1) str = `${hours} ago`
        if (days < 2) str = 'One day ago'
        if (days < 30) str = `${days} ago`
        if (years < 1) str = dt.format('MMM Do')
        if (years >= 1) str = dt.format('ll')
        return str
    }
    private renderNotificationBox = (
        topSpanContent: JSX.Element | string,
        bottomSpanContent: JSX.Element | string,
    ) => {
        return (
            <Row>
                <NotificationBox>
                    <TextBlockSmall>{topSpanContent}</TextBlockSmall>
                    <TextBlockSmall>{bottomSpanContent}</TextBlockSmall>
                </NotificationBox>
            </Row>
        )
    }
    private renderBackupReminder = () => {
        return this.renderNotificationBox(
            'Memex is an offline app.',
            'Backup your data.',
        )
    }
    private renderError = (syncType: 'sync' | 'backup') => {
        return this.renderNotificationBox(
            `Your last ${syncType} failed.`,
            <span>
                <StyledAnchor href="">Contact Support</StyledAnchor> if retry
                fails too.
            </span>,
        )
    }
    private renderRow = (
        syncType: 'sync' | 'backup',
        status: SyncState | BackupState,
        isSyncRunDisabled: boolean,
        clickHandler: () => void,
    ) => {
        // this function capitalises the first word of the sentence
        const string = syncType.replace(/(^\w{1}|\.\s*\w{1})/gi, function (
            toReplace,
        ) {
            return toReplace.toUpperCase()
        })
        return (
            <div>
                <Row>
                    <RowContainer>
                        <TextBlock bold>{`${string} status`}</TextBlock>
                        <TextBlock>
                            {status === 'disabled' &&
                                (syncType === 'sync'
                                    ? 'No device paired yet'
                                    : 'No backup set yet')}
                            {status === 'enabled' && `${string} enabled`}
                            {status === 'running' && `In progress`}
                            {(status === 'success' || status === 'error') &&
                                `Last ${syncType}: ${this.getTimeSinceNowString(
                                    new Date(),
                                )}`}
                        </TextBlock>
                    </RowContainer>
                    {status === 'running' ? (
                        <LoadingIndicator />
                    ) : (
                        <IconContainer
                            disabled={isSyncRunDisabled}
                            heightAndWidth="15px"
                            path={`/img/${
                                status === 'disabled' ? 'arrowRight' : 'reload'
                            }.svg`}
                            onClick={clickHandler}
                        />
                    )}
                </Row>
                {status === 'error' && this.renderError(syncType)}
            </div>
        )
    }
    render() {
        const {
            displayState: { isDisplayed },
            syncState,
            backupState,
            onInitiateSync,
            onInitiateBackup,
        } = this.props
        return (
            <Container isDisplayed={isDisplayed}>
                {this.renderRow(
                    'sync',
                    syncState,
                    backupState === 'running',
                    onInitiateSync,
                )}
                {this.renderRow(
                    'backup',
                    backupState,
                    syncState === 'running',
                    onInitiateBackup,
                )}
                {backupState === 'disabled' && this.renderBackupReminder()}
            </Container>
        )
    }
}

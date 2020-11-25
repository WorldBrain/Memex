import React, { PureComponent } from 'react'
import { LoadingIndicator } from 'src/common-ui/components'
import colors from 'src/dashboard-refactor/colors'
import Margin from 'src/dashboard-refactor/components/Margin'
import styles, { fonts } from 'src/dashboard-refactor/styles'
import { Icon } from 'src/dashboard-refactor/styled-components'
import styled, { css } from 'styled-components'
import { BackupState, SyncState, UnSyncedItemState } from './types'
import { HoverState } from 'src/dashboard-refactor/types'
import { String } from 'lodash'
import moment, { MomentInput } from 'moment'

const Container = styled.div`
    height: min-content;
    width: 183px;
    background-color: ${colors.white};
    display: flex;
    flex-direction: column;
`

const Row = styled.div`
    height: min-content;
    width: 100%;
    padding: 7px;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
`

const RowContainer = styled.div`
    height: max-content;
    width: max-content;
    display: flex;
    flex-direction: column;
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

const NotificationBox = styled.div`
    height: 32px;
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background-color: ${colors.error.pink};
    box-shadow: ${styles.boxShadow.overlayElement};
    border-radius: ${styles.borderRadius.medium};
`

const TextBlockSmall = styled.div`
    ${textStyles}
    font-weight: ${fonts.primary.weight.bold};
    font-size: 8px;
    line-height: 12px;
    text-align: center;
`

export interface SyncStatusMenuProps {
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
        let str: string
        if (now.diff(dt, 'seconds') < 60) str = 'Seconds ago'
        if (now.diff(dt, 'minutes') < 2) str = '1 min ago'
        if (now.diff(dt, 'minutes') < 15) str = 'Minutes ago'
        if (now.diff(dt, 'minutes') < 30) str = '15 min ago'
        if (now.diff(dt, 'hours') < 1) str = '30 min ago'
        if (now.diff(dt, 'hours') < 2) str = 'An hour ago'
        if (now.diff(dt, 'days') < 1) str = `${now.diff(dt, 'hours')} ago`
        if (now.diff(dt, 'days') < 2) str = 'One day ago'
        if (now.diff(dt, 'days') < 30) str = `${now.diff(dt, 'days')} ago`
        if (now.diff(dt, 'years') < 1) str = dt.format('MMM Do')
        if (now.diff(dt, 'years') >= 1) str = dt.format('ll')
        return str
    }
    private renderNotificationBox = (
        topSpanContent: JSX.Element | string,
        bottomSpanContent: JSX.Element | string,
    ) => {
        return (
            <Row>
                <RowContainer>
                    <NotificationBox>
                        <TextBlockSmall>{topSpanContent}</TextBlockSmall>
                        <TextBlockSmall>{bottomSpanContent}</TextBlockSmall>
                    </NotificationBox>
                </RowContainer>
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
                <a href="">Contact Support</a> if retry fails too.
            </span>,
        )
    }
    private renderRow = (
        syncType: 'sync' | 'backup',
        status: SyncState | BackupState,
        clickHandler: () => void,
    ) => {
        // this function capitalises the first word of the sentence
        const string = syncType.replace(/(^\w{1}|\.\s*\w{1})/gi, function (
            toReplace,
        ) {
            return toReplace.toUpperCase()
        })
        return (
            <Margin horizontal="17px" vertical="12px">
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
                            {status === 'success' &&
                                `Last sync: ${this.getTimeSinceNowString(
                                    new Date(),
                                )}`}
                        </TextBlock>
                    </RowContainer>
                    {status === 'running' ? (
                        <LoadingIndicator />
                    ) : (
                        <Icon
                            heightAndWidth="12px"
                            path={`/img/${
                                status === 'disabled' ? 'arrowRight' : 'reload'
                            }.svg`}
                        />
                    )}
                </Row>
                {status === 'error' && this.renderError(syncType)}
            </Margin>
        )
    }
    render() {
        const {
            syncState,
            backupState,
            onInitiateSync,
            onInitiateBackup,
        } = this.props
        return (
            <Container>
                {this.renderRow('sync', syncState, onInitiateSync)}
                {this.renderRow('backup', backupState, onInitiateBackup)}
                {backupState === 'disabled' && this.renderBackupReminder()}
            </Container>
        )
    }
}

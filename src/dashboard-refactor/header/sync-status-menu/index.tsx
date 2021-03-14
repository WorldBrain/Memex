import React, { PureComponent } from 'react'
import onClickOutside from 'react-onclickoutside'
import styled, { css } from 'styled-components'
import moment from 'moment'

import styles, { fonts } from 'src/dashboard-refactor/styles'
import colors from 'src/dashboard-refactor/colors'

import { LoadingIndicator, ToggleSwitch } from 'src/common-ui/components'
import { Icon } from 'src/dashboard-refactor/styled-components'

import { DisableableState, RootState } from './types'
import { HoverState } from 'src/dashboard-refactor/types'
import { HoverBox } from 'src/common-ui/components/design-library/HoverBox'
import * as icons from 'src/common-ui/components/design-library/icons'
import Margin from 'src/dashboard-refactor/components/Margin'

const StyledHoverBox = styled(HoverBox)`
    height: min-content;
    width: 230px;
    padding: 15px;
    background-color: ${colors.white};
    flex-direction: column;
    box-shadow: ${styles.boxShadow.overlayElement};
`

const Row = styled(Margin)`
    height: min-content;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;

    &:last-child {
        margin-bottom: 0px;
    }
`

const RowContainer = styled.div`
    height: max-content;
    width: 100%;
    display: flex;
    flex-direction: column;
`

const NotificationBox = styled(RowContainer)`
    height: 40px;
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

    &:hover {
        background-color: #e8e8e8;
    }
    border-radius: 3px;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 24px;
    width: 24px;
    background-size: 16px;
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
    font-size: 12px;
    line-height: 15px;
    display: flex;
    align-items: center;

    ${(props) =>
        css`
            font-weight: ${props.bold
                ? fonts.primary.weight.bold
                : fonts.primary.weight.normal};
        `}
`

const TextBlockSmall = styled.div`
    ${textStyles}
    font-weight: ${fonts.primary.weight.normal};
    font-size: 10px;
    line-height: 12px;
    text-align: center;
`

const StyledAnchor = styled.a`
    color: ${colors.fonts.secondary};
    text-decoration: none;
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
    outsideClickIgnoreClass?: string
    goToSyncRoute: () => void
    goToBackupRoute: () => void
    onClickOutside: React.MouseEventHandler
    onInitiateSync: React.MouseEventHandler
    onInitiateBackup: React.MouseEventHandler
    onToggleAutoBackup: React.MouseEventHandler
    onToggleDisplayState: React.MouseEventHandler
    onShowUnsyncedItemCount: React.MouseEventHandler
    onHideUnsyncedItemCount: React.MouseEventHandler
}

type ServiceType = 'Sync' | 'Backup'

class SyncStatusMenu extends PureComponent<SyncStatusMenuProps> {
    handleClickOutside = this.props.onClickOutside

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
            'Memex stores all data locally.',
            'Backup your data.',
        )
    }

    private renderError = (
        serviceType: ServiceType,
        serviceStatus: DisableableState,
    ) => {
        if (serviceStatus !== 'error') {
            return null
        }

        return this.renderNotificationBox(
            `Your last ${serviceType.toLocaleLowerCase()} failed.`,
            <span>
                <StyledAnchor href="">Contact Support</StyledAnchor> if retry
                fails too.
            </span>,
        )
    }

    private renderRowTextBlock = (
        serviceType: ServiceType,
        serviceStatus: DisableableState,
        lastRunDate: Date | null,
    ) => {
        if (serviceStatus === 'disabled') {
            return serviceType === 'Sync'
                ? 'No device paired yet'
                : 'No backup set yet'
        }

        if (serviceStatus === 'running') {
            return 'In progress'
        }

        return (
            'Last ' +
            serviceType.toLocaleLowerCase() +
            ': ' +
            timeSinceNowToString(lastRunDate)
        )
    }

    private renderRow = (
        serviceType: ServiceType,
        serviceStatus: DisableableState,
        otherServiceStatus: DisableableState,
        lastRunDate: Date | null,
        clickHandler: React.MouseEventHandler,
    ) => {
        return (
            <>
                <Row bottom="10px">
                    <RowContainer>
                        <TextBlock bold>{`${serviceType} Status`}</TextBlock>
                        <TextBlock>
                            {this.renderRowTextBlock(
                                serviceType,
                                serviceStatus,
                                lastRunDate,
                            )}
                        </TextBlock>
                    </RowContainer>
                    {serviceStatus === 'running' ? (
                        <LoadingIndicator />
                    ) : (
                        <IconContainer
                            path={
                                serviceStatus === 'disabled'
                                    ? icons.arrowRight
                                    : icons.reload
                            }
                            disabled={otherServiceStatus === 'running'}
                            onClick={clickHandler}
                            heightAndWidth="15px"
                        />
                    )}
                </Row>
                {this.renderError(serviceType, serviceStatus)}
            </>
        )
    }

    render() {
        const {
            syncState,
            backupState,
            isDisplayed,
            onInitiateSync,
            goToSyncRoute,
            goToBackupRoute,
            onInitiateBackup,
            lastSuccessfulSyncDate,
            lastSuccessfulBackupDate,
        } = this.props

        if (!isDisplayed) {
            return null
        }

        return (
            <StyledHoverBox width="min-content" right="50px" top="45px">
                {this.renderRow(
                    'Sync',
                    syncState,
                    backupState,
                    lastSuccessfulSyncDate,
                    syncState === 'disabled' ? goToSyncRoute : onInitiateSync,
                )}
                {this.renderRow(
                    'Backup',
                    backupState,
                    syncState,
                    lastSuccessfulBackupDate,
                    backupState === 'disabled'
                        ? goToBackupRoute
                        : onInitiateBackup,
                )}
                <span>Enable auto-backup: </span>
                <ToggleSwitch
                    isChecked={this.props.isAutoBackupEnabled}
                    onChange={this.props.onToggleAutoBackup}
                />
                {backupState === 'disabled' && this.renderBackupReminder()}
            </StyledHoverBox>
        )
    }
}

export default onClickOutside(SyncStatusMenu)

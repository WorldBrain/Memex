import React from 'react'
import { storiesOf } from '@storybook/react'

import SyncStatusMenu, {
    SyncStatusMenuProps,
} from 'src/dashboard-refactor/header/sync-status-menu'
import { DisplayState, HoverState } from 'src/dashboard-refactor/types'
import { UnSyncedItemState } from 'src/dashboard-refactor/header/sync-status-menu/types'

const stories = storiesOf('Dashboard Refactor|Header/Sync Status Menu', module)

const hoverState: HoverState = {
    isHovered: false,
    onHoverEnter: () => {},
    onHoverLeave: () => {},
}

const displayState: DisplayState = {
    isDisplayed: true,
    toggleDisplayState: () => {},
}

const unSyncedItemState: UnSyncedItemState = {
    showUnSyncedItemCount: false,
    unSyncedItemCount: Math.floor(Math.random() * 100),
    onShowUnSyncedItemCount: () => {},
    onHideUnSyncedItemCount: () => {},
}

const template: SyncStatusMenuProps = {
    displayState: displayState,
    syncState: 'enabled',
    backupState: 'enabled',
    lastSuccessfulSyncDateTime: new Date(),
    lastSuccessfulBackupDateTime: new Date(),
    unSyncedItemState,
    onInitiateSync: () => console.log('sync initiated'),
    onInitiateBackup: () => console.log('backup initiated'),
    syncRunHoverState: hoverState,
    backupRunHoverState: hoverState,
}

export const syncStatusMenuStoryProps: {
    hidden: SyncStatusMenuProps
    allEnabled: SyncStatusMenuProps
    allSuccessful: SyncStatusMenuProps
    allDisabled: SyncStatusMenuProps
    showUnsyncedItemCount: SyncStatusMenuProps
    syncToolTipShowing: SyncStatusMenuProps
    backupToolTipShowing: SyncStatusMenuProps
    syncRunning: SyncStatusMenuProps
    backupRunning: SyncStatusMenuProps
    syncError: SyncStatusMenuProps
    backupError: SyncStatusMenuProps
} = {
    hidden: {
        ...template,
        displayState: {
            ...displayState,
            isDisplayed: false,
        },
    },
    allEnabled: template,
    allSuccessful: {
        ...template,
        syncState: 'success',
        backupState: 'success',
    },
    allDisabled: {
        ...template,
        syncState: 'disabled',
        backupState: 'disabled',
    },
    showUnsyncedItemCount: {
        ...template,
        unSyncedItemState: {
            ...unSyncedItemState,
            showUnSyncedItemCount: true,
        },
    },
    syncToolTipShowing: {
        ...template,
        syncRunHoverState: {
            ...hoverState,
            isHovered: true,
        },
    },
    backupToolTipShowing: {
        ...template,
        backupRunHoverState: {
            ...hoverState,
            isHovered: true,
        },
    },
    syncRunning: {
        ...template,
        syncState: 'running',
    },
    backupRunning: {
        ...template,
        backupState: 'running',
    },
    syncError: {
        ...template,
        syncState: 'error',
    },
    backupError: {
        ...template,
        backupState: 'error',
    },
}

stories.add('Sync and Backup Enabled', () => (
    <SyncStatusMenu {...syncStatusMenuStoryProps.allEnabled} />
))
stories.add('Sync and Backup Successful', () => (
    <SyncStatusMenu {...syncStatusMenuStoryProps.allSuccessful} />
))
stories.add('Sync and Backup Disabled', () => (
    <SyncStatusMenu {...syncStatusMenuStoryProps.allDisabled} />
))
stories.add('Sync Tooltip', () => (
    <SyncStatusMenu {...syncStatusMenuStoryProps.syncToolTipShowing} />
))
stories.add('Backup Tooltip', () => (
    <SyncStatusMenu {...syncStatusMenuStoryProps.backupToolTipShowing} />
))
stories.add('Sync Running', () => (
    <SyncStatusMenu {...syncStatusMenuStoryProps.syncRunning} />
))
stories.add('Backup Running', () => (
    <SyncStatusMenu {...syncStatusMenuStoryProps.backupRunning} />
))
stories.add('Sync Error', () => (
    <SyncStatusMenu {...syncStatusMenuStoryProps.syncError} />
))
stories.add('Backup Error', () => (
    <SyncStatusMenu {...syncStatusMenuStoryProps.backupError} />
))

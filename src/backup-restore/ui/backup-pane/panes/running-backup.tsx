import React from 'react'
import RunningProcess from './running-process'
import { WhiteSpacer30 } from 'src/common-ui/components/design-library/typography'
import styled from 'styled-components'
import * as icons from 'src/common-ui/components/design-library/icons'
import Icon from '@worldbrain/memex-common/ts/common-ui/components/icon'
import type { BrowserSettingsStore } from 'src/util/settings'
import type { LocalBackupSettings } from 'src/backup-restore/background/types'

export default function RunningBackup({
    onFinish,
    localBackupSettings,
}: {
    onFinish: () => void
    localBackupSettings: BrowserSettingsStore<LocalBackupSettings>
}) {
    return (
        <RunningProcess
            functionNames={{
                info: 'getBackupInfo',
                start: 'startBackup',
                cancel: 'cancelBackup',
                pause: 'pauseBackup',
                resume: 'resumeBackup',
                sendNotif: 'sendNotification',
            }}
            eventMessageName="backup-event"
            preparingStepLabel="Preparing uploads"
            synchingStepLabel="Uploading your Memex backup"
            localBackupSettings={localBackupSettings}
            onFinish={onFinish}
        />
    )
}

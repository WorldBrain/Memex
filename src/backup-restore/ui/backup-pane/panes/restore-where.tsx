import React from 'react'
// import PropTypes from 'prop-types'
// import classNames from 'classnames'
import * as logic from './restore-where.logic'
import { ProviderList } from 'src/backup-restore/ui/backup-pane/components/provider-list'
import { DownloadOverlay } from '../components/overlays'
import {
    fetchBackupPath,
    checkServerStatus,
    changeBackupPath,
} from '../../utils'
import { PrimaryAction } from 'src/common-ui/components/design-library/actions/PrimaryAction'

const settingsStyle = require('src/options/settings/components/settings.css')
const STYLES = require('../../styles.css')

interface Props {
    onChoice: () => void
}

export default class RestoreWhere extends React.Component<Props> {
    state = logic.INITIAL_STATE
    handleEvent = null

    async componentWillMount() {
        this.handleEvent = logic.reactEventHandler(this, logic.processEvent)
    }

    private proceedIfServerIsRunning = async () => {
        let overlay = null
        let backupPath = null
        const status = await checkServerStatus()
        if (status) {
            backupPath = await fetchBackupPath()
        } else {
            overlay = 'download'
        }
        this.handleEvent({
            type: 'onChangeOverlay',
            overlay,
        })
        this.handleEvent({
            type: 'onChangeBackupPath',
            backupPath,
        })
    }

    private handleChangeBackupPath = async () => {
        const backupPath = await changeBackupPath()
        if (backupPath) {
            this.handleEvent({
                type: 'onChangeBackupPath',
                backupPath,
            })
        } else {
            this.handleEvent({ type: 'onChangeOverlay', overlay: 'download' })
        }
    }

    render() {
        return (
            <div className={settingsStyle.section}>
                <div className={settingsStyle.sectionTitle}>
                    <strong>STEP 1/2: </strong>
                    FROM WHERE?
                </div>
                <ProviderList
                    backupPath={
                        this.state.provider === 'local'
                            ? this.state.backupPath
                            : null
                    }
                    handleChangeBackupPath={this.handleChangeBackupPath}
                    onChange={async value => {
                        this.handleEvent({ type: 'onProviderChoice', value })
                        if (value === 'local') {
                            await this.proceedIfServerIsRunning()
                        }
                    }}
                />
                <DownloadOverlay
                    disabled={this.state.overlay !== 'download'}
                    onClick={async action => {
                        if (action === 'continue') {
                            this.handleEvent({
                                type: 'onChangeOverlay',
                                overlay: null,
                            })
                            await this.proceedIfServerIsRunning()
                        }
                        if (action === 'cancel') {
                            this.handleEvent({
                                type: 'onChangeOverlay',
                                overlay: null,
                            })
                        }
                    }}
                />
                <div className={settingsStyle.buttonArea}>
                    <div />
                    <PrimaryAction
                        disabled={!this.state.valid}
                        onClick={() =>
                            this.handleEvent({
                                type: 'onConfirm',
                            })
                        }
                        label={'Continue'}
                    />
                </div>
            </div>
        )
    }
}

import React from 'react'
// import PropTypes from 'prop-types'
// import classNames from 'classnames'
import * as logic from './restore-where.logic'
import { ProviderList } from 'src/options/backup/components/provider-list'
import { PrimaryButton } from 'src/options/backup/components/primary-button'
import { DownloadOverlay } from '../components/overlays'
import { fetchBackupPath, checkServerStatus, changeBackupPath } from '../utils'
const STYLES = require('../styles.css')

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
            <div>
                <p className={STYLES.header2}>
                    <strong>STEP 1/2: </strong>
                    FROM WHERE?
                </p>
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
                <PrimaryButton
                    disabled={
                        !this.state.provider ||
                        (this.state.provider === 'local' &&
                            !this.state.backupPath)
                    }
                    onClick={() =>
                        this.handleEvent({
                            type: 'onConfirm',
                        })
                    }
                >
                    Continue
                </PrimaryButton>
            </div>
        )
    }
}

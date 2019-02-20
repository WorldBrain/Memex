import React from 'react'
// import PropTypes from 'prop-types'
// import classNames from 'classnames'
import * as logic from './restore-where.logic'
import { ProviderList } from 'src/options/backup/components/provider-list'
import { PrimaryButton } from 'src/options/backup/components/primary-button'
import { DownloadOverlay } from '../components/overlays'
import { getStringFromResponseBody } from '../utils'
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

    private fetchBackupPath = async () => {
        let backupPath
        try {
            const response = await fetch(
                'http://localhost:11922/backup/location',
            )
            backupPath = await getStringFromResponseBody(response)
            if (backupPath && backupPath.length) {
                return backupPath
            }
        } catch (err) {
            return null
        }
        return null
    }

    private proceedIfServerIsRunning = async () => {
        let overlay = null
        let backupPath = null
        try {
            const response = await fetch('http://localhost:11922/status')
            const serverStatus = await getStringFromResponseBody(response)
            if (serverStatus === 'running') {
                backupPath = await this.fetchBackupPath()
            } else {
                overlay = 'download'
            }
        } catch (err) {
            // Show the download overlay if we couldn't connect to the server.
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
        try {
            await fetch('http://localhost:11922/backup/open-change-location')
            // TODO: Update path
        } catch (err) {
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

import React from 'react'
// import PropTypes from 'prop-types'
// import classNames from 'classnames'
import * as logic from './restore-where.logic'
import { ProviderList } from 'src/options/backup/components/provider-list'
import { PrimaryButton } from 'src/options/backup/components/primary-button'
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
        const response = await fetch('http://localhost:11922/backup/location')
        const backupPath = await getStringFromResponseBody(response)
        this.handleEvent({ type: 'onChangeBackupPath', backupPath })
    }

    private handleChangeBackupPath = async () => {
        try {
            let response = await fetch(
                'http://localhost:11922/backup/open-change-location',
            )
            response = await fetch('http://localhost:11922/backup/location')
            const backupPath = await getStringFromResponseBody(response)
            if (backupPath && backupPath.length) {
                this.handleEvent({ type: 'onChangeBackupPath', backupPath })
            } else {
                this.handleEvent({
                    type: 'onChangeBackupPath',
                    backupPath: null,
                })
            }
        } catch (err) {
            this.handleEvent({ type: 'onChangeBackupPath', backupPath: null })
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
                    onChange={value =>
                        this.handleEvent({ type: 'onProviderChoice', value })
                    }
                />
                <PrimaryButton
                    disabled={!this.state.valid}
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

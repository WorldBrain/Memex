import React from 'react'
// import PropTypes from 'prop-types'
// import classNames from 'classnames'
import * as logic from './restore-where.logic'
import { ProviderList } from 'src/options/backup/components/provider-list'
import { PrimaryButton } from 'src/options/backup/components/primary-button'
const STYLES = require('../styles.css')

interface Props {
    onChoice: () => void
}

export default class RestoreWhere extends React.Component<Props> {
    state = logic.INITIAL_STATE
    handleEvent = null

    componentWillMount() {
        this.handleEvent = logic.reactEventHandler(this, logic.processEvent)
    }

    render() {
        return (
            <div>
                <p className={STYLES.header2}>
                    <strong>STEP 1/2: </strong>
                    FROM WHERE?
                </p>
                <ProviderList
                    onChange={value =>
                        this.handleEvent({ type: 'onProviderChoice', value })
                    }
                />
                <PrimaryButton
                    disabled={!this.state.valid}
                    onClick={() => this.handleEvent({ type: 'onConfirm' })}
                >
                    Continue
                </PrimaryButton>
            </div>
        )
        // return <div>Placeholder</div>
    }
}

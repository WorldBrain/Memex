import React from 'react'
import PropTypes from 'prop-types'

import View from '../components/MigrationNotice'
import { remoteFunction } from '../../util/webextensionRPC'

export default class extends React.PureComponent {
    static propTypes = {
        showBanner: PropTypes.bool,
    }

    constructor(props) {
        super(props)

        this.startMigration = remoteFunction('startMigration')
        this.isMigrating = remoteFunction('isMigrating')
    }

    state = {
        started: false,
    }

    async componentDidMount() {
        const started = await this.isMigrating()
        this.setState(state => ({ ...state, started }))
    }

    getBtnText() {
        return this.state.started ? 'Upgrade Started' : 'Upgrade Now'
    }

    getSubText() {
        return this.state.started
            ? 'You can close this tab and continue'
            : "You'll get a notification once its done."
    }

    getBanner() {
        return this.props.showBanner
            ? browser.extension.getURL('img/worldbrain-logo.png')
            : undefined
    }

    handleBtnClick = event => {
        event.preventDefault()

        this.setState(state => ({ ...state, started: true }))
        this.startMigration()
    }

    render() {
        return (
            <View
                isBtnDisabled={this.state.started}
                onBtnClick={this.handleBtnClick}
                btnText={this.getBtnText()}
                subText={this.getSubText()}
                banner={this.getBanner()}
            />
        )
    }
}

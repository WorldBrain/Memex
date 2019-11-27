import React from 'react'
import PropTypes from 'prop-types'
import Styles from './backup-mode.css'
import classNames from 'classnames'
import { SubscribeModal } from 'src/authentication/components/Subscription/SubscribeModal'

export default class OnboardingBackupModeContainer extends React.Component {
    static propTypes = {
        onModeChange: PropTypes.func,
        launchSubscriptionFlow: PropTypes.func,
        mode: PropTypes.string,
        isAuthorizedForAutomaticBackup: PropTypes.bool,
    }

    state = {
        mode: null,
        subscribeModal: false,
    }

    componentDidMount() {
        if (this.props.mode) {
            this.setState({ mode: this.props.mode })
        }
    }

    openSubscriptionModal = () => this.setState({ subscribeModal: true })
    closeSubscriptionModal = () => this.setState({ subscribeModal: false })

    render() {
        return (
            <div>
                <OnboardingBackupMode
                    {...this.props}
                    mode={this.state.mode}
                    onModeChange={mode => {
                        this.setState({ mode })
                        this.props.onModeChange && this.props.onModeChange(mode)
                    }}
                    launchSubscriptionFlow={this.openSubscriptionModal}
                    isAuthorizedForAutomaticBackup={
                        this.props.isAuthorizedForAutomaticBackup
                    }
                />
                {this.state.subscribeModal && (
                    <SubscribeModal onClose={this.closeSubscriptionModal} />
                )}
            </div>
        )
    }
}

export function OnboardingBackupMode({
    disableModeSelection,
    disableAutomaticBackup,
    launchSubscriptionFlow,
    mode,
    onModeChange,
    isAuthorizedForAutomaticBackup,
}) {
    return (
        <div className={Styles.selectionDiv}>
            {!disableModeSelection && (
                <div>
                    <label>
                        <input
                            type="radio"
                            checked={mode === 'manual'}
                            onChange={() => onModeChange('manual')}
                        />{' '}
                        <span className={Styles.option}>
                            <span className={Styles.name}>Manual Backup</span>
                            <span className={classNames(Styles.labelFree)}>
                                Free
                            </span>
                            <br />
                            <span className={Styles.subname}>
                                You need to regularly remember to back up
                                yourself.
                            </span>
                        </span>
                    </label>
                </div>
            )}
            <div>
                {!disableModeSelection && (
                    <label>
                        <input
                            type="radio"
                            checked={mode === 'automatic'}
                            onChange={() => onModeChange('automatic')}
                        />{' '}
                        <span className={Styles.option}>
                            <span className={Styles.name}>
                                Automatic Backup
                            </span>
                            {!disableAutomaticBackup &&
                            isAuthorizedForAutomaticBackup ? (
                                <span className={classNames(Styles.labelFree)}>
                                    Subscribed
                                </span>
                            ) : (
                                <span
                                    className={Styles.labelPremium}
                                    onClick={launchSubscriptionFlow}
                                >
                                    Upgrade
                                </span>
                            )}

                            <br />
                            <span className={Styles.subname}>
                                Worry-free backups every 15 minutes.
                            </span>
                        </span>
                    </label>
                )}
            </div>
        </div>
    )
}

OnboardingBackupMode.propTypes = {
    disableModeSelection: PropTypes.bool,
    disableAutomaticBackup: PropTypes.bool,
    isAuthorizedForAutomaticBackup: PropTypes.bool,
    mode: PropTypes.string,
    onModeChange: PropTypes.func.isRequired,
    launchSubscriptionFlow: PropTypes.func,
}

import React from 'react'
import PropTypes from 'prop-types'
import Styles from './onboarding-backup-mode.css'
import classNames from 'classnames'

export default class OnboardingBackupModeContainer extends React.Component {
    static propTypes = {
        onModeChange: PropTypes.func,
        showSubscriptionModal: PropTypes.func,
        mode: PropTypes.string,
        isAuthorizedForAutomaticBackup: PropTypes.bool,
    }

    state = {
        mode: null,
    }

    componentDidMount() {
        if (this.props.mode) {
            this.setState({ mode: this.props.mode })
        }
    }

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
                    launchSubscriptionFlow={this.props.showSubscriptionModal}
                    isAuthorizedForAutomaticBackup={
                        this.props.isAuthorizedForAutomaticBackup
                    }
                    subscribeModal={this.state.subscribeModal}
                />
            </div>
        )
    }
}

export function OnboardingBackupMode({
    launchSubscriptionFlow,
    mode,
    onModeChange,
    isAuthorizedForAutomaticBackup,
}) {
    return (
        <div className={Styles.selectionDiv}>
            <div className={Styles.selectionContainer}>
                <label className={Styles.option}>
                    <div className={Styles.selection}>
                        <input
                            type="radio"
                            checked={mode === 'manual'}
                            onChange={() => onModeChange('manual')}
                        />{' '}
                        <div className={Styles.textBlock}>
                            <div className={Styles.selectionTitle}>
                                Manual Backup
                            </div>
                            <p className={Styles.subname}>
                                You need to regularly remember to back up
                                yourself.
                            </p>
                        </div>
                    </div>
                    <div>
                        <span className={classNames(Styles.labelFree)}>
                            Free
                        </span>
                    </div>
                </label>
            </div>
            <div className={Styles.selectionContainer}>
                <label className={Styles.option}>
                    <div className={Styles.selection}>
                        <input
                            type="radio"
                            checked={mode === 'automatic'}
                            onChange={() => onModeChange('automatic')}
                        />{' '}
                        <div className={Styles.textBlock}>
                            <div className={Styles.selectionTitle}>
                                Automatic Backup
                            </div>
                            <p className={Styles.subname}>
                                Worry-free backups every 15 minutes.
                            </p>
                        </div>
                    </div>
                    <div>
                        {isAuthorizedForAutomaticBackup ? (
                            <span className={classNames(Styles.labelFree)}>
                                Subscribed
                            </span>
                        ) : (
                            <span
                                className={Styles.labelFree}
                                onClick={() => launchSubscriptionFlow()}
                            >
                                ⭐️ Pro Feature
                            </span>
                        )}
                    </div>
                </label>
            </div>
        </div>
    )
}

OnboardingBackupMode.propTypes = {
    isAuthorizedForAutomaticBackup: PropTypes.bool,
    mode: PropTypes.string,
    onModeChange: PropTypes.func.isRequired,
    launchSubscriptionFlow: PropTypes.func,
}

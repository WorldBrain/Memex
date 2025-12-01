import React from 'react'
import PropTypes from 'prop-types'

export default class OnboardingBackupModeContainer extends React.Component {
    static propTypes = {
        onModeChange: PropTypes.func,
        showSubscriptionModal: PropTypes.func,
        mode: PropTypes.string,
        isAuthorizedForAutomaticBackup: PropTypes.bool,
    }

    state = {
        mode: 'automatic',
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
                    onModeChange={(mode) => {
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
        <div>
            <div>
                <label>
                    <div>
                        <input
                            type="radio"
                            checked={mode === 'automatic'}
                            onChange={() => onModeChange('automatic')}
                        />
                        <div>
                            <div>Automatic Backup</div>
                            <p>Worry-free backups every 15 minutes.</p>
                        </div>
                    </div>
                </label>
            </div>
            <div>
                <label>
                    <div>
                        <input
                            type="radio"
                            checked={mode === 'manual'}
                            onChange={() => onModeChange('manual')}
                        />
                        <div>
                            <div>Manual Backup</div>
                            <p>
                                You need to regularly remember to back up
                                yourself.
                            </p>
                        </div>
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

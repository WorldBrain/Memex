import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import { remoteFunction } from 'src/util/webextensionRPC'
import styles from './onboarding-3-size.css'
import { PrimaryButton } from '../components/primary-button'

export default class OnboardingSizeContainer extends React.Component {
    static propTypes = {
        isAuthenticated: PropTypes.bool,
        onBlobPreferenceChange: PropTypes.func.isRequired,
        onLoginRequested: PropTypes.func.isRequired,
        onBackupRequested: PropTypes.func.isRequired,
    }

    state = { estimation: null }

    async componentDidMount() {
        try {
            this.setState({
                estimation: await remoteFunction('estimateInitialBackupSize')(),
            })
        } catch (e) {
            this.setState({ estimation: 'error' })
            console.log(e)
            console.trace()
        }
    }

    renderLoadingIndicator() {
        return null // TOOD: See if it actually takes long enough to be worth the effort
    }

    renderEstimationFailure() {
        return 'Something went horribly wrong' // TODO: Render something nice and meaningful here
    }

    render() {
        if (!this.state.estimation) {
            return this.renderLoadingIndicator()
        }
        if (this.state.estimation === 'error') {
            return this.renderEstimationFailure()
        }

        const sizes = {
            withBlobs: this.state.estimation.bytesWithBlobs,
            withoutBlobs: this.state.estimation.bytesWithoutBlobs,
            blobs: null,
        }
        sizes.blobs = sizes.withBlobs - sizes.withoutBlobs

        return (
            <div>
                <h2>
                    <span className={styles.headerEmphasis}>
                        Estimated size
                    </span>
                    of your backup
                </h2>
                <div>What do you want to include in the backup?</div>
                <table>
                    <tr>
                        <td>&nbsp;</td>
                        <td>
                            Searchable History, Annotations, Comments,
                            Highlights, Collections
                        </td>
                        <td className={styles.estimationSize}>
                            {_bytesToMega(sizes.withoutBlobs).toFixed(0)}
                            MB
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <input
                                type="checkbox"
                                onChange={event =>
                                    this.props.onBlobPreferenceChange(
                                        event.target.checked,
                                    )
                                }
                            />
                        </td>
                        <td>Screenshots</td>
                        <td className={styles.estimationSize}>
                            {_bytesToMega(sizes.blobs).toFixed(0)}
                            MB
                        </td>
                    </tr>
                    <tr>
                        <td>&nbsp;</td>
                        <td>&nbsp;</td>
                        <td
                            className={classNames(
                                styles.estimationSize,
                                styles.sumCell,
                            )}
                        >
                            {_bytesToMega(sizes.blobs).toFixed(0)}
                            MB
                        </td>
                    </tr>
                </table>

                {!this.props.isAuthenticated && (
                    <PrimaryButton
                        onClick={() => {
                            this.props.onLoginRequested()
                        }}
                    >
                        Connect with Google Drive
                    </PrimaryButton>
                )}
                {this.props.isAuthenticated && (
                    <PrimaryButton
                        onClick={() => {
                            this.props.onBackupRequested()
                        }}
                    >
                        Backup
                    </PrimaryButton>
                )}
            </div>
        )
    }
}

export function _bytesToMega(bytes) {
    return bytes / 1024 / 1024
}

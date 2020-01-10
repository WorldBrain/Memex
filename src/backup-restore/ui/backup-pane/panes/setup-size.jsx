import React from 'react'
import PropTypes from 'prop-types'
import { remoteFunction } from 'src/util/webextensionRPC'
import localStyles from './setup-size.css'
import { PrimaryButton } from '../../../../common-ui/components/primary-button'
import LoadingBlocker from '../../../../common-ui/components/loading-blocker'
import Styles from '../../styles.css'

export default class OnboardingSizeContainer extends React.Component {
    static propTypes = {
        onLoginRequested: PropTypes.func.isRequired,
        onBackupRequested: PropTypes.func.isRequired,
    }

    state = {
        estimation: null,
        backendLocation: null,
        isAuthenticated: null,
    }

    async componentDidMount() {
        try {
            if (process.env.BACKUP_TEST_SIZE_ESTIMATION !== 'true') {
                this.setState({
                    estimation: await remoteFunction(
                        'estimateInitialBackupSize',
                    )(),
                })
            }
        } catch (e) {
            this.setState({ estimation: 'error' })
            console.error(e)
        }
        this.setState({
            isAuthenticated: await remoteFunction(
                'isBackupBackendAuthenticated',
            )(),
            backendLocation: await remoteFunction('getBackendLocation')(),
        })
    }

    renderLoadingIndicator() {
        return <LoadingBlocker />
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
            <div className={Styles.container}>
                <p className={Styles.header2}>
                    <strong>STEP 3/5: </strong>
                    Estimating backup size
                </p>
                <div className={Styles.subtitle2}>
                    What do you want to include in the backup?
                </div>
                <table className={localStyles.table}>
                    <tbody>
                        <tr>
                            <td className={localStyles.estimationSize}>
                                {Math.ceil(_bytesToMega(sizes.withoutBlobs))}
                                MB
                            </td>
                            <td>
                                <span className={localStyles.option}>
                                    <span className={localStyles.name}>
                                        All your knowledge
                                    </span>
                                    <br />
                                    <span className={localStyles.subname}>
                                        Searchable History, Annotations,
                                        Comments, Highlights, Collections, Tags.
                                    </span>
                                </span>
                            </td>
                        </tr>
                    </tbody>
                </table>

                {this.state.backendLocation === 'google-drive' &&
                    !this.state.isAuthenticated && (
                        <PrimaryButton
                            onClick={() => {
                                this.props.onLoginRequested()
                            }}
                        >
                            Connect with Google Drive
                        </PrimaryButton>
                    )}
                {this.state.backendLocation === 'google-drive' &&
                    this.state.isAuthenticated && (
                        <PrimaryButton
                            onClick={() => {
                                this.props.onBackupRequested()
                            }}
                        >
                            Backup
                        </PrimaryButton>
                    )}
                {this.state.backendLocation === 'local' &&
                    this.state.isAuthenticated && (
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

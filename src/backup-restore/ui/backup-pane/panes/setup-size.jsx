import React from 'react'
import PropTypes from 'prop-types'
import { remoteFunction } from 'src/util/webextensionRPC'
import localStyles from './setup-size.css'
import LoadingBlocker from '../../../../common-ui/components/loading-blocker'
import { PrimaryAction } from 'src/common-ui/components/design-library/actions/PrimaryAction'
import { WhiteSpacer20 } from 'src/common-ui/components/design-library/typography'

const settingsStyle = require('src/options/settings/components/settings.css')

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
            isAuthenticated: await localStorage.getItem('drive-token-access'),
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
            <div className={settingsStyle.section}>
                <div className={settingsStyle.sectionTitle}>
                    <strong>STEP 3/5: </strong>
                    Estimating backup size
                </div>
                <WhiteSpacer20 />
                <table className={localStyles.table}>
                    <tbody>
                        <tr className={localStyles.row}>
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
                <WhiteSpacer20 />
                <div className={settingsStyle.buttonArea}>
                    <div />
                    {this.state.backendLocation === 'google-drive' &&
                        (this.state.isAuthenticated === 'undefined' ||
                            this.state.isAuthenticated === null) && (
                            <PrimaryAction
                                onClick={() => {
                                    this.props.onLoginRequested()
                                }}
                                label={'Connect with Google Drive'}
                            />
                        )}
                    {this.state.backendLocation === 'google-drive' &&
                        this.state.isAuthenticated !== 'undefined' &&
                        this.state.isAuthenticated && (
                            <PrimaryAction
                                onClick={() => {
                                    this.props.onBackupRequested()
                                }}
                                label={'Backup Now'}
                            />
                        )}
                    {this.state.backendLocation === 'local' && (
                        <PrimaryAction
                            onClick={() => {
                                this.props.onBackupRequested()
                            }}
                            label={'Backup Now'}
                        />
                    )}
                </div>
            </div>
        )
    }
}

export function _bytesToMega(bytes) {
    return bytes / 1024 / 1024
}

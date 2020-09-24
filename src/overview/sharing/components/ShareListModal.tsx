import React, { Component } from 'react'
import { Modal } from 'src/common-ui/components'
import { PageList } from 'src/custom-lists/background/types'
import ShareNonPioneerInfo from './ShareNonPioneerInfo'
import ShareListModalContent from './ShareListModalContent'
import DisplayNameSetup from './DisplayNameSetup'
import BetaFeatureNotif from './BetaFeatureNotif'
import { TaskState } from 'ui-logic-core/lib/types'
import { AuthRemoteFunctionsInterface } from 'src/authentication/background/types'
import { ContentSharingInterface } from 'src/content-sharing/background/types'
import { getListShareUrl } from 'src/content-sharing/utils'
import { auth } from 'src/util/remote-functions-background'
import { withCurrentUser } from 'src/authentication/components/AuthConnector'
import { connect } from 'react-redux'
import { show } from 'src/overview/modals/actions'
import LoadingIndicator from 'src/common-ui/components/LoadingIndicator'

interface Props {
    isPioneer: boolean
    auth: AuthRemoteFunctionsInterface
    contentSharing: ContentSharingInterface
    list: PageList
    showSubscriptionModal: () => void
    onClose: () => void
}

interface State {
    loadState: TaskState
    listCreationState: TaskState
    entriesUploadState: TaskState
    updateProfileState: TaskState

    displayName?: string
    newDisplayName?: string
    isShared?: boolean
    shareUrl?: string
    showBetaNotif: boolean
    hasSubscription: boolean
}

class ShareListModal extends Component<Props, State> {
    constructor(props) {
        super(props)

        this.state = {
            loadState: 'running',
            listCreationState: 'pristine',
            entriesUploadState: 'pristine',
            updateProfileState: 'pristine',
            showBetaNotif: true,
            hasSubscription: false,
        }
    }

    componentDidMount() {
        this.setState({ loadState: 'running' })
        this.getListOverview()
        this.getBetaNotifStatus()
        this.hasSubscription()
    }

    async getBetaNotifStatus() {
        if (await auth.isAuthorizedForFeature('beta')) {
            this.setState({ showBetaNotif: false })
        }
    }

    async hasSubscription() {
        const plans = await this.props.auth.getAuthorizedPlans()

        if (plans.length > 0) {
            await this.setState({ hasSubscription: true })
        }
    }

    async getListOverview() {
        this.setState({ loadState: 'running' })
        try {
            const remoteListId = await this.props.contentSharing.getRemoteListId(
                {
                    localListId: this.props.list.id,
                },
            )
            const isShared = !!remoteListId
            const profile = await this.props.auth.getUserProfile()
            this.setState({
                loadState: 'success',
                isShared,
                displayName: profile?.displayName ?? undefined,
                shareUrl: remoteListId && getListShareUrl({ remoteListId }),
            })
        } catch (e) {
            this.setState({ loadState: 'error' })
            throw e
        }
    }

    async shareList() {
        this.setState({
            isShared: true,
            listCreationState: 'running',
            entriesUploadState: 'running',
        })
        try {
            // const { remoteListId } = await new Promise((resolve) => {
            //     setTimeout(() => resolve({ remoteListId: 'test' }), 2000)
            // })
            const { remoteListId } = await this.props.contentSharing.shareList({
                listId: this.props.list.id,
            })
            this.setState({
                listCreationState: 'success',
                shareUrl: getListShareUrl({ remoteListId }),
            })
        } catch (e) {
            this.setState({
                listCreationState: 'error',
                entriesUploadState: 'error',
            })
            throw e
        }

        try {
            // await new Promise((resolve) => setTimeout(resolve, 2000))
            await this.props.contentSharing.shareListEntries({
                listId: this.props.list.id,
            })
            this.setState({
                entriesUploadState: 'success',
            })
        } catch (e) {
            this.setState({
                listCreationState: 'error',
                entriesUploadState: 'error',
            })
        }
    }

    async unshareList() {}

    updateDisplayName = async () => {
        this.setState({
            updateProfileState: 'running',
        })
        try {
            await this.props.auth.updateUserProfile({
                displayName: this.state.newDisplayName,
            })
            this.setState({
                updateProfileState: 'success',
                displayName: this.state.newDisplayName,
                newDisplayName: undefined,
            })
        } catch (e) {
            this.setState({
                updateProfileState: 'error',
            })
            throw e
        }
    }

    renderContent() {
        // if user is not a pioneer - prompt to upgrade
        // if (!this.props.isPioneer) {
        //     return (
        //         <ShareNonPioneerInfo
        //             onClickUpgrade={() => {
        //                 // TODO: handle "upgrade" click for non-pioneer
        //             }}
        //         />
        //     )
        // }
        if (this.state.loadState === 'error') {
            return 'Error loading sharing dialog...' // TODO: If we fail to load, display something nicer.
        }
        if (this.state.updateProfileState === 'error') {
            return 'Error updating display name...'
        }

        // if display name is not set - prompt to set
        if (!this.state.displayName && !this.state.showBetaNotif) {
            return (
                <DisplayNameSetup
                    name={this.state.newDisplayName}
                    onChange={(newDisplayName) => {
                        this.setState({ newDisplayName })
                    }}
                    onClickNext={this.updateDisplayName}
                />
            )
        }

        if (this.state.showBetaNotif) {
            return (
                <BetaFeatureNotif
                    showSubscriptionModal={this.props.showSubscriptionModal}
                />
            )
        }

        // otherwise -  show the main modal content
        return (
            <ShareListModalContent
                isShared={this.state.isShared}
                shareUrl={this.state.shareUrl}
                listCreationState={this.state.listCreationState}
                entriesUploadState={this.state.entriesUploadState}
                collectionName={this.props.list.name}
                onClickToggle={async () => {
                    if (!this.state.isShared) {
                        await this.shareList()
                    } else {
                        await this.unshareList()
                    }
                }}
                onClickLetUsKnow={() => {
                    window.open('https://worldbrain.io/feedback/betafeatures')
                }}
                onClickViewRoadmap={() => {
                    window.open('https://worldbrain.io/roadmap')
                }}
                onClickKnownIssues={() => {
                    window.open(
                        'https://worldbrain.io/feature/sharing-collections/knownissues',
                    )
                }}
            />
        )
    }

    render() {
        if (
            this.state.loadState === 'pristine' ||
            this.state.loadState === 'running'
        ) {
            return <LoadingIndicator />
        }

        return (
            <Modal large onClose={this.props.onClose}>
                {this.renderContent()}
            </Modal>
        )
    }
}

export default connect(null, (dispatch) => ({
    showSubscriptionModal: () => dispatch(show({ modalId: 'Subscription' })),
}))(withCurrentUser(ShareListModal))

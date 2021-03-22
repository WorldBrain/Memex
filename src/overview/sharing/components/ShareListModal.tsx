import React, { Component } from 'react'
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
import { SubscriptionsService } from '@worldbrain/memex-common/lib/subscriptions/types'

interface Props {
    isPioneer: boolean
    auth: AuthRemoteFunctionsInterface
    subscription: SubscriptionsService
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
    remoteListId?: string
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
            const profile = await this.props.auth.getUserProfile()
            this.setState({
                loadState: 'success',
                displayName: profile?.displayName ?? undefined,
                remoteListId,
            })
        } catch (e) {
            this.setState({ loadState: 'error' })
            throw e
        }
    }

    shareList = async () => {
        this.setState({
            listCreationState: 'running',
            entriesUploadState: 'running',
        })
        try {
            const { remoteListId } = await this.props.contentSharing.shareList({
                listId: this.props.list.id,
            })
            this.setState({
                listCreationState: 'success',
                remoteListId,
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
                onClose={this.props.onClose}
                shareUrl={getListShareUrl({
                    remoteListId: this.state.remoteListId,
                })}
                listName={this.props.list.name}
                onGenerateLinkClick={this.shareList}
                listCreationState={this.state.listCreationState}
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

        return this.renderContent()
    }
}

export default connect(null, (dispatch) => ({
    showSubscriptionModal: () => dispatch(show({ modalId: 'Subscription' })),
}))(withCurrentUser(ShareListModal))

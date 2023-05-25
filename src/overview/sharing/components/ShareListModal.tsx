import React, { Component } from 'react'
import { PageList } from 'src/custom-lists/background/types'
import ShareNonPioneerInfo from './ShareNonPioneerInfo'
import ShareListModalContent from './ShareListModalContent'
import DisplayNameSetup from './DisplayNameSetup'
import { TaskState } from 'ui-logic-core/lib/types'
import { AuthRemoteFunctionsInterface } from 'src/authentication/background/types'
import { ContentSharingInterface } from 'src/content-sharing/background/types'
import { getListShareUrl } from 'src/content-sharing/utils'
import { auth } from 'src/util/remote-functions-background'
import { withCurrentUser } from 'src/authentication/components/AuthConnector'
import { connect } from 'react-redux'
import { show } from 'src/overview/modals/actions'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'
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
            hasSubscription: false,
        }
    }

    render() {
        return null
    }
}

export default connect(null, (dispatch) => ({
    showSubscriptionModal: () => dispatch(show({ modalId: 'Subscription' })),
}))(withCurrentUser(ShareListModal))

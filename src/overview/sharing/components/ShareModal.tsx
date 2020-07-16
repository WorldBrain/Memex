import React, { Component } from 'react'
import { Modal } from 'src/common-ui/components'
import { PageList } from 'src/custom-lists/background/types'
import ShareNonPioneerInfo from './ShareNonPioneerInfo'
import ShareModalContent from './ShareModalContent'
import DisplayNameSetup from './DisplayNameSetup'
import { TaskState } from 'ui-logic-core/lib/types'
import { AuthRemoteFunctionsInterface } from 'src/authentication/background/types'
import { ContentSharingInterface } from 'src/content-sharing/background/types'
import { getListShareUrl } from 'src/content-sharing/utils'

interface Props {
    isPioneer: boolean
    auth: AuthRemoteFunctionsInterface
    contentSharing: ContentSharingInterface
    list: PageList

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
}

class ShareModal extends Component<Props, State> {
    constructor(props) {
        super(props)

        this.state = {
            loadState: 'pristine',
            listCreationState: 'pristine',
            entriesUploadState: 'pristine',
            updateProfileState: 'pristine',
        }
    }

    async componentDidMount() {
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

    componentWillReceiveProps(nextProps) {
        // local state copy of display name so we can confirm when setting
        this.setState({ displayName: nextProps.displayName })
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

        // // if display name is not set - prompt to set
        if (!this.state.displayName) {
            return (
                <DisplayNameSetup
                    name={this.state.newDisplayName}
                    onChange={(newDisplayName) => {
                        this.setState({ newDisplayName })
                    }}
                    onClickNext={async () => {
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
                    }}
                />
            )
        }

        // otherwise -  show the main modal content
        return (
            <ShareModalContent
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
                    // TODO: handle "let us know" button
                }}
                onClickViewRoadmap={() => {
                    // TODO: handle "roadmap" button
                }}
            />
        )
    }

    render() {
        if (
            this.state.loadState === 'pristine' ||
            this.state.loadState === 'running'
        ) {
            return null // TODO: Show loading indicator
        }

        return (
            <Modal large onClose={this.props.onClose}>
                {this.state.loadState === 'error'
                    ? 'Error!' // TODO: If we fail to load, display something nicer. Probably a very rare case
                    : this.renderContent()}
            </Modal>
        )
    }
}

export default ShareModal

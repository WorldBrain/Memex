import React, { PureComponent } from 'react'
import { Modal } from 'src/common-ui/components'
import { PageList } from 'src/custom-lists/background/types'
import ShareNonPioneerInfo from './ShareNonPioneerInfo'
import ShareModalContent from './ShareModalContent'
import DisplayNameSetup from './DisplayNameSetup'

interface Props {
    isShown: boolean
    isPioneer: boolean
    displayName?: string
    list: PageList

    onClose: () => void
    onUpdateDisplayName: (displayName: string) => void

    onShareList: (listId: number) => void
    onUnshareList: (listId: number) => void
}

interface State {
    displayName?: string
}

class ShareModal extends PureComponent<Props, State> {
    constructor(props) {
        super(props)

        this.state = {
            displayName: undefined,
        }
    }

    componentWillReceiveProps(nextProps) {
        // local state copy of display name so we can confirm when setting
        this.setState({ displayName: nextProps.displayName })
    }

    renderContent() {
        // if user is not a pioneer - prompt to upgrade
        if (!this.props.isPioneer) {
            return (
                <ShareNonPioneerInfo
                    onClickUpgrade={() => {
                        // TODO: handle "upgrade" click for non-pioneer
                    }}
                />
            )
        }

        // if display name is not set - prompt to set
        if (!this.props.displayName) {
            return (
                <DisplayNameSetup
                    name={this.state.displayName}
                    onChange={(newName) => {
                        this.setState({ displayName: newName })
                    }}
                    onClickNext={() => {
                        this.props.onUpdateDisplayName(this.state.displayName)
                    }}
                />
            )
        }

        // otherwise -  show the main modal content
        const isShared = false // TODO: get share status of given list
        const isUploading = false // TODO: get "uploading" status of a given list
        const shareUrl = '' // TODO: get "share url" for a given list

        return (
            <ShareModalContent
                isShared={isShared}
                shareUrl={shareUrl}
                isUploading={isUploading}
                collectionName={this.props.list.name}
                onClickToggle={() => {
                    if (isShared) {
                        this.props.onUnshareList(this.props.list.id)
                    } else {
                        this.props.onShareList(this.props.list.id)
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
        if (!this.props.isShown) {
            return null
        }

        return (
            <Modal large onClose={this.props.onClose}>
                {this.renderContent()}
            </Modal>
        )
    }
}

export default ShareModal

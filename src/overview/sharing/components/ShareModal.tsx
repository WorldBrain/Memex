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
                        // TODO
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
        const isPublic = false // TODO
        const shareUrl = '' // TODO
        const isUploading = false // TODO

        return (
            <ShareModalContent
                isPublic={isPublic}
                shareUrl={shareUrl}
                isUploading={isUploading}
                collectionName={this.props.list.name}
                onClickToggle={() => {
                    // TODO
                }}
                onClickLetUsKnow={() => {
                    // TODO
                }}
                onClickViewRoadmap={() => {
                    // TODO
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

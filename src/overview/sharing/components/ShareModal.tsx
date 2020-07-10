import React, { PureComponent } from 'react'
import { Modal } from 'src/common-ui/components'
import { PageList } from 'src/custom-lists/background/types'
import ShareNonPioneerInfo from './ShareNonPioneerInfo'
import ShareModalContent from './ShareModalContent'

interface Props {
    isShown: boolean
    isPioneer: boolean
    list: PageList
    onClose: () => void
}

class ShareModal extends PureComponent<Props> {
    render() {
        if (!this.props.isShown) {
            return null
        }

        const isPublic = false // TODO
        const shareUrl = '' // TODO
        const isUploading = false // TODO

        return (
            <Modal large onClose={this.props.onClose}>
                {!this.props.isPioneer ? (
                    <ShareNonPioneerInfo
                        onClickUpgrade={() => {
                            // TODO
                        }}
                    />
                ) : (
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
                )}
            </Modal>
        )
    }
}

export default ShareModal

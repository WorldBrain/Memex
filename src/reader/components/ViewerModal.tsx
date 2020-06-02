import React from 'react'
import { withCurrentUser } from 'src/authentication/components/AuthConnector'
import { AuthContextInterface } from 'src/authentication/background/types'
import Viewer from 'src/reader/components/Viewer'
import ViewerOverlay from 'src/reader/components/ViewerOverlay'

type Props = {
    handleClose: () => void
    onInit: ({ url }: { url: string }) => void
    fullUrl: string
} & AuthContextInterface

class ViewerModal extends React.PureComponent<Props & AuthContextInterface> {
    render() {
        return (
            <ViewerOverlay handleClose={this.props.handleClose}>
                <Viewer
                    fullUrl={this.props.fullUrl}
                    onInit={this.props.onInit}
                />
            </ViewerOverlay>
        )
    }
}

export default withCurrentUser(ViewerModal)

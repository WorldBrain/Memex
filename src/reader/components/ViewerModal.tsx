import React from 'react'
import Modal from 'src/common-ui/components/Modal'
import { withCurrentUser } from 'src/authentication/components/AuthConnector'
import { AuthContextInterface } from 'src/authentication/background/types'
import Viewer from 'src/reader/components/Viewer'

type Props = {
    onClose: () => void
    fullUrl: string
} & AuthContextInterface

class ViewerModal extends React.PureComponent<Props & AuthContextInterface> {
    render() {
        return (
            <Modal
                onClose={this.props.onClose}
                onClick={this.props.onClose}
                full
            >
                <div style={styles.container}>
                    <Viewer fullUrl={this.props.fullUrl} />
                </div>
            </Modal>
        )
    }
}

const styles = {
    container: {
        width: '100%',
        maxWidth: 800,
        minHeight: 300,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        backgroundColor: 'white',
    },
}

export default withCurrentUser(ViewerModal)

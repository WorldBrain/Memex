import React from 'react'
import Subscribe from 'src/authentication/components/Subscription/Subscribe'
import Modal from 'src/common-ui/components/Modal'
import { withCurrentUser } from 'src/authentication/components/AuthConnector'
import { AuthContextInterface } from 'src/authentication/background/types'

type Props = {
    onClose: () => void
} & AuthContextInterface

class SubscribeModal extends React.PureComponent<Props & AuthContextInterface> {
    render() {
        return (
            <Modal
                onClose={this.props.onClose}
                onClick={this.props.onClose}
                large
            >
                <div style={styles.container}>
                    <Subscribe onClose={this.props.onClose} />
                </div>
            </Modal>
        )
    }
}

const styles = {
    container: {
        width: '100%',
        minHeight: 300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
    },
}

export default withCurrentUser(SubscribeModal)

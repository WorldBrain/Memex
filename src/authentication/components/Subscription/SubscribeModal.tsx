import React from 'react'
import { Subscribe } from 'src/authentication/components/Subscription/Subscribe'
import Modal from 'src/common-ui/components/Modal'

interface Props {
    onClose: () => void
}
interface State {}

export class SubscribeModal extends React.PureComponent<Props, State> {
    render() {
        return (
            <Modal
                onClose={this.props.onClose}
                onClick={this.props.onClose}
                large={true}
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
        // width: "50dw",
        // height: "50dh",
        // backgroundColor: "white",
    },
}

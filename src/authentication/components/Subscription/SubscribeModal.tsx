import React from 'react'
import Subscribe from 'src/authentication/components/Subscription/Subscribe'
import Modal from 'src/common-ui/components/Modal'
import {
    UserProps,
    withCurrentUser,
} from 'src/authentication/components/AuthConnector'
import { SubscriptionPreview } from 'src/authentication/components/Subscription/SubscriptionPreview'

interface Props {
    onClose: () => void
}
interface State {
    showSubscribeWithLogin: boolean
}

class SubscribeModal extends React.PureComponent<Props & UserProps, State> {
    state = {
        showSubscribeWithLogin: null,
    }

    handlePreviewPress = () => {
        this.setState({ showSubscribeWithLogin: true })
    }

    // Shows the live Subscribe window if user is logged in, or a static preview
    // of the plan picker if not.
    render() {
        return (
            <Modal
                onClose={this.props.onClose}
                onClick={this.props.onClose}
                large
            >
                <div style={styles.container}>
                    {this.props.currentUser === null &&
                    this.state.showSubscribeWithLogin !== true ? (
                        <SubscriptionPreview
                            onPress={this.handlePreviewPress}
                        />
                    ) : (
                        <Subscribe onClose={this.props.onClose} />
                    )}
                </div>
            </Modal>
        )
    }
}

const styles = {
    container: {
        width: '100%',
        backgroundColor: 'white',
    },
}

export default withCurrentUser(SubscribeModal)

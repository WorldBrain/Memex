import React from 'react'
import * as logic from './restore-confirmation.logic'

interface Props {
    onConfirm: () => void
    onClose: () => void
}

export default class RestoreConfirmation extends React.Component<Props, {}> {
    state = logic.INITIAL_STATE
    handleEvent = null
    inputRef = null

    componentWillMount() {
        this.handleEvent = logic.reactEventHandler(this, logic.processEvent)
    }

    componentDidMount() {
        this.inputRef.focus()
    }

    render() {
        return (
            <div>
                <div>
                    <span onClick={this.props.onClose} />
                    <div>
                        <img src={'./img/danger.svg'} />
                        <span>Danger Zone</span>
                    </div>
                    <p>
                        This will delete your existing data and replace it with
                        your backup. You cannot go back.
                    </p>
                    <p>
                        {' '}
                        Type{' '}
                        <input
                            type="text"
                            placeholder="RESTORE"
                            value={this.state.confirmation}
                            onChange={(event) =>
                                this.handleEvent({
                                    type: 'onConfirmationChange',
                                    value: event.target.value,
                                })
                            }
                            ref={(node) => (this.inputRef = node)}
                        />
                        to continue
                    </p>
                </div>
            </div>
        )
    }
}

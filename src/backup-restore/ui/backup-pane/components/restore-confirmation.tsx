import React from 'react'
import * as logic from './restore-confirmation.logic'
const styles = require('./restore-confirmation.css')
const settingsStyle = require('src/options/settings/components/settings.css')

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
            <div className={styles.container}>
                <div className={styles.box}>
                    <span
                        className={styles.closeIcon}
                        onClick={this.props.onClose}
                    />
                    <div>
                        <img
                            className={styles.dangerIcon}
                            src={'./img/danger.svg'}
                        />
                        <span className={styles.danger}>Danger Zone</span>
                    </div>
                    <p className={settingsStyle.infoText}>
                        This will delete your existing data and replace it with
                        your backup. You cannot go back.
                    </p>
                    <p className={styles.instructions}>
                        {' '}
                        Type{' '}
                        <input
                            type="text"
                            className={styles.input}
                            placeholder="RESTORE"
                            value={this.state.confirmation}
                            onChange={event =>
                                this.handleEvent({
                                    type: 'onConfirmationChange',
                                    value: event.target.value,
                                })
                            }
                            ref={node => (this.inputRef = node)}
                        />
                        to continue
                    </p>
                </div>
            </div>
        )
    }
}

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import * as logic from './restore-confirmation.logic'
const styles = require('./restore-confirmation.css')

export default class RestoreConfirmation extends React.Component {
    static propTypes = {
        onConfirm: PropTypes.func.isRequired,
        onClose: PropTypes.func.isRequired,
    }

    state = logic.INITIAL_STATE
    handleEvent = null

    componentWillMount() {
        this.handleEvent = logic.reactEventHandler(this, logic.processEvent)
    }

    render() {
        return (
            <div className={styles.container}>
                <div className={styles.box}>
                <img className={styles.dangerIcon} src={'./img/danger.svg'}/><span className={styles.danger}>Danger Zone</span>
                    <p className={styles.normal}>This will delete your existing data and replace it with your backup. You cannot go back.</p>
                    <p className={styles.instruction}> Type <b>RESTORE</b> to continue</p>
                    <input
                        type="text"
                        className={styles.input}
                        value={this.state.confirmation}
                        onChange={event =>
                            this.handleEvent({
                                type: 'onConfirmationChange',
                                value: event.target.value,
                            })
                        }
                    />
                </div>
            </div>
        )
    }
}

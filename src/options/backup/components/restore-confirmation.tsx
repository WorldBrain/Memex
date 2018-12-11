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
                    Are you sure?
                    <input
                        type="text"
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

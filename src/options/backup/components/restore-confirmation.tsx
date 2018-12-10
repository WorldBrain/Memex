import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import * as logic from './restore-confirmation.logic'

export default class OverviewContainer extends React.Component {
    state = logic.INITIAL_STATE
    handleEvent = null

    componentWillMount() {
        this.handleEvent = logic.reactEventHandler(this, logic.processEvent)
    }

    render() {
        return (
            <div>
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
        )
    }
}

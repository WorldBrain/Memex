import React from 'react'
// import PropTypes from 'prop-types'
// import classNames from 'classnames'
import * as logic from './restore-where.logic'
// const styles = require('./restore-confirmation.css')

export default class RestoreWhere extends React.Component {
    // static propTypes = {
    //     onConfirm: PropTypes.func.isRequired,
    //     onClose: PropTypes.func.isRequired,
    // }

    state = logic.INITIAL_STATE
    handleEvent = null

    componentWillMount() {
        this.handleEvent = logic.reactEventHandler(this, logic.processEvent)
    }

    render() {
        return <div>Placeholder</div>
    }
}

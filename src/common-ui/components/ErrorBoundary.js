import React, { Component } from 'react'
import PropTypes from 'prop-types'

import * as Raven from 'src/util/raven'

class ErrorBoundary extends Component {
    static propTypes = {
        component: PropTypes.any.isRequired,
        children: PropTypes.oneOfType([
            PropTypes.arrayOf(PropTypes.node),
            PropTypes.node,
        ]).isRequired,
    }

    state = {
        error: undefined,
    }

    componentDidCatch(error, info) {
        Raven.captureException(error, { extra: info })
        this.setState(state => ({ ...state, error }))
    }

    render() {
        const { component: ErrorView, children } = this.props
        const { error } = this.state

        return error ? (
            <ErrorView stack={error.stack} message={error.message} />
        ) : (
            children
        )
    }
}

export default ErrorBoundary

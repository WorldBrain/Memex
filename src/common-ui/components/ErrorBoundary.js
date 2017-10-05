import React, { Component } from 'react'
import PropTypes from 'prop-types'

class ErrorBoundary extends Component {
    static propTypes = {
        component: PropTypes.any.isRequired,
        children: PropTypes.oneOfType([
            PropTypes.arrayOf(PropTypes.node),
            PropTypes.node,
        ]).isRequired,
    }

    state = {
        hasError: false,
    }

    componentDidCatch(error, info) {
        this.setState(state => ({ ...state, hasError: true }))
    }

    render() {
        const { component: ErrorView, children } = this.props

        return this.state.hasError ? <ErrorView /> : children
    }
}

export default ErrorBoundary

import React from 'react'
import PropTypes from 'prop-types'

export default class MovingDotsLabel extends React.Component {
    static propTypes = {
        text: PropTypes.string.isRequired,
        intervalMs: PropTypes.number.isRequired,
    }

    state = { count: 1, limit: 3 }

    componentDidMount() {
        this.animationInterval = setInterval(() => {
            this.advance()
        }, this.props.intervalMs)
    }

    componentWillUnmount() {
        clearTimeout(this.animationInterval)
    }

    advance() {
        let next = this.state.count + 1
        if (next > this.state.limit) {
            next = 1
        }
        this.setState({ count: next })
    }

    render() {
        return `${this.props.text}${'.'.repeat(this.state.count)}`
    }
}

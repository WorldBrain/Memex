import React from 'react'
import PropTypes from 'prop-types'

import analytics from 'src/analytics'

/**
 * Wraps standard <a> to track outgoing link on `click`.
 */
class OutLink extends React.PureComponent<any> {
    static propTypes = { to: PropTypes.string.isRequired }

    trackLinkClick = () =>
        analytics.trackEvent({
            category: 'Global',
            action: 'External Link',
            value: this.props.to,
        })

    render() {
        const { to, ...props } = this.props
        return (
            <a
                target="_blank"
                onClick={this.trackLinkClick}
                href={to}
                {...props}
            />
        )
    }
}

export default OutLink

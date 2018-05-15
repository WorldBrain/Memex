import React from 'react'
import PropTypes from 'prop-types'

import analytics from 'src/analytics'

/**
 * Wraps standard <a> to track outgoing link on `click`.
 */
class OutLink extends React.PureComponent {
    static propTypes = { to: PropTypes.string.isRequired }

    trackLinkClick = () =>
        analytics.trackLink({ linkType: 'link', url: this.props.to })

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

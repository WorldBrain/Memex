import React from 'react'
import PropTypes from 'prop-types'

import analytics from 'src/analytics'

/**
 * Wraps standard <a> to track outgoing link on `click`.
 */
class OutLink extends React.PureComponent {
    static propTypes = { href: PropTypes.string.isRequired }

    trackLinkClick = () =>
        analytics.trackLink({ linkType: 'link', url: this.props.href })

    render() {
        return (
            <a target="_blank" onClick={this.trackLinkClick} {...this.props} />
        )
    }
}

export default OutLink

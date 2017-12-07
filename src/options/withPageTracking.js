import React from 'react'
import PropTypes from 'prop-types'

import analytics from 'src/analytics'

/**
 * HOC that adds page tracking to whatever router-connected component.
 *
 * @param {React.Component} Component
 * @returns {React.Component}
 */
const withPageTracking = Component =>
    class extends React.Component {
        static propTypes = { location: PropTypes.object.isRequired }

        componentDidUpdate({ location: prevLoc }) {
            if (this.props.location !== prevLoc) {
                analytics.trackPage(this.props.location)
            }
        }

        render() {
            return <Component {...this.props} />
        }
    }

export default withPageTracking

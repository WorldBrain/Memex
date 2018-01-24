import React from 'react'
import PropTypes from 'prop-types'
import debounce from 'lodash/fp/debounce'

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

        constructor(props) {
            super(props)

            this.trackPage = debounce(100)(this._trackPage)
        }

        _trackPage = () => analytics.trackPage({ title: document.title })

        componentDidMount() {
            console.log('mounted')
            this.trackPage()
        }

        componentDidUpdate({ location: prevLoc }) {
            if (this.props.location !== prevLoc) {
                this.trackPage()
            }
        }

        render() {
            return <Component {...this.props} />
        }
    }

export default withPageTracking

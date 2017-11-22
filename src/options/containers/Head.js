import React from 'react'
import PropTypes from 'prop-types'
import { withRouter } from 'react-router'
import { Helmet } from 'react-helmet'

/**
 * Determine what to render in `<head>` depending on the current routing location state.
 *
 * @param {Object} location Location object passed in from react-router.
 * @param {string} location.pathname
 */
const renderHeadContent = location => {
    switch (location.pathname) {
        case '/tutorial':
            return <title>Settings - Tutorial</title>
        case '/help':
            return <title>Settings - Help</title>
        case '/acknowledgements':
            return <title>Settings - Acknowledgements</title>
        case '/privacy':
            return <title>Settings - Privacy</title>
        case '/import':
            return <title>Settings - Imports</title>
        case '/blacklist':
            return <title>Settings - Blacklist</title>
        default:
            return <title>Settings</title>
    }
}

const Head = ({ location }) => <Helmet>{renderHeadContent(location)}</Helmet>

Head.propTypes = {
    location: PropTypes.object.isRequired,
}

export default withRouter(Head)

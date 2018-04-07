import React, { Component } from 'react'
// import PropTypes from 'prop-types'
// import noop from 'lodash/fp/noop'

// import { updateLastActive } from 'src/analytics'
// import { remoteFunction } from 'src/util/webextensionRPC'
import { CommentDropdown } from '../components'

class CommentDropdownContainer extends Component {
    state = {
        data: [],
    }
    render() {
        return <CommentDropdown />
    }
}

export default CommentDropdownContainer

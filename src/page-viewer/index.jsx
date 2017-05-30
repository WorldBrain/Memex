import React from 'react'
import PropTypes from 'prop-types'

export const localVersionAvailable = ({page}) => (
    !!(page._attachments && page._attachments['frozen-page.html'])
)

export const LinkToLocalVersion = ({page, children, ...props}) => (
    <a
        href={`/page-viewer/localpage.html?page=${page._id}`}
        title='Stored version available'
        {...props}
    >
        {children}
    </a>
)
LinkToLocalVersion.propTypes = {
    page: PropTypes.object.isRequired,
    children: PropTypes.node,
}

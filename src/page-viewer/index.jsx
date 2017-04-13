import React, { PropTypes } from 'react'

export const localVersionAvailable = ({page}) => (
    !!page.html
)

export const LinkToLocalVersion = ({page, children, ...props}) => (
    <a
        href={`data:text/html;charset=UTF-8,${page.html}`}
        title='Stored text version available'
        {...props}
    >
        {children}
    </a>
)
LinkToLocalVersion.propTypes = {
    page: PropTypes.object.isRequired,
    children: PropTypes.node,
}

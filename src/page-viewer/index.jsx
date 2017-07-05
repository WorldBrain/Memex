import classNames from 'classnames'
import React from 'react'
import PropTypes from 'prop-types'

export const localVersionAvailable = ({page}) => (
    !!(page._attachments && page._attachments['frozen-page.html'])
)

export const LinkToLocalVersion = ({page, children, ...props}) => {
    const available = localVersionAvailable({page})
    let href
    if (available) {
        const uri = `/page-viewer/localpage.html?page=${page._id}`
        const hash = (page.url && page.url.split('#')[1])
        href = (hash !== undefined) ? uri + '#' + hash : uri
    }
    const className = classNames(
        {'available': available},
        props.className
    )
    return (
        <a
            href={href}
            title={available ? undefined : `Page not available. Perhaps storing failed?`}
            {...props}
            className={className}
        >
            {children}
        </a>
    )
}
LinkToLocalVersion.propTypes = {
    page: PropTypes.object.isRequired,
    className: PropTypes.string,
    children: PropTypes.node,
}

import React from 'react'
import PropTypes from 'prop-types'

export const getGitHubReportUrl = ({ title, body }) => {
    let baseUrl = 'https://github.com/WorldBrain/WebMemex/issues/new?'

    if (title) {
        baseUrl += `title=${title}&`
    }

    if (body) {
        baseUrl += `body=${body}&`
    }

    return baseUrl
}

const Output = ({ children, className }) => (
    <pre className={className}>
        <code>{children}</code>
    </pre>
)

Output.propTypes = {
    children: PropTypes.string.isRequired,
    className: PropTypes.string.isRequired,
}

const RuntimeError = ({ stack, message }) => (
    <div>
        <p>The extension page has crashed. Please reload the extension page.</p>

        <a
            href={getGitHubReportUrl({ title: `Runtime error: "${message}"` })}
            rel="noopener noreferrer"
            target="_blank"
        >
            Report issue
        </a>

        <div>
            {message && [
                <h1 key="head">Error message:</h1>,
                <Output key="output">{message}</Output>,
            ]}
            {stack && [
                <h1 key="head">Error stack:</h1>,
                <Output key="output">{stack}</Output>,
            ]}
        </div>
    </div>
)

RuntimeError.propTypes = {
    stack: PropTypes.string,
    message: PropTypes.string,
}

export default RuntimeError

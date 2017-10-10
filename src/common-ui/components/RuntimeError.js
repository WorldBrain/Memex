import React from 'react'
import PropTypes from 'prop-types'

import styles from './RuntimeError.css'

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

const Output = ({ children, className }) => <pre className={className}><code>{children}</code></pre>

Output.propTypes = {
    children: PropTypes.string.isRequired,
    className: PropTypes.string.isRequired,
}

const RuntimeError = ({ stack, message }) => (
    <div className={styles.main}>
        <p className={styles.message}>
            The extension page has crashed. Please reload the extension page.
        </p>

        <a
            className={styles.reportBtn}
            href={getGitHubReportUrl({ title: `Runtime error: "${message}"` })}
            rel='noopener noreferrer'
            target='_blank'
        >
            Report issue
        </a>

        <div className={styles.error}>
            {message && [
                <h1 key='head' className={styles.errorHeading}>Error message:</h1>,
                <Output key='output' className={styles.errorMessage}>{message}</Output>,
            ]}
            {stack && [
                <h1 key='head' className={styles.errorHeading}>Error stack:</h1>,
                <Output key='output' className={styles.errorMessage}>{stack}</Output>,
            ]}
        </div>
    </div>
)

RuntimeError.propTypes = {
    stack: PropTypes.string,
    message: PropTypes.string,
}

export default RuntimeError

import React, { PropTypes } from 'react'

const readerViewStyle = `
body {
    margin: 80px;
    font-size: 16px;
    line-height: 1.5em;
}
body > main {
    margin: auto;
    max-width: 800px;
}
`

const pageToHTML = ({
    extractedText: article,
    extractedMetadata: { url } = {},
}) => `<html>
    <head>
        <meta charset="utf-8" />
        ${url ? `<link rel="canonical" href="${url}" />` : ``}
        <title>💾 ${article.title}</title>
        <style>
${readerViewStyle}
        </style>
    </head>
    <body>
        <main>
            <h1 class="articleTitle">${article.title}</h1>
            ${article.content}
        </main>
    </body>
</html>`

export const localVersionAvailable = ({page}) => (
    page.extractedText && page.extractedText.content
)

export const LinkToLocalVersion = ({page, children, ...props}) => (
    <a
        href={`data:text/html;charset=UTF-8,${pageToHTML(page)}`}
        title='Stored text version available'
        {...props}
    >
        {children}
    </a>
)
LinkToLocalVersion.propTypes = {
    page: PropTypes.object.required,
    children: PropTypes.node,
}

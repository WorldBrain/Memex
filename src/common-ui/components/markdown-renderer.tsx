import React from 'react'
import ReactMarkdown from 'react-markdown'

export type Props = ReactMarkdown.ReactMarkdownProps & {}

export default class Markdown extends React.PureComponent<Props> {
    // TODO: add proper support for images
    private imageRenderer = ({ src, alt }) => <span>{`![${alt}](${src})`}</span>

    render() {
        return (
            <ReactMarkdown
                renderers={{ image: this.imageRenderer }}
                {...this.props}
            />
        )
    }
}

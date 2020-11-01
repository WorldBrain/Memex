import React from 'react'
import styled from 'styled-components'
import ReactMarkdown from 'react-markdown'

export type Props = ReactMarkdown.ReactMarkdownProps & {}

export default class Markdown extends React.PureComponent<Props> {
    // TODO: add proper support for images
    private imageRenderer = ({ src, alt }) => <span>{`![${alt}](${src})`}</span>

    render() {
        return (
            <Container>
                <ReactMarkdown
                    renderers={{ image: this.imageRenderer }}
                    {...this.props}
                />
            </Container>
        )
    }
}

const Container = styled.div`

    padding: 0px 5px;
    white-space: break-spaces;

    & p {
        margin: 5px 0px;
    }

    & *:first-child {
        margin-top: 0px;
    }

    & *:last-child {
        margin-bottom: 0px;
    }

    & h1 {
        font-size: 1.5em
        margin-block-end: 0em;
        margin-bottom: -5px;
    }

    & h2 {
        font-size: 1.3em
        margin-block-end: 0em;
        margin-bottom: -5px;
    }

    & h3 {
        font-size: 1.1em
        margin-block-end: 0em;
        margin-bottom: -5px;
    }

    & h4 {
        margin-block-end: 0em;
        margin-bottom: -5px;
    }

    & blockquote {
        border-left: 4px solid #5cd9a6
        margin: 0px;
        padding: 5px 5px 5px 15px;
        font-style: italic;

        & p {
            margin: 0px;
        }
    }

    & ul {
        padding-inline-start: 20px;
        margin-top: 5px;

        list-style: disc outside none;

        & p {
            margin: 0px;
        }

        & ul {
            margin-top: 0px;
            list-style: disc outside none;
        }

    }

    & ol {
        padding-inline-start: 20px;
        margin-top: 5px;

        & ol {
            margin-top: 0px;
            list-style: lower-latin;
        }
        
        & ul {
            margin-top: 0px;
            list-style: disc outside none;
        }

        & p {
            margin: 0px;
        }

    }

     & li {
        white-space: break-spaces;
    }

    & code {
        padding: 0px 4px;
        border: 1px solid #1d1c1d21;
        border-radius: 3px;
        color: #e01e5a;
        background-color: #1d1c1d04
    }

    & pre {
        padding: 10px;
        color: #3a2f45;
        border: 1px solid #1d1c1d21;
        background-color: #1d1c1d04;
        border-radius: 3px

        & code {
            background-color: transparent;
            color: #3a2f45;
            border: none;
            padding: 0px;
        }
    }

    & hr {
        margin: 20px 0px;
    }

    & img {
        height:
    }
`

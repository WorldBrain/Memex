import * as React from 'react'
import styled from 'styled-components'
import onClickOutside from 'react-onclickoutside'
import { getKeyName } from 'src/util/os-specific-key-names'

interface Props {}

interface State {}

export class MarkdownHelp extends React.Component<Props, State> {
    static MOD_KEY = getKeyName({ key: 'mod' })
    static ALT_KEY = getKeyName({ key: 'alt' })

    render() {
        return (
            <MarkdownHelpContainer>
                <TutorialTable>
                    <FormattingTitle>Editor Formatting</FormattingTitle>
                    <tr>
                        <td>
                            <b>Bold</b>
                        </td>
                        <td>**bold**</td>
                        <td>
                            <ShortCuts>{MarkdownHelp.MOD_KEY}+B</ShortCuts>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <i>Italic</i>
                        </td>
                        <td>*italic*</td>
                        <td>
                            <ShortCuts>{MarkdownHelp.MOD_KEY}+I</ShortCuts>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <Link
                                href="https://memex.garden/tutorials"
                                target="_blank"
                            >
                                Link
                            </Link>
                        </td>
                        <td>Highlight text and paste url</td>
                        <td>
                            <ShortCuts>{MarkdownHelp.MOD_KEY}+V</ShortCuts>
                        </td>
                    </tr>
                    <tr>
                        <td>YouTube timestamp</td>
                        <td>
                            <a href="https://youtu.be/VIVIegSt81k?t=75">
                                [1:15]
                            </a>
                        </td>
                        <td>
                            <span>In Editor:</span> <br />
                            <ShortCuts>{MarkdownHelp.MOD_KEY}+Y</ShortCuts>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <ol>
                                <li>Ordered List</li>
                            </ol>
                        </td>
                        <td>1. Item One</td>
                        <td>
                            <ShortCuts>
                                {MarkdownHelp.MOD_KEY}+shift+7
                            </ShortCuts>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <ul>
                                <li>Bullet List</li>
                            </ul>
                        </td>
                        <td>- Item One or * Item One</td>
                        <td>
                            <ShortCuts>
                                {MarkdownHelp.MOD_KEY}+shift+8
                            </ShortCuts>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <blockquote>Block Quote</blockquote>
                        </td>
                        <td> > this is the quote</td>
                        <td>
                            <ShortCuts>
                                {MarkdownHelp.MOD_KEY}+shift+b
                            </ShortCuts>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <h1>Heading 1</h1>
                        </td>
                        <td># Heading 1</td>
                        <td>
                            <ShortCuts>
                                {MarkdownHelp.MOD_KEY}+{MarkdownHelp.ALT_KEY}+1
                            </ShortCuts>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <h2>Heading 2</h2>
                        </td>
                        <td>## Heading 2</td>
                        <td>
                            <ShortCuts>
                                {MarkdownHelp.MOD_KEY}+{MarkdownHelp.ALT_KEY}+2
                            </ShortCuts>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <h3>Heading 3</h3>
                        </td>
                        <td>### Heading 3</td>
                        <td>
                            <ShortCuts>
                                {MarkdownHelp.MOD_KEY}+{MarkdownHelp.ALT_KEY}+3
                            </ShortCuts>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <code>Inline Code</code>
                        </td>
                        <td>`inline Code`</td>
                        <td>
                            <ShortCuts>
                                {MarkdownHelp.MOD_KEY}+shift+E
                            </ShortCuts>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <CodeBlock>
                                Multi-Line <br />
                                Code Block
                            </CodeBlock>
                        </td>
                        <td>```code blocks```</td>
                        <td>
                            <ShortCuts>
                                {MarkdownHelp.MOD_KEY}+{MarkdownHelp.ALT_KEY}+C
                            </ShortCuts>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <s>Strikethrough</s>
                        </td>
                        <td>~~Strikethrough~~</td>
                        <td>
                            <ShortCuts>
                                {MarkdownHelp.MOD_KEY}+shift+X
                            </ShortCuts>
                        </td>
                    </tr>
                </TutorialTable>
            </MarkdownHelpContainer>
        )
    }
}

const TutorialTable = styled.table`
    width: 100%;
    all: initial;
    font-size: 14px;

    & tr {
        height: 40px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    td:first-child {
        width: 50px;
        white-space: nowrap;
    }

    td:nth-child(2) {
        white-space: nowrap;
        text-align: center;
    }

    & td:last-child {
        display: flex;
        justify-content: flex-end;
        width: 50px;
        font-size: 14px;
        white-space: nowrap;
        display: flex;
        align-items: center;

        & span {
            margin-right: 5px;
        }
    }

    & code {
        padding: 2px 3px 1px;
        border: 1px solid #1d1c1d21;
        border-radius: 3px;
        background-color: #1d1c1d0a;
        color: #e01e5a;
        font-size: 14px;
        font-family: Monaco, Menlo, Consolas, Courier New, monospace !important;
    }

    & ul {
        margin-inline-start: -20px;
    }

    & ol {
        margin-inline-start: -20px;
    }

    & h1 {
        font-size: 18px;
    }

    & h2 {
        font-size: 16px;
    }

    & h3 {
        font-size: 14px;
    }

    & blockquote {
        border-left: #5cd9a6 3px solid;
        margin-inline-start: 0px;
        margin-inline-end: 0px;
        padding-left: 10px;
    }
`

const CodeBlock = styled.pre`
        width: fit-content;
        border: 1px solid #1d1c1d21;
        border-radius: 3px;
        background-color: #1d1c1d0a;
        padding: 5px;
        font-family: 'Monaco', 'Menlo', 'Consolas', 'Courier New', monospace !important;
    }
`

const Highlight = styled.div`
    background-color: yellow;
`

const Link = styled.a``

const ShortCuts = styled.div`
    border: 1px solid #f29d9d;
    border-radius: 3px;
    padding: 2px 5px;
    font-size: 12px;
    width: fit-content;
    align-self: flex-end;
    background-color: #f29d9d60;
`

const FormattingTitle = styled.div`
    font-size: 16px;
    color: #c0c0c0;
    display: flex;
    justify-content: space-between;
    align-items: center;
`

const MarkdownHelpContainer = styled.div`
    padding: 15px;
`

export default onClickOutside(MarkdownHelp)

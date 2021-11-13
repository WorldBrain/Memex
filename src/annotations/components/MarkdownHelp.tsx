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
                    <FormattingTitle>Formatting</FormattingTitle>
                    <tr>
                        <td>
                            <b>Bold</b>
                        </td>
                        <td>**bold**</td>
                        <td>
                            <ShortCuts>{MarkdownHelp.MOD_KEY}+b</ShortCuts>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <i>Italic</i>
                        </td>
                        <td>*italic*</td>
                        <td>
                            <ShortCuts>{MarkdownHelp.MOD_KEY}+i</ShortCuts>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <Highlight>Highlight</Highlight>
                        </td>
                        <td>==highlight==</td>
                        <td>
                            <ShortCuts>
                                {MarkdownHelp.MOD_KEY}+shift+h
                            </ShortCuts>
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
                            <ShortCuts>{MarkdownHelp.MOD_KEY}+v</ShortCuts>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <code>Inline Code</code>
                        </td>
                        <td>`() => function(){}`</td>
                        <td>
                            <ShortCuts>
                                {MarkdownHelp.MOD_KEY}+shift+e
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
                        <td>shift+enter in Inline Code</td>
                        <td>
                            <ShortCuts>
                                {MarkdownHelp.MOD_KEY}+{MarkdownHelp.ALT_KEY}+c
                            </ShortCuts>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <u>Underline</u>
                        </td>
                        <td></td>
                        <td>
                            <ShortCuts>{MarkdownHelp.MOD_KEY}+u</ShortCuts>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <s>Strikethrough</s>
                        </td>
                        <td>~~Strikethrough~~</td>
                        <td>
                            <ShortCuts>
                                {MarkdownHelp.MOD_KEY}+shift+x
                            </ShortCuts>
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
                        <td># Heading 2</td>
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
                        <td># Heading 3</td>
                        <td>
                            <ShortCuts>
                                {MarkdownHelp.MOD_KEY}+{MarkdownHelp.ALT_KEY}+3
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

    & tr {
        height: 40px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    & td:last-child {
        display: flex;
        justify-content: flex-end;
    }

    & code {
        border: 1px solid #f29d9d;
        border-radius: 3px;
        padding: 2px 5px;
        width: fit-content;
        align-self: flex-end;
        background-color: #f29d9d60;
        color: #ff2b2b;
        font-weight: 500;
    }

    & ul {
        margin-inline-start: -30px;
    }

    & ol {
        margin-inline-start: -30px;
    }
`

const CodeBlock = styled.div`
    border: 1px solid #f29d9d;
    border-radius: 3px;
    padding: 2px 5px;
    width: fit-content;
    text-align: left;
    background-color: #f29d9d60;
    color: #ff2b2b;
    font-weight: 500;
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

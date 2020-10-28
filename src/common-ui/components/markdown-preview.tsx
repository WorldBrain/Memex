import React from 'react'
import styled, { ThemeProvider } from 'styled-components'

import Markdown from 'src/common-ui/components/markdown-renderer'

export interface Props {
    value: string
    renderInput: () => JSX.Element
}

interface State {
    showPreview: boolean
}

export class MarkdownPreview extends React.PureComponent<Props, State> {
    state: State = { showPreview: false }

    private get styleTheme() {
        return { showPreview: this.state.showPreview }
    }

    private togglePreview = () =>
        this.setState((state) => ({
            showPreview: !state.showPreview,
        }))

    private renderPreviewBtn() {
        return <PreviewBtn onClick={this.togglePreview}>Preview</PreviewBtn>
    }

    private renderEditor() {
        if (this.state.showPreview) {
            return <Markdown>{this.props.value}</Markdown>
        }

        return this.props.renderInput()
    }

    render() {
        return (
            <ThemeProvider theme={this.styleTheme}>
                <Container>
                    {this.renderPreviewBtn()}
                    <EditorContainer>{this.renderEditor()}</EditorContainer>
                </Container>
            </ThemeProvider>
        )
    }
}

const PreviewBtn = styled.button`
    font-weight: ${({ theme }) => (theme.showPreview ? 'bold' : 'normal')};
`

const Container = styled.div``
const EditorContainer = styled.div``

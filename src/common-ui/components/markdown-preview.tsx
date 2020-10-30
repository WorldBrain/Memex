import React from 'react'
import styled, { ThemeProvider } from 'styled-components'

import Markdown from 'src/common-ui/components/markdown-renderer'

export interface MainInputProps<T = HTMLInputElement | HTMLTextAreaElement> {
    onKeyDown: React.KeyboardEventHandler
    ref: React.RefObject<T>
}

export interface Props {
    customRef?: React.RefObject<any>
    value: string
    onKeyDown?: React.KeyboardEventHandler
    renderInput: (props: MainInputProps) => JSX.Element
    isToggleKBShortcutKeyed?: (e: React.KeyboardEvent) => boolean
}

interface State {
    showPreview: boolean
}

export class MarkdownPreview extends React.PureComponent<Props, State> {
    static defaultProps: Partial<Props> = {
        isToggleKBShortcutKeyed: (e) => e.key === 'Enter' && e.altKey,
    }

    private secretInputRef = React.createRef<HTMLInputElement>()
    private _mainInputRef = React.createRef<HTMLInputElement>()
    state: State = { showPreview: false }

    componentDidUpdate() {
        if (this.state.showPreview) {
            this.secretInputRef.current.focus()
        } else {
            this.mainInputRef.current.focus()
        }
    }

    private get mainInputRef(): React.RefObject<HTMLInputElement> {
        return this.props.customRef ?? this._mainInputRef
    }

    private get styleTheme() {
        return { showPreview: this.state.showPreview }
    }

    private handleSecretInputKeyDown: React.KeyboardEventHandler = (e) => {
        if (this.state.showPreview) {
            this.handleToggleKBShortcut(e)
            return this.props.onKeyDown?.(e)
        }
    }

    private handleMainInputKeyDown: React.KeyboardEventHandler = (e) => {
        this.handleToggleKBShortcut(e)
        return this.props.onKeyDown?.(e)
    }

    private handleToggleKBShortcut: React.KeyboardEventHandler = (e) => {
        if (this.props.isToggleKBShortcutKeyed(e)) {
            this.togglePreview()
            return
        }
    }

    private togglePreview = () =>
        this.setState((state) => ({
            showPreview: !state.showPreview,
        }))

    private renderEditor() {
        if (this.state.showPreview) {
            return <Markdown>{this.props.value}</Markdown>
        }

        return this.props.renderInput({
            onKeyDown: this.handleMainInputKeyDown,
            ref: this.mainInputRef,
        })
    }

    render() {
        return (
            <ThemeProvider theme={this.styleTheme}>
                <SecretInput
                    type="button"
                    ref={this.secretInputRef}
                    onKeyDown={this.handleSecretInputKeyDown}
                />
                <Container>
                    <PreviewBtn onClick={this.togglePreview}>
                        Preview
                    </PreviewBtn>
                    <EditorContainer>{this.renderEditor()}</EditorContainer>
                </Container>
            </ThemeProvider>
        )
    }
}

const PreviewBtn = styled.button`
    font-weight: ${({ theme }) => (theme.showPreview ? 'bold' : 'normal')};
    box-sizing: border-box;
    cursor: pointer;
    font-size: 14px;
    border: none;
    outline: none;
    padding: 3px 5px;
    margin-right: 5px;
    background: transparent;
    border-radius: 3px;

    &:focus {
        background-color: grey;
    }

    &:hover {
        background-color: #e0e0e0;
    }

    &:focus {
        background-color: #79797945;
    }
`

const Container = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-end;
`

const EditorContainer = styled.div`
    width: 100%;
    padding: 10px;

    & textarea,
    input {
        width: 100%;
    }
`

const SecretInput = styled.input`
    width: 0;
    height: 0;
    border: none;
    outline: none;
    background: none;
`

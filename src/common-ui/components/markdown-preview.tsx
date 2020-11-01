import React from 'react'
import styled, { ThemeProvider } from 'styled-components'
import { ButtonTooltip } from 'src/common-ui/components'

import Markdown from 'src/common-ui/components/markdown-renderer'

export interface MainInputProps<T = HTMLInputElement | HTMLTextAreaElement> {
    onKeyDown: React.KeyboardEventHandler
    ref: React.RefObject<T>
}

export interface Props {
    customRef?: React.RefObject<any>
    value: string
    showPreviewBtnOnEmptyInput?: boolean
    onKeyDown?: React.KeyboardEventHandler
    /**
     * Please ensure all `renderInput` method props are passed down into the underlying <input> or <textarea> el you render.
     */
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

    private selectionRange: [number, number] = [-1, -1]
    private secretInputRef = React.createRef<HTMLInputElement>()
    private _mainInputRef = React.createRef<HTMLInputElement>()
    state: State = { showPreview: false }

    componentDidUpdate() {
        if (this.state.showPreview) {
            this.secretInputRef.current.focus()
        } else {
            this.mainInputRef.current.setSelectionRange(...this.selectionRange)
            this.mainInputRef.current.focus()
        }
    }

    private get mainInputRef(): React.RefObject<HTMLInputElement> {
        return this.props.customRef ?? this._mainInputRef
    }

    private get showPreviewBtn(): boolean {
        return (
            this.props.showPreviewBtnOnEmptyInput || this.props.value.length > 0
        )
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
        if (this.showPreviewBtn && this.props.isToggleKBShortcutKeyed(e)) {
            this.togglePreview()
            return
        }
    }

    togglePreview = () =>
        this.setState((state) => {
            // If setting to show preview, save the selection state
            if (!state.showPreview) {
                this.selectionRange = [
                    this.mainInputRef.current.selectionStart,
                    this.mainInputRef.current.selectionEnd,
                ]
            }
            return {
                showPreview: !state.showPreview,
            }
        })

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
                    {this.showPreviewBtn && (
                        <PreviewButtonContainer>
                            <ButtonTooltip
                                tooltipText="alt/option + Enter"
                                position="bottom"
                            >
                                <PreviewBtn onClick={this.togglePreview}>
                                    Preview
                                </PreviewBtn>
                            </ButtonTooltip>
                        </PreviewButtonContainer>
                    )}
                    <EditorContainer>{this.renderEditor()}</EditorContainer>
                </Container>
            </ThemeProvider>
        )
    }
}

const PreviewButtonContainer = styled.div`
    background-color: #f7f7f7;
    width: -webkit-fill-available;
    border-bottom: 1px solid #e0e0e0;
    padding-bottom: 7px;
    display: flex;
    justify-content: flex-end;
`

const PreviewBtn = styled.button`
    font-weight: ${({ theme }) => (theme.showPreview ? 'bold' : 'normal')};
    box-sizing: border-box;
    cursor: pointer;
    font-size: 14px;
    border: none;
    outline: none;
    padding: 3px 5px;
    margin: 5px 5px -5px 0;
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
    border: solid 1px #e0e0e0;
    border-radius: 3px;
    margin: 5px;
`

const EditorContainer = styled.div`
    width: fill-available;
    margin-bottom: -3px;
    border-radius: 3px;

    & > div {
        padding: 10px 7px;
    }

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

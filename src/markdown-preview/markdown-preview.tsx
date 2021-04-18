import React from 'react'
import styled, { ThemeProvider } from 'styled-components'
import Markdown from '@worldbrain/memex-common/lib/common-ui/components/markdown'

import { ButtonTooltip } from 'src/common-ui/components'
import { getKeyName } from 'src/util/os-specific-key-names'

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
    renderSecondaryBtn?: () => JSX.Element
    isToggleKBShortcutKeyed?: (e: React.KeyboardEvent) => boolean
}

interface State {
    showPreview: boolean
}

export class MarkdownPreview extends React.Component<Props, State> {
    static ALT_KEY = getKeyName({ key: 'alt' })
    static defaultProps: Partial<Props> = {
        isToggleKBShortcutKeyed: (e) =>
            e.key === 'Enter' && e.altKey && !e.metaKey,
        renderSecondaryBtn: () => null,
    }

    private selectionRange: [number, number] = [-1, -1]
    private secretInputRef = React.createRef<HTMLInputElement>()
    private _mainInputRef = React.createRef<HTMLInputElement>()
    state: State = { showPreview: false }

    componentDidUpdate(prevProps: Props, prevState: State) {
        if (prevState.showPreview === this.state.showPreview) {
            return
        }

        if (this.state.showPreview) {
            this.secretInputRef.current.focus()
        } else {
            this.mainInputRef.current.setSelectionRange(...this.selectionRange)
            this.mainInputRef.current.focus()
        }
    }

    get mainInputRef(): React.RefObject<HTMLInputElement> {
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
                    <PreviewButtonContainer>
                        {this.props.renderSecondaryBtn()}
                        {this.showPreviewBtn && (
                            <ButtonTooltip
                                tooltipText={`${MarkdownPreview.ALT_KEY} + Enter`}
                                position="bottomSidebar"
                            >
                                <PreviewBtn onClick={this.togglePreview}>
                                    Preview Markdown
                                </PreviewBtn>
                            </ButtonTooltip>
                        )}
                    </PreviewButtonContainer>
                    <EditorContainer>{this.renderEditor()}</EditorContainer>
                </Container>
            </ThemeProvider>
        )
    }
}

const PreviewButtonContainer = styled.div`
    background-color: #f7f7f7;
    width: -webkit-fill-available;
    width: -moz-available;
    border-bottom: 1px solid #e0e0e0;
    height: 30px;
    padding: 0px 2px;
    align-items: center;
    display: flex;
    justify-content: flex-start;
    border-radius: 4px 4px 0 0;
`

const PreviewBtn = styled.button`
    font-weight: ${({ theme }) => (theme.showPreview ? 'bold' : 'normal')};
    box-sizing: border-box;
    cursor: pointer;
    font-size: 14px;
    border: none;
    outline: none;
    padding: 3px 5px;
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
    border-radius: 5px;
    padding: 0;
    border: 1px solid #e0e0e0;
    margin: 5px;
`

const EditorContainer = styled.div`
    width: fill-available;
    border-radius: 3px;
    display: flex;

    & > div {
        padding: 10px 7px;
        white-space: pre-wrap;
        overflow-wrap: break-word;

        & *:first-child {
            margin-top: 0;
        }

        & *:last-child {
            margin-bottom: 0;
        }
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

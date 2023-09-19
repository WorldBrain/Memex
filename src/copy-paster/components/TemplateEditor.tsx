import React, { PureComponent } from 'react'
import { Template } from '../types'
import styled, { css } from 'styled-components'
import { LesserLink } from 'src/common-ui/components/design-library/actions/LesserLink'
import * as icons from 'src/common-ui/components/design-library/icons'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import TextField from '@worldbrain/memex-common/lib/common-ui/components/text-field'
import TextAreaMarkedUp from '@worldbrain/memex-common/lib/common-ui/components/text-area-marked-up'

const styles = require('./TemplateEditorStyles.css')

const FlexContainer = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    padding: 0px 15px 10px 15px;
`

const TextInputBox = styled.div`
    display: flex;
    flex-direction: column;
    padding: 10px 10px;
    grid-gap: 5px;
`

const HeaderText = styled.div`
    font-family: ${(props) => props.theme.fonts.primary};
    font-style: normal;
    font-weight: bold;
    font-size: 14px;
    color: ${(props) => props.theme.colors.primary};
`

const ButtonContainer = styled.div`
    display: flex;
    flex-direction: row;
`

const Button = styled.button`
    font-family: ${(props) => props.theme.fonts.primary};
    font-style: normal;
    font-weight: normal;
    font-size: 14px;
    color: ${(props) => props.theme.colors.primary};
    cursor: pointer;
    padding: 0 0 0 5px;

    outline: none;
    border: none;
    background: transparent;

    ${(props) =>
        props.small &&
        css`
            font-size: 12px;
        `}

    ${(props) =>
        props.danger &&
        css`
            color: #f29d9d;
        `}

    ${(props) =>
        props.disabled &&
        css`
            color: #a2a2a2;
        `}
`

const Header = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    padding: 10px 15px 0px 15px;
    height: 30px;
    align-items: center;
`

const SectionTitle = styled.div`
    color: ${(props) => props.theme.colors.greyScale4};
    font-size: 14px;
    font-weight: 400;
`

const TextInput = styled(TextField)`
    outline: none;
    height: fill-available;
    width: fill-available;
    color: ${(props) => props.theme.colors.greyScale6};
    font-size: 14px;
    border: none;
    margin-bottom: 10px;
    background: ${(props) => props.theme.colors.greyScale2};

    &:focus-within {
        outline: 1px solid ${(props) => props.theme.colors.greyScale4};
        color: ${(props) => props.theme.colors.white};
    }

    &::placeholder {
        color: ${(props) => props.theme.colors.greyScale5};
    }
`

const TextAreaContainer = styled(TextAreaMarkedUp)`
    outline: none;
    height: fill-available;
    width: fill-available;
    color: ${(props) => props.theme.colors.greyScale6};
    font-size: 14px;
    border: none;
    background: ${(props) => props.theme.colors.greyScale2};
    margin: 0;

    &:focus-within {
        outline: 1px solid ${(props) => props.theme.colors.greyScale4};
        color: ${(props) => props.theme.colors.white};
    }

    &::placeholder {
        color: ${(props) => props.theme.colors.greyScale5};
    }
`

const HowtoBox = styled.div`
    font-size: 14px;
    color: ${(props) => props.theme.colors.greyScale6};
    font-weight: 400;
    display: flex;
    grid-gap: 5px;
    align-items: centeR;
    cursor: pointer;

    & * {
        cursor: pointer;
    }
`

const OutputSwitcherContainer = styled.div`
    display: flex;
    border-radius: 6px;
    border: 1px solid ${(props) => props.theme.colors.greyScale2};
    width: fit-content;
`

const OutputSwitcher = styled.div<{
    outputFormatSelected: boolean
}>`
    display: flex;
    color: ${(props) => props.theme.colors.greyScale7};
    padding: 5px 10px;
    font-size: 12px;
    cursor: pointer;

    ${(props) =>
        props.outputFormatSelected &&
        css`
            background: ${(props) => props.theme.colors.greyScale2};
        `}

    ${(props) =>
        props.theme.variant === 'light' &&
        css`
            color: ${(props) => props.theme.colors.greyScale5};
        `};
`

const ButtonBox = styled.div`
    display: flex;
    grid-gap: 10px;
    align-items: center;
    justify-self: flex-end;
`

interface TemplateEditorProps {
    template?: Template
    isNew?: boolean

    onClickSave: () => void
    onClickCancel: () => void
    onClickDelete: () => void
    onClickHowto: () => void

    onTitleChange: (s: string) => void
    onOutputFormatChange: (s: Template['outputFormat']) => void
    onCodeChange: (s: string) => void
}

export default class TemplateEditor extends PureComponent<TemplateEditorProps> {
    private get isSaveDisabled(): boolean {
        return !this.props.template?.title.length
    }

    componentDidMount(): void {
        let textarea

        const sidebarContainer = document.getElementById(
            'memex-sidebar-container',
        )
        const sidebar = sidebarContainer?.shadowRoot.getElementById(
            'annotationSidebarContainer',
        )
        const test = sidebarContainer?.shadowRoot.getElementById(
            'CopyPasterTextArea',
        )

        if (sidebar != null) {
            textarea = sidebar.querySelector('#CopyPasterTextArea')
        } else {
            textarea = document.getElementById('CopyPasterTextArea')
        }

        if (textarea != null) {
            textarea.style.height = 'auto'
            textarea.style.height = textarea.scrollHeight + 'px'
        }
    }

    render() {
        const { template } = this.props

        return (
            <>
                <Header>
                    <SectionTitle>
                        {this.props.isNew
                            ? 'Add New Template'
                            : 'Edit Template'}
                    </SectionTitle>
                    <ButtonBox>
                        <Icon
                            filePath={icons.removeX}
                            heightAndWidth="18px"
                            padding={'5px'}
                            onClick={this.props.onClickCancel}
                        />

                        <Icon
                            filePath={icons.check}
                            color="prime1"
                            heightAndWidth="20px"
                            onClick={this.props.onClickSave}
                        />
                    </ButtonBox>
                </Header>

                <TextInputBox>
                    <TextInput
                        type="text"
                        placeholder="Title"
                        className={styles.titleInput}
                        value={template?.title}
                        onKeyDown={(e) => e.stopPropagation()}
                        onChange={(e) =>
                            this.props.onTitleChange(e.target.value)
                        }
                        height="30px"
                    />
                    <OutputSwitcherContainer>
                        <OutputSwitcher
                            onClick={() =>
                                this.props.onOutputFormatChange('markdown')
                            }
                            outputFormatSelected={
                                this.props.template?.outputFormat ===
                                    'markdown' ||
                                this.props.template?.outputFormat == null
                            }
                        >
                            Plain Text
                        </OutputSwitcher>
                        <OutputSwitcher
                            onClick={() =>
                                this.props.onOutputFormatChange('rich-text')
                            }
                            outputFormatSelected={
                                this.props.template?.outputFormat ===
                                'rich-text'
                            }
                        >
                            Rich Text
                        </OutputSwitcher>
                    </OutputSwitcherContainer>
                    <TextAreaContainer
                        placeholder="Code"
                        className={styles.textArea}
                        value={template?.code ?? ''}
                        onKeyDown={(e) => e.stopPropagation()}
                        onChange={(e) =>
                            this.props.onCodeChange(e.target.value)
                        }
                        markedUpEditor={true}
                        rows={5}
                    />
                </TextInputBox>

                <FlexContainer>
                    <HowtoBox onClick={this.props.onClickHowto}>
                        <Icon
                            filePath={icons.helpIcon}
                            heightAndWidth="16px"
                            hoverOff
                        />
                        How to write templates
                    </HowtoBox>
                    {!this.props.isNew && (
                        <Button
                            danger
                            onClick={() => this.props?.onClickDelete()}
                        >
                            Delete
                        </Button>
                    )}
                </FlexContainer>
            </>
        )
    }
}

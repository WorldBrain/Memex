import React, { PureComponent } from 'react'
import { Template } from '../types'
import styled, { css } from 'styled-components'
import { LesserLink } from 'src/common-ui/components/design-library/actions/LesserLink'
import * as icons from 'src/common-ui/components/design-library/icons'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'

const styles = require('./TemplateEditorStyles.css')

const FlexContainer = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    padding: 5px 15px 10px 15px;
`

const TextInputBox = styled.div`
    padding: 10px 10px;
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
    padding: 10px 15px 10px 15px;
    height: 30px;
    align-items: center;
    border-bottom: 1px solid ${(props) => props.theme.colors.lightgrey};
`

const SectionTitle = styled.div`
    color: ${(props) => props.theme.colors.darkerText};
    font-size: 14px;
    font-weight: bold;
`

const TextInput = styled.input`
    outline: none;
    height: fill-available;
    width: fill-available;
    color: ${(props) => props.theme.colors.darkerText};
    font-size: 14px;
    border: none;
    background: ${(props) => props.theme.colors.backgroundColorDarker};

    &::placeholder {
        color: ${(props) => props.theme.colors.lighterText};
    }
`

const TextArea = styled.textarea`
    outline: none;
    height: fill-available;
    width: fill-available;
    color: ${(props) => props.theme.colors.darkerText};
    font-size: 14px;
    border: none;
    background: ${(props) => props.theme.colors.backgroundColorDarker};
    margin: 0;

    &::placeholder {
        color: ${(props) => props.theme.colors.lighterText};
    }
`

const HowtoBox = styled.div`
    font-size: 14px;
    color: ${(props) => props.theme.colors.normalText};
    font-weight: 400;
    display: flex;
    grid-gap: 5px;
    align-items: centeR;
    cursor: pointer;

    & * {
        cursor: pointer;
    }
`

interface TemplateEditorProps {
    template?: Template
    isNew?: boolean

    onClickSave: () => void
    onClickCancel: () => void
    onClickDelete: () => void
    onClickHowto: () => void

    onTitleChange: (s: string) => void
    onCodeChange: (s: string) => void
}

export default class TemplateEditor extends PureComponent<TemplateEditorProps> {
    private get isSaveDisabled(): boolean {
        return !this.props.template?.title.length
    }

    render() {
        const { template } = this.props

        return (
            <>
                <Header>
                    <Icon
                        filePath={icons.close}
                        heightAndWidth="12px"
                        padding={'6px'}
                        onClick={this.props.onClickCancel}
                    />
                    <SectionTitle>
                        {this.props.isNew ? 'Add New' : 'Edit'}
                    </SectionTitle>
                    <Icon
                        filePath={icons.check}
                        color="purple"
                        heightAndWidth="16px"
                        onClick={this.props.onClickSave}
                    />
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
                    />
                    <TextArea
                        placeholder="Code"
                        className={styles.textArea}
                        value={template?.code ?? ''}
                        onKeyDown={(e) => e.stopPropagation()}
                        onChange={(e) =>
                            this.props.onCodeChange(e.target.value)
                        }
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

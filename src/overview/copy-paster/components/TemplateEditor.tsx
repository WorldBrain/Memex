import React, { PureComponent } from 'react'
import { Template } from '../types'
import styled, { css } from 'styled-components'
import TextInputControlled from 'src/common-ui/components/TextInputControlled'
import { LesserLink } from 'src/common-ui/components/design-library/actions/LesserLink'

const styles = require('./TemplateEditorStyles.css')

const FlexContainer = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    padding: 10px 15px 5px 15px;
`

const TextInputBox = styled.div`
    padding: 0px 10px;
`

const HeaderText = styled.div`
    font-family: Poppins;
    font-style: normal;
    font-weight: bold;
    font-size: 14px;
    color: #3a2f45;
`

const ButtonContainer = styled.div`
    display: flex;
    flex-direction: row;
`

const Button = styled.button`
    font-family: Poppins;
    font-style: normal;
    font-weight: normal;
    font-size: 14px;
    color: #3a2f45;
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

interface TemplateEditorProps {
    template?: Template

    onClickSave: () => void
    onClickCancel: () => void
    onClickDelete: () => void
    onClickHowto: () => void

    onTitleChange: (s: string) => void
    onCodeChange: (s: string) => void
}

export default class TemplateEditor extends PureComponent<TemplateEditorProps> {
    render() {
        const { template } = this.props
        const isNewTemplate = template === undefined

        const isSaveDisabled = template.title.length === 0

        return (
            <div>
                <FlexContainer>
                    <HeaderText>
                        {isNewTemplate ? 'Add New' : 'Edit'}
                    </HeaderText>

                    <ButtonContainer>
                        <Button danger onClick={this.props.onClickCancel}>
                            Cancel
                        </Button>
                        <Button
                            disabled={isSaveDisabled}
                            onClick={this.props.onClickSave}
                        >
                            Save
                        </Button>
                    </ButtonContainer>
                </FlexContainer>

                <TextInputBox>
                    <TextInputControlled
                        autoFocus
                        placeholder="Title"
                        type="input"
                        defaultValue={template ? template.title : ''}
                        className={styles.titleInput}
                        onChange={this.props.onTitleChange}
                    />
                    <TextInputControlled
                        placeholder="Code"
                        className={styles.textArea}
                        defaultValue={template ? template.code : ''}
                        onChange={this.props.onCodeChange}
                        rows={5}
                    />
                </TextInputBox>

                <FlexContainer>
                    <LesserLink
                        label={'How to write templates'}
                        onClick={this.props.onClickHowto}
                    />
                    {!isNewTemplate && (
                        <Button
                            small
                            danger
                            onClick={() => this.props?.onClickDelete()}
                        >
                            Delete
                        </Button>
                    )}
                </FlexContainer>
            </div>
        )
    }
}

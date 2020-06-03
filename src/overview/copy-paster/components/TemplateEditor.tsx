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
`

const HeaderText = styled.h2`
    font-family: Poppins;
    font-style: normal;
    font-weight: bold;
    font-size: 16px;
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
    font-size: 16px;
    color: #3a2f45;
    cursor: pointer;

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
                        <Button onClick={this.props.onClickSave}>Save</Button>
                    </ButtonContainer>
                </FlexContainer>

                <div>
                    <TextInputControlled
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
                </div>

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

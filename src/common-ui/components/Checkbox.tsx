import * as React from 'react'
import cx from 'classnames'
import styled from 'styled-components'

const styles = require('./Checkbox.css')
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import * as icons from 'src/common-ui/components/design-library/icons'

export type CheckboxToggle = (
    event: React.SyntheticEvent<HTMLInputElement>,
) => void

export interface Props {
    id?: string
    handleChange: CheckboxToggle
    name?: string
    isChecked: boolean
    isDisabled?: boolean
    containerClass?: string
    textClass?: string
    inputClass?: string
    labelClass?: string
    mode?: 'radio' | 'multiSelect'
    size?: number
}

class Checkbox extends React.PureComponent<Props> {
    private get labelClass() {
        return cx(styles.label, this.props.labelClass, {
            [styles.disabledLabel]: !!this.props.isDisabled,
        })
    }

    private get iconClass() {
        return cx(styles.icon, {
            [styles.checkedIcon]: !!this.props.isChecked,
            [styles.disabledIcon]: !!this.props.isDisabled,
        })
    }

    render() {
        return (
            <Container>
                <LabelContainer htmlFor={this.props.id}>
                    <InputContainer
                        type="checkbox"
                        checked={this.props.isChecked}
                        onChange={this.props.handleChange}
                        id={this.props.id}
                        disabled={this.props.isDisabled}
                        name={this.props.name}
                    />
                    <LabelText>
                        <LabelCheck
                            size={this.props.size}
                            mode={this.props.mode}
                            isChecked={this.props.isChecked}
                        >
                            <Icon
                                filePath={icons.check}
                                color="white"
                                heightAndWidth={'14px'}
                                hoverOff
                            />
                        </LabelCheck>
                        <ChildrenBox mode={this.props.mode}>
                            {this.props.children}
                        </ChildrenBox>
                    </LabelText>
                </LabelContainer>
            </Container>
        )
    }
}

const Container = styled.div`
    cursor: pointer;
`

const ChildrenBox = styled.span<{ mode }>`
    color: ${(props) => props.theme.colors.darkerText};
    border-radius: ${(props) => (props.mode === 'radio' ? '20px' : '3px')};
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    cursor: pointer;

    & * {
        cursor: pointer;
    }
`

const LabelContainer = styled.label`
    display: flex;
    align-items: center;
    width: 100%;
    cursor: pointer;
`

const InputContainer = styled.input`
    display: none;
    padding: 2px;
    border: 2px solid ${(props) => props.theme.colors.purple};
    cursor: pointer;
`

const LabelText = styled.span`
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    width: inherit;
    cursor: pointer;

    &:hover {
        color: black;
    }
`

const LabelCheck = styled.span<{ isChecked; mode; size }>`
    border-radius: ${(props) => (props.mode === 'radio' ? '20px' : '3px')};
    border: 2px solid ${(props) => props.theme.colors.purple}70;
    background: ${(props) =>
        props.isChecked ? props.theme.colors.purple : 'white'};
    vertical-align: middle;
    margin-right: 15px;
    width: ${(props) => (props.size ? props.size + 'px' : '24px')};
    height: ${(props) => (props.size ? props.size + 'px' : '24px')};
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;

    & * {
        cursor: pointer !important;
    }

    &:hover {
        outline: none;
    }

    &:focus {
        outline: none;
    }
`

export default Checkbox

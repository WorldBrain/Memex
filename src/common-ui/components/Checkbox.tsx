import * as React from 'react'
import cx from 'classnames'
import styled, { ThemeProps, css } from 'styled-components'

const styles = require('./Checkbox.css')
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import * as icons from 'src/common-ui/components/design-library/icons'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'

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
    label?: string
    subLabel?: string
    zIndex?: number
    isLoading?: boolean
    fontSize?: number
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
            <LabelContainer zIndex={this.props.zIndex} htmlFor={this.props.id}>
                <LabelText>
                    <InputContainer
                        type="checkbox"
                        checked={this.props.isChecked}
                        onChange={this.props.handleChange}
                        id={this.props.id}
                        disabled={this.props.isDisabled}
                        name={this.props.name}
                    />
                    {this.props.isLoading ? (
                        <LoadingIndicator size={16} />
                    ) : (
                        <LabelCheck
                            size={this.props.size}
                            mode={this.props.mode}
                            isChecked={this.props.isChecked}
                        >
                            {this.props.isChecked && (
                                <Icon
                                    filePath={icons.check}
                                    color="black"
                                    heightAndWidth={'14px'}
                                    hoverOff
                                />
                            )}
                        </LabelCheck>
                    )}
                    {this.props.label && (
                        <LabelContentBox>
                            <LabelTitle fontSize={this.props.fontSize}>
                                {this.props.label}
                            </LabelTitle>
                            <SubLabel>{this.props.subLabel}</SubLabel>
                        </LabelContentBox>
                    )}
                    {this.props.children && (
                        <ChildrenBox mode={this.props.mode}>
                            {this.props.children}
                        </ChildrenBox>
                    )}
                </LabelText>
            </LabelContainer>
        )
    }
}

const Container = styled.div`
    cursor: pointer;
`

const LabelContentBox = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    margin-left: 10px;
`
const LabelTitle = styled.div<{ fontSize: number }>`
    color: ${(props) => props.theme.colors.greyScale6};
    font-weight: 300;
    font-size: ${(props) => (props.fontSize ? props.fontSize + 'px' : '16px')};
    white-space: nowrap;
`

const SubLabel = styled.div`
    color: ${(props) => props.theme.colors.greyScale5};
    font-weight: 300;
    font-size: ${(props) => (props.fontSize ? props.fontSize + 'px' : '14px')};
    white-space: nowrap;
`

const ChildrenBox = styled.span<{ mode }>`
    color: ${(props) => props.theme.colors.greyScale1};
    border-radius: ${(props) => (props.mode === 'radio' ? '20px' : '3px')};
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    flex: 1;

    & * {
        cursor: pointer;
    }
`

const LabelContainer = styled.label<{ zIndex?: number }>`
    display: flex;
    align-items: center;
    width: 100%;
    cursor: pointer;
    z-index: ${(props) => props.zIndex};
`

const InputContainer = styled.input`
    display: none;
    padding: 2px;
    border: 2px solid ${(props) => props.theme.colors.black};
    cursor: pointer;
`

const LabelText = styled.span<{ fontSize }>`
    font-size: ${(props) => (props.fontSize ? props.fontSize + 'px' : '0.9em')};
    display: flex;
    align-items: center;
    width: inherit;
    cursor: pointer;
    width: fill-available;
    height: fill-available;

    &:hover {
        color: ${(props) => props.theme.colors.black};
    }
`

const LabelCheck = styled.span<{ isChecked; mode; size }>`
    border-radius: ${(props) => (props.mode === 'radio' ? '20px' : '5px')};
    border: 2px solid
        ${(props) =>
            props.isChecked
                ? props.theme.colors.white
                : props.theme.colors.greyScale2};
    background: ${(props) =>
        props.isChecked
            ? props.theme.colors.white
            : props.theme.colors.greyScale2};
    vertical-align: middle;
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

    ${(props) =>
        props.theme.variant === 'light' &&
        css<any>`
            background-color: ${(props) =>
                props.isChecked
                    ? props.theme.colors.greyScale4
                    : props.theme.colors.greyScale3};
            border-color: ${(props) =>
                props.isChecked
                    ? props.theme.colors.greyScale4
                    : props.theme.colors.greyScale3};
        `};
`

export default Checkbox

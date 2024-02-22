import * as React from 'react'
import cx from 'classnames'
import styled, { ThemeProps, css } from 'styled-components'

const styles = require('./Checkbox.css')
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import * as icons from 'src/common-ui/components/design-library/icons'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'
import { ColorThemeKeys } from '@worldbrain/memex-common/lib/common-ui/styles/types'

export type CheckboxToggle = (
    event: React.SyntheticEvent<HTMLInputElement>,
) => void

export interface Props {
    id?: string
    handleChange?: CheckboxToggle
    name?: string
    isChecked: boolean
    isDisabled?: boolean
    containerClass?: string
    textClass?: string
    inputClass?: string
    labelClass?: string
    mode?: 'radio' | 'multiSelect'
    size?: number
    label?: string | JSX.Element
    subLabel?: string
    zIndex?: number
    isLoading?: boolean
    fontSize?: number
    checkBoxColor?: ColorThemeKeys
    borderColor?: ColorThemeKeys
    width?: string
    textPosition?: 'left' | 'right'
    fontColor?: ColorThemeKeys
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
            <LabelContainer
                width={this.props.width}
                zIndex={this.props.zIndex}
                htmlFor={this.props.id}
            >
                <LabelText
                    textPosition={this.props.textPosition}
                    fontSize={this.props.fontSize}
                >
                    <InputContainer
                        type="checkbox"
                        checked={this.props.isChecked}
                        onChange={this.props.handleChange}
                        id={this.props.id}
                        disabled={this.props.isDisabled}
                        name={this.props.name}
                    />
                    <CheckBoxContainer size={this.props.size + 4}>
                        {this.props.isLoading ? (
                            <LoadingIndicator size={this.props.size - 2} />
                        ) : (
                            <LabelCheck
                                size={this.props.size}
                                mode={this.props.mode}
                                isChecked={this.props.isChecked}
                                checkBoxColor={this.props.checkBoxColor}
                                borderColor={this.props.borderColor}
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
                    </CheckBoxContainer>
                    {this.props.label && (
                        <LabelContentBox>
                            <LabelTitle
                                color={this.props.fontColor}
                                fontSize={this.props.fontSize}
                            >
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
`
const LabelTitle = styled.div<{ fontSize: number }>`
    color: ${(props) => props.theme.colors.greyScale6};
    font-weight: 300;
    font-size: ${(props) => (props.fontSize ? props.fontSize + 'px' : '16px')};
    white-space: nowrap;
`

const SubLabel = styled.div<{
    fontSize?: number
}>`
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

const LabelContainer = styled.label<{ zIndex?: number; width?: string }>`
    display: flex;
    align-items: center;
    width: ${(props) => (props.width ? props.width : 'fit-content')};
    cursor: pointer;
    z-index: ${(props) => props.zIndex};
`

const InputContainer = styled.input`
    display: none;
    padding: 2px;
    border: 2px solid ${(props) => props.theme.colors.black};
    cursor: pointer;
`

const LabelText = styled.span<{ fontSize; textPosition }>`
    font-size: ${(props) => (props.fontSize ? props.fontSize + 'px' : '0.9em')};
    display: flex;
    align-items: center;
    width: inherit;
    cursor: pointer;
    width: fill-available;
    height: fill-available;
    justify-content: center;
    grid-gap: ${(props) => (props.fontSize < 14 ? '10px' : '15px')};

    &:hover {
        color: ${(props) => props.theme.colors.black};
    }

    ${(props) =>
        props.textPosition === 'left' &&
        css`
            flex-direction: row-reverse;
        `}
`

const CheckBoxContainer = styled.div<{ size: number }>`
    display: flex;
    align-items: center;
    align-items: center;
    width: ${(props) => (props.size ? props.size + 'px' : '24px')};
    height: ${(props) => (props.size ? props.size + 'px' : '24px')};
`

const LabelCheck = styled.span<{
    isChecked
    mode
    size
    checkBoxColor
    borderColor
}>`
    border-radius: ${(props) => (props.mode === 'radio' ? '20px' : '5px')};
    outline: 2px solid
        ${(props) =>
            props.isChecked
                ? props.theme.colors.white
                : props.theme.colors.greyScale3};
    background: ${(props) =>
        props.isChecked
            ? props.theme.colors.white
            : props.theme.colors[props.checkBoxColor] ?? 'greyScale2'};
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
                    ? props.theme.colors.greyScale5
                    : props.theme.colors.greyScale4};
            border-color: ${(props) =>
                props.isChecked
                    ? props.theme.colors.greyScale5
                    : props.theme.colors.greyScale4};
        `};
    ${(props) =>
        props.borderColor &&
        css<any>`
            outline: 1px solid
                ${(props) => props.theme.colors[props.borderColor]};
            border: none;

            &:hover {
                outline: 1px solid ${(props) => props.theme.colors.greyScale4};
            }
        `};
`

export default Checkbox

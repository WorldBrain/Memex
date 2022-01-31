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
    id: string
    handleChange: CheckboxToggle
    name?: string
    isChecked: boolean
    isDisabled?: boolean
    containerClass?: string
    textClass?: string
    inputClass?: string
    labelClass?: string
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
            <div className={cx(styles.container, this.props.containerClass)}>
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
                        <LabelCheck isChecked={this.props.isChecked}>
                            <Icon
                                filePath={icons.check}
                                color="white"
                                heightAndWidth={'14px'}
                                hoverOff
                            />
                        </LabelCheck>
                        <ChildrenBox>{this.props.children}</ChildrenBox>
                    </LabelText>
                </LabelContainer>
            </div>
        )
    }
}

const ChildrenBox = styled.span`
    color: ${(props) => props.theme.colors.darkerText};
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
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
`

const LabelText = styled.span`
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    width: inherit;

    &:hover {
        color: black;
    }
`

const LabelCheck = styled.span<{ isChecked }>`
    border-radius: 3px;
    border: 2px solid ${(props) => props.theme.colors.purple};
    background: ${(props) =>
        props.isChecked ? props.theme.colors.purple : 'white'};
    vertical-align: middle;
    margin-right: 15px;
    width: 25px;
    height: 25px;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
        outline: none;
    }

    &:focus {
        outline: none;
    }
`

export default Checkbox

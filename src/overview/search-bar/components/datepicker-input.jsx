import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { Icon } from 'src/dashboard-refactor/styled-components'
import * as icons from 'src/common-ui/components/design-library/icons'
import styled from 'styled-components'
import { TooltipBox } from '@worldbrain/memex-common/lib/common-ui/components/tooltip-box'

class DatePickerInput extends PureComponent {
    static propTypes = {
        value: PropTypes.string,
        placeholder: PropTypes.string,
        name: PropTypes.string,
        onChange: PropTypes.func,
        onSearchEnter: PropTypes.func,
        clearFilter: PropTypes.func,
        disabled: PropTypes.bool,
        autoFocus: PropTypes.bool,
    }
    render() {
        return (
            <DatepickerInput>
                <TooltipBox
                    tooltipText="You can also type e.g. 'last Friday 10am'"
                    placement="bottom"
                >
                    <Input
                        name={this.props.name}
                        value={this.props.value}
                        placeholder={this.props.placeholder}
                        onChange={(e) => this.props.onChange(e)}
                        onKeyDown={(e) => this.props.onSearchEnter(e)}
                        disabled={this.props.disabled}
                        autoFocus={this.props.autoFocus}
                    />
                </TooltipBox>
                <ClearButtonContainer>
                    {this.props.value && (
                        <TooltipBox
                            tooltipText="Clear Selection"
                            placement="bottom"
                        >
                            <Icon
                                path={icons.removeX}
                                heightAndWidth={'14px'}
                                onClick={(e) => this.props.clearFilter(e)}
                            />
                        </TooltipBox>
                    )}
                </ClearButtonContainer>
            </DatepickerInput>
        )
    }
}

const ClearButtonContainer = styled.div`
    width: 30px;
`

const DatepickerInput = styled.div`
    display: flex;
    align-items: center;
`

const Input = styled.input`
    border-radius: 3px;
    margin-right: 10px;
    margin-left: 10px;
    outline: none;
    background: ${(props) => props.theme.colors.darkhover};
    color: ${(props) => props.theme.colors.normalText};
    border: none;
    height: 22px;
    padding: 6px;
    font-size: 14px;
    width: 150px;

    &:focus {
        outline: 1px solid ${(props) => props.theme.colors.greyScale4};
    }
`

export default DatePickerInput

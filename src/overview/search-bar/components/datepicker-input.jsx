import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import ButtonTooltip from 'src/common-ui/components/button-tooltip'
import { Icon } from 'src/dashboard-refactor/styled-components'
import * as icons from 'src/common-ui/components/design-library/icons'
import styled from 'styled-components'

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
                <ButtonTooltip
                    tooltipText="You can also type e.g. 'last Friday 10am'"
                    position="bottom"
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
                </ButtonTooltip>
                <ClearButtonContainer>
                    {this.props.value && (
                        <ButtonTooltip
                            tooltipText="Clear Selection"
                            position="bottom"
                        >
                            <Icon
                                path={icons.removeX}
                                heightAndWidth={'14px'}
                                onClick={(e) => this.props.clearFilter(e)}
                            />
                        </ButtonTooltip>
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
    background: ${(props) => props.theme.colors.backgroundColorDarker};
    color: ${(props) => props.theme.colors.normalText};
    border: none;
    height: 25px;
    padding: 6px;
    font-size: 14px;
    width: 150px;
`

export default DatePickerInput

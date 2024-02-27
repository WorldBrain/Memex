import React from 'react'

import Checkbox from 'src/common-ui/components/Checkbox'
import * as utils from 'src/in-page-ui/tooltip/utils'
import * as tooltipConstants from 'src/in-page-ui/tooltip/constants'
import styled from 'styled-components'
import SettingSection from '@worldbrain/memex-common/lib/common-ui/components/setting-section'

class Tooltip extends React.Component {
    state = {
        tooltip: tooltipConstants.TOOLTIP_DEFAULT_OPTION,
        position: tooltipConstants.POSITION_DEFAULT_OPTION,
    }

    async componentDidMount() {
        const tooltip = await utils.getTooltipState()
        const position = await utils.getPositionState()
        this.setState({
            tooltip,
            position,
        })
    }

    toggleTooltip = async () => {
        const tooltip = !this.state.tooltip
        await utils.setTooltipState(tooltip)
        this.setState({ tooltip })
    }

    togglePosition = async (e) => {
        const position = e.target.value
        await utils.setPositionState(position)
        this.setState({ position })
    }

    render() {
        return (
            <SettingSection
                title={'Highlights & Annotations'}
                description={
                    'Show a tooltip when selecting Text on web pages and PDFs, or use keyboard shortcuts'
                }
                icon={'highlight'}
            >
                <CheckBoxRow>
                    <Checkbox
                        id="show-memex-link"
                        isChecked={this.state.tooltip}
                        handleChange={this.toggleTooltip}
                        label={'Show Tooltip'}
                    />
                </CheckBoxRow>

                {/*

                //needs to be fixed. setting removed until then

                <div className={styles.extraSettings}>
                    Position tooltip below
                    <select
                        className={styles.dropdown}
                        value={this.state.position}
                        onChange={this.togglePosition}
                        disabled={!this.state.tooltip}
                    >
                        <option value="mouse">mouse pointer</option>
                        <option value="text">selected text</option>
                    </select>
                </div>
                */}
            </SettingSection>
        )
    }
}
const CheckBoxRow = styled.div`
    height: 50px;
    margin-left: -10px;
    padding: 10px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: fill-available;
    cursor: pointer;

    &:hover {
        outline: 1px solid ${(props) => props.theme.colors.greyScale3};
    }
`

export default Tooltip

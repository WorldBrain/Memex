import React from 'react'

// import Checkbox from './Checkbox'
import { Checkbox } from 'src/common-ui/components'
import * as utils from 'src/in-page-ui/tooltip/utils'
import * as tooltipConstants from 'src/in-page-ui/tooltip/constants'
import styled from 'styled-components'
import * as icons from 'src/common-ui/components/design-library/icons'

import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'

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
            <Section>
                <SectionCircle>
                    <Icon
                        filePath={icons.highlighterEmpty}
                        heightAndWidth="34px"
                        color="purple"
                        hoverOff
                    />
                </SectionCircle>
                <SectionTitle>Highlights & Annotations</SectionTitle>
                <InfoText>
                    Show a tooltip when selecting Text on web pages and PDFs.
                    <br />
                    Alternatively you can use Keyboard Shortcuts.
                </InfoText>
                <Checkbox
                    id="show-memex-link"
                    isChecked={this.state.tooltip}
                    handleChange={this.toggleTooltip}
                >
                    Show Tooltip
                </Checkbox>

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
            </Section>
        )
    }
}

const Section = styled.div`
    background: #ffffff;
    box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.05);
    border-radius: 12px;
    padding: 50px;
    margin-bottom: 30px;
`

const SectionCircle = styled.div`
    background: ${(props) => props.theme.colors.backgroundHighlight};
    border-radius: 100px;
    height: 80px;
    width: 80px;
    margin-bottom: 30px;
    display: flex;
    justify-content: center;
    align-items: center;
`

const SectionTitle = styled.div`
    color: ${(props) => props.theme.colors.darkerText};
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 10px;
`

const InfoText = styled.div`
    color: ${(props) => props.theme.colors.normalText};
    font-size: 14px;
    margin-bottom: 40px;
    font-weight: 500;
`

export default Tooltip

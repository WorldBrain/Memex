import React from 'react'

import { Checkbox } from 'src/common-ui/components'
import * as utils from '../../../sidebar-overlay/utils'
import styled from 'styled-components'
import * as icons from 'src/common-ui/components/design-library/icons'

import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'

class Ribbon extends React.Component {
    state = {
        ribbon: true,
    }

    async componentDidMount() {
        const ribbon = await utils.getSidebarState()
        this.setState({
            ribbon,
        })
    }

    toggleRibbon = async () => {
        const ribbon = !this.state.ribbon
        await utils.setSidebarState(ribbon)
        this.setState({ ribbon })
    }

    render() {
        return (
            <Section>
                <SectionCircle>
                    <Icon
                        filePath={icons.openSidebar}
                        heightAndWidth="34px"
                        color="purple"
                        hoverOff
                    />
                </SectionCircle>
                <SectionTitle>Quick Action Sidebar</SectionTitle>
                <InfoText>
                    Show a sidebar with the key interaction, like saving pages,
                    adding to Spaces or viewing your annotations when hovering
                    in the top right corner of a web page or PDF.
                    <br />
                    Alternatively you can use Keyboard Shortcuts.
                </InfoText>
                <Checkbox
                    id="show-memex-ribbon"
                    isChecked={this.state.ribbon}
                    handleChange={this.toggleRibbon}
                >
                    Enable
                </Checkbox>
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

export default Ribbon

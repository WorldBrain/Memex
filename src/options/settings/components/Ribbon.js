import React from 'react'

import Checkbox from 'src/common-ui/components/Checkbox'
import * as utils from '../../../sidebar-overlay/utils'
import styled from 'styled-components'
import SettingSection from '@worldbrain/memex-common/lib/common-ui/components/setting-section'

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
            <SettingSection
                title={'Mini Sidebar'}
                description={
                    ' Show a sidebar with the key interaction when hovering to the right of the screen.'
                }
                icon={'quickActionRibbon'}
            >
                <CheckBoxRow>
                    <Checkbox
                        id="show-memex-ribbon"
                        isChecked={this.state.ribbon}
                        handleChange={this.toggleRibbon}
                        label={'Enable'}
                    />
                </CheckBoxRow>
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

export default Ribbon

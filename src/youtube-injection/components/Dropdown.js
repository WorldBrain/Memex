import React from 'react'
import PropTypes from 'prop-types'

import { remoteFunction } from 'src/util/webextensionRPC'
import styled from 'styled-components'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'

class Dropdown extends React.Component {
    static propTypes = {
        remove: PropTypes.func.isRequired,
        rerender: PropTypes.func.isRequired,
        closeDropdown: PropTypes.func.isRequired,
    }

    openOptionsRPC = remoteFunction('openOptionsTab')

    openSettings = () => this.openOptionsRPC('settings')

    handleClickOutside = () => {
        this.props.closeDropdown()
    }

    render() {
        return (
            <DropDownContainer onMouseLeave={() => this.props.closeDropdown()}>
                <DropDownItem onClick={this.openSettings}>
                    <Icon
                        filePath={'settings'}
                        heightAndWidth="16px"
                        hoverOff
                    />
                    Settings
                </DropDownItem>
                <DropDownItem onClick={this.props.rerender}>
                    <Icon filePath={'reload'} heightAndWidth="16px" hoverOff />
                    Change Position
                </DropDownItem>
                <DropDownItem onClick={this.props.remove}>
                    <Icon filePath={'removeX'} heightAndWidth="16px" hoverOff />
                    Disable
                </DropDownItem>
            </DropDownContainer>
        )
    }
}

const DropDownContainer = styled.div`
    box-shadow: 0px 22px 26px 18px rgba(0, 0, 0, 0.03);
    height: fit-content;
    padding: 10px;
    width: 200px;
    position: absolute;
    right: 0px;
    top: 50px;
    background: white;
    z-index: 1000000;
    background: ${(props) => props.theme.colors.greyScale1};
    border-radius: 10px;
    border: 1px solid ${(props) => props.theme.colors.greyScale3};
`
const DropDownItem = styled.div`
    height: 40px;
    padding: 0 10px;
    color: ${(props) => props.theme.colors.white};
    display: flex;
    grid-gap: 10px;
    align-items: center;
    cursor: pointer;
    font-size: 14px;
    border-radius: 8px;

    & * {
        cursor: pointer;
    }

    &:hover {
        outline: 1px solid ${(props) => props.theme.colors.greyScale3};
    }
`

export default Dropdown

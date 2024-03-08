import React from 'react'
import PropTypes from 'prop-types'

import styled from 'styled-components'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import { PopoutBox } from '@worldbrain/memex-common/lib/common-ui/components/popout-box'

class Dropdown extends React.Component {
    static propTypes = {
        remove: PropTypes.func.isRequired,
        rerender: PropTypes.func.isRequired,
        closeDropdown: PropTypes.func.isRequired,
        getRootElement: PropTypes.func.isRequired,
        settingsMenuRef: PropTypes.object.isRequired,
        openSettings: PropTypes.func.isRequired,
    }

    handleClickOutside = () => {
        this.props.closeDropdown()
    }

    render() {
        return (
            <PopoutBox
                closeComponent={this.props.closeDropdown}
                placement="bottom-end"
                getPortalRoot={this.props.getRootElement}
                targetElementRef={this.props.settingsMenuRef.current}
                offsetX={10}
                offsetY={10}
            >
                <DropDownContainer>
                    <DropDownItem onClick={this.props.openSettings}>
                        <Icon
                            filePath={'settings'}
                            heightAndWidth="16px"
                            hoverOff
                        />
                        Settings
                    </DropDownItem>
                    <DropDownItem onClick={this.props.rerender}>
                        <Icon
                            filePath={'reload'}
                            heightAndWidth="16px"
                            hoverOff
                        />
                        Change Position
                    </DropDownItem>
                    <DropDownItem onClick={this.props.remove}>
                        <Icon
                            filePath={'removeX'}
                            heightAndWidth="16px"
                            hoverOff
                        />
                        Disable
                    </DropDownItem>
                </DropDownContainer>
            </PopoutBox>
        )
    }
}

const DropDownContainer = styled.div`
    height: fit-content;
    padding: 10px;
    width: 200px;
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

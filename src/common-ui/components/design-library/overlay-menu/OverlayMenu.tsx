import React, { ComponentType, ElementType } from 'react'
import { MenuItem } from 'src/common-ui/components/design-library/overlay-menu/MenuItem'
import styled from 'styled-components'

interface Props {
    menuHeader: any
    menuItems: any[]
}

interface State {
    hover: boolean
}

export class OverlayMenu extends React.Component<Props, State> {
    state = {
        hover: false,
    }

    onMouseEnterHandler = async () => {
        this.setState({
            hover: true,
        })
    }

    onMouseLeaveHandler = () => {
        this.setState({
            hover: false,
        })
    }

    render() {
        return (
            <StyledOverlayMenu
                onMouseEnter={this.onMouseEnterHandler}
                onMouseLeave={this.onMouseLeaveHandler}
            >
                <StyledMenuHeader>{this.props.menuHeader}</StyledMenuHeader>

                <DivOverlayParent>
                    <DivOverlayChild>
                        {this.state.hover && (
                            <div>
                                {this.props.menuItems.map(item => (
                                    <MenuItem onClick={item.handler}>
                                        {' '}
                                        {item.label}
                                    </MenuItem>
                                ))}
                            </div>
                        )}
                    </DivOverlayChild>
                </DivOverlayParent>
            </StyledOverlayMenu>
        )
    }
}

const StyledOverlayMenu = styled.div`
    display: inline-flex;
    align-items: center;
    z-index: 2147483647;
`

const StyledMenuHeader = styled.div`
    padding: 3px 8px 3px 12px;
    display: flex;
    align-items: center;
    height: 25px;
    padding: 3px 8px 3px 8px;
    border-radius: 5px;
`

const DivOverlayParent = styled.div`
    position: relative;
    top: -100px;
`

const DivOverlayChild = styled.div`
    position: absolute;
    background: #ffffff;
    box-shadow: 0px 2px 6px rgba(0, 0, 0, 0.25);
    border-radius: 5px;
`

export default OverlayMenu

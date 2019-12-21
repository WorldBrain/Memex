import React from 'react'
import { MenuItem } from 'src/common-ui/components/design-library/overlay-menu/MenuItem'
import styled from 'styled-components'

interface Props {
    menuHeader: any
    menuItems: MenuItemType[]
}

export interface MenuItemType {
    label: string
    handler: () => void
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

    closeAnd = handler => () => {
        this.setState({
            hover: false,
        })
        handler()
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
                                        <MenuItem
                                            onClick={this.closeAnd(item.handler)}
                                            key={`overlayMenu-${item.label}`}
                                        >
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
    width: 100%;
    border-radius: 5px;
`

const StyledMenuHeader = styled.div`
    display: flex;
    align-items: center;
    border-radius: 5px;
    width: 100%;
    justify-content: center;
`

const DivOverlayParent = styled.div`
    position: relative;
    top: -60px;
    border-radius: 5px;
`

const DivOverlayChild = styled.div`
    position: absolute;
    background: #ffffff;
    box-shadow: 0px 2px 6px rgba(0, 0, 0, 0.25);
    border-radius: 5px;
`

export default OverlayMenu

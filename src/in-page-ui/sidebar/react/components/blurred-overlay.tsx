import React from 'react'
import styled from 'styled-components'

export interface Props {
    onOutsideClick?: () => void
}

export default class BlurredSidebarOverlay extends React.Component<Props> {
    render() {
        return (
            <>
                <OutsideDiv onClick={this.props.onOutsideClick} />
                <WrapperDiv>{this.props.children}</WrapperDiv>
            </>
        )
    }
}

const OutsideDiv = styled.div`
    position: fixed;
    z-index: 1;
    backdrop-filter: blur(1px);
    height: fill-available;
    width: 450px;
    right: 40px;
    top: 0;
`

const WrapperDiv = styled.div`
    position: relative;
    z-index: 2;
`

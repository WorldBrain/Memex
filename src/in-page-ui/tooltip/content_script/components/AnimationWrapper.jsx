import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
/*
TODO:
- Animate icons leaving out.
- Streamline animation flow using enter and exit animations
*/
class AnimationWrapper extends React.Component {
    static propTypes = {
        children: PropTypes.node.isRequired,
    }

    setRef = (node) => (this.container = node)

    render() {
        return (
            <AnimationContainer ref={this.setRef}>
                {this.props.children}
            </AnimationContainer>
        )
    }
}

const AnimationContainer = styled.div`
    display: flex;
    height: 100%;
    align-items: center;
    grid-gap: 10px;
    background: ${(props) => props.theme.colors.greyScale1};
    border-radius: 8px;
`

export default AnimationWrapper

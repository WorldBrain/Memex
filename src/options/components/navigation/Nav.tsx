import React from 'react'
import PropTypes from 'prop-types'
import styled, { css } from 'styled-components'

const Nav = ({ children }) => {
    return (
        <Root>
            <NavItem>{children}</NavItem>
        </Root>
    )
}

Nav.propTypes = {
    children: PropTypes.arrayOf(PropTypes.node).isRequired,
}

const Root = styled.div`
    max-width: 280px;
    min-width: 260px;
    height: 100vh;
    position: sticky;
    top: 0px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    border-right: 1px solid ${(props) => props.theme.colors.greyScale3};
    background-color: ${(props) => props.theme.colors.greyScale1};

    ${(props) =>
        props.theme.variant === 'light' &&
        css`
            border-color: ${(props) => props.theme.colors.greyScale3};
            box-shadow: ${(props) => props.theme.borderStyles.boxShadowRight};
        `};
`

const NavItem = styled.ul`
    padding-inline-start: 0px;
    color: ${(props) => props.theme.colors.white};
    display: flex;
    flex-direction: column;
`

export default Nav

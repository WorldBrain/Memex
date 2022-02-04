import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

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
    border-right: 1px solid ${(props) => props.theme.colors.lineGrey};
    background: white;
`

const NavItem = styled.ul`
    padding-inline-start: 0px;
`

export default Nav

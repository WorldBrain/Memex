// Styles for react-burger-menu.

const menuStyles = {
    // TODO: Check if the styles for `bmMenuWrap` are necessary, since
    // they're already being covered in `bmMenu`.
    bmMenuWrap: {
        top: 0,
        transition: 'all 0s',
    },
    bmMenu: {
        position: 'fixed',
        right: 0,
        top: 0,
        zIndex: 1100,
        width: '340px',
        height: '100%',
        transition: 'all 0s',
        boxShadow: '-4px 2px 20px 1px rgba(62, 185, 149, 0.0902)',
    },
    bmBurgerButton: {
        display: 'none',
    },
    bmCrossButton: {
        display: 'none',
    },
}

export default menuStyles

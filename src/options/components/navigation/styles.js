const title = {
    fontSize: '1.2em',
    fontWeight: '100',
    margin: '20px 0 20px 20px',
    color: '#666',
    paddingBottom: '10px',
    borderBottom: '1px solid #ccc'
};

const nav = {
    margin: '0',
    padding: '0',
    listStyle: 'none'
};

const navItem = {
    width: '100%',
    marginBottom: '10px'
};

const navLink = (isActive) => ({
    display: 'block',
    textDecoration: 'none',
    color: isActive ? '#333' : '#999',
    fontSize: '0.8em',
    padding: '5px 0 5px 20px',
    paddingLeft: isActive ? '15px' : '20px',
    borderLeft: isActive ? '5px solid #333' : 'none'
});

export default {
    root: {
        width: '180px'
    },
    title,
    nav,
    navItem,
    navLink
};

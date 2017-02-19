import React, { PropTypes } from 'react';
import styles from './styles';

const PageTitle = ({ title }) => (
    <div style={styles.root}>
        <h1 style={styles.title}>{ title }</h1>
    </div>
);

PageTitle.propTypes = {
    title: PropTypes.string.isRequired
};

export default PageTitle;
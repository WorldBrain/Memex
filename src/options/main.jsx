import React from 'react'
import ReactDOM from 'react-dom'
import { Router, Route, IndexRedirect, hashHistory } from 'react-router';

import Layout from './layout';
import Routes from './routes';

// Render the UI to the screen

ReactDOM.render(
    <Router history={hashHistory}>
        <Route path="/" component={Layout}>
            <IndexRedirect to="/settings" />
            { Routes.map(route => <Route path={route.pathname} component={route.component} />) }
        </Route>
    </Router>,
    document.getElementById('app')
)

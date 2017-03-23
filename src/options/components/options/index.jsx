import { Router, Route, IndexRedirect, hashHistory } from 'react-router'
import React from 'react'
import Layout from '../layout'
import Routes from '../../routes'

const Options = () => (
    <Router history={hashHistory}>
        <Route path="/" component={Layout}>
            <IndexRedirect to="/import" />
            {Routes.map(route => (
                <Route
                    key={route.pathname}
                    path={route.pathname}
                    component={route.component}
                />
            ))}
        </Route>
    </Router>
)

export default Options;

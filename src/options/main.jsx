import React from 'react'
import ReactDOM from 'react-dom'
import { Router, Route, IndexRedirect, hashHistory } from 'react-router';

import ImportContainer from './containers/import';
import SettingsContainer from './containers/settings';

// Render the UI to the screen

ReactDOM.render(
    <Router history={hashHistory}>
        <Route path="/">
            <IndexRedirect to="/settings" />
            <Route path="import" component={ImportContainer} />
            <Route path="settings" component={SettingsContainer} />
        </Route>
    </Router>,
    document.getElementById('app')
)

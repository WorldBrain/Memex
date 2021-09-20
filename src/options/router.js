import React from 'react'
import PropTypes from 'prop-types'
import { Router, Route, IndexRedirect } from 'react-router'
import history from './history'
import Layout from './layout'

class MemexRouter extends React.Component {
    static propTypes = {
        routes: PropTypes.array.isRequired,
        routeData: PropTypes.object.isRequired,
    }

    constructor(props) {
        super(props)

        this.overviewRoutes = props.routes.filter((route) => route.useOwnLayout)
        this.optionsRoutes = props.routes.filter((route) => !route.useOwnLayout)
    }

    renderRoutes(routes = []) {
        return routes.map((route) => (
            <Route
                key={route.pathname}
                path={route.pathname}
                component={(props) => (
                    <route.component {...props} {...this.props.routeData} />
                )}
            />
        ))
    }

    render() {
        return (
            <Router history={history}>
                <Route path="/">
                    <Route component={Layout}>
                        <IndexRedirect to="/blacklist" />
                        {this.renderRoutes(this.optionsRoutes)}
                    </Route>
                    {this.renderRoutes(this.overviewRoutes)}
                </Route>
            </Router>
        )
    }
}

export default MemexRouter

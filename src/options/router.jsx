import React from 'react'
import PropTypes from 'prop-types'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
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

    renderRoutes(routes = [], nested = false) {
        return routes.map((route) => {
            const path = nested ? route.pathname.slice(1) : route.pathname
            return (
                <Route
                    key={route.pathname}
                    path={path}
                    element={
                        <route.component routeData={this.props.routeData} />
                    }
                />
            )
        })
    }

    render() {
        return (
            <HashRouter>
                <Routes>
                    {this.renderRoutes(this.overviewRoutes)}
                    <Route path="/" element={<Layout />}>
                        <Route
                            index
                            element={<Navigate to="/blocklist" replace />}
                        />
                        {this.renderRoutes(this.optionsRoutes, true)}
                    </Route>
                </Routes>
            </HashRouter>
        )
    }
}

export default MemexRouter

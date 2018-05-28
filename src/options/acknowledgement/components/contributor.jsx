import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { OutLink } from 'src/common-ui/containers'
import localStyles from './styles.css'

class Contributor extends Component {
    constructor(props) {
        super(props)
        this.fetchContributorsLinks = this.fetchContributorsLinks.bind(this)
    }

    fetchContributorsLinks() {
        const { contributor } = this.props
        const links = contributor.links ? contributor.links : []
        return links.map((item, id) => {
            return (
                <OutLink
                    className={localStyles.links}
                    to={item[Object.keys(item)[0]]}
                    key={id}
                >
                    <img
                        className={localStyles.socialIcons}
                        src={'/img/' + Object.keys(item)[0] + '.png'}
                    />
                </OutLink>
            )
        })
    }

    render() {
        const contributor = this.props.contributor
        return (
            <div className={localStyles.li}>
                <img className={localStyles.img} src={contributor.image} />
                <p className={localStyles.p}>
                    <span className={localStyles.name}>
                        {' '}
                        {contributor.name}{' '}
                    </span>
                    <br />{' '}
                    <span className={localStyles.position}>
                        {contributor.position}
                    </span>
                    <br />
                    <OutLink className={localStyles.web} to={contributor.web}>
                        {contributor.web}
                    </OutLink>
                    <br />
                    {this.fetchContributorsLinks()}
                </p>
            </div>
        )
    }
}

Contributor.propTypes = {
    contributor: PropTypes.object.isRequired,
}

export default Contributor

import React, {Component} from 'react'
import PropTypes from 'prop-types'
import localStyles from './styles.css'

class Contributor extends Component {
    constructor(props) {
        super(props)
        this.fetchContributorsLinks = this.fetchContributorsLinks.bind(this)
    }

    fetchContributorsLinks() {
        const { contributor } = this.props
        var links = contributor.links ? contributor.links : []
        return (
            links.map((item, id) => {
                return <a className={localStyles.links} href={item[Object.keys(item)[0]]} target='_blank' key={id}><img className={localStyles.socialIcons} src={"/img/" + Object.keys(item)[0]+".png"} /></a>
            })
        )
    }

    render() {
        var contributor = this.props.contributor
        return (
            <div className={localStyles.li}>
                <img className={localStyles.img} src={contributor.image} /><p className={localStyles.p}><span className={localStyles.name}> {contributor.name} </span><br /> <span className={localStyles.position}>{contributor.position}</span><br /><a className={localStyles.web} href={contributor.web}>{contributor.web}</a><br />
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

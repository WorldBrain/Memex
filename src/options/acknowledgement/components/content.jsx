import React from 'react'
import cx from 'classnames'

import { OutLink } from 'src/common-ui/containers'
import localStyles from './styles.css'

const AcknowledgementContainer = () => (
    <div className={localStyles.acknowledgement}>
        <span className={localStyles.title}>
            WorldBrain's Memex can only happen thanks to our talented
            collaborators.
        </span>
        <div className={localStyles.content}>
            Many thanks goes out to our{' '}
            <OutLink
                className={cx(localStyles.links, 'piwik_link')}
                to="https://worldbrain.io/team"
            >
                team of contributors, advisors and investors
            </OutLink>
            {''}who helped building our software.
            <br />We also have immense grattitude for the decades-long pioneer
            work done by technologists and philosophers that enabled the
            WorldBrain's Memex project with their pieces of code and thought.
            <br />
            <br />This software is{' '}
            <OutLink
                className={cx(localStyles.links, 'piwik_link')}
                to="https://github.com/WorldBrain/WebMemex/blob/master/License"
            >
                open-source
            </OutLink>, for anyone to reuse, recycle, redistribute and add to.
        </div>

        <span className={localStyles.contribute}>
            You want to contribute to this project?
        </span>
        <p className={localStyles.contributeContent}>
            You can do so either by supporting our development with{' '}
            <OutLink
                className={cx(localStyles.links, 'piwik_link')}
                to="https://github.com/WorldBrain/WebMemex/"
            >
                your mind
            </OutLink>{' '}
            or{' '}
            <OutLink
                className={cx(localStyles.links, 'piwik_link')}
                to="https://patreon.com/WorldBrain"
            >
                your money
            </OutLink>.
        </p>
        <br />
        <br />
        <h3 className={localStyles.title}>
            A list of people who made meaningful contributions
        </h3>
        <div>
            Only because of these people, the WorldBrain/Memex project can
            exist. We are deeply thankful for the hours of work & the passion
            they contributed to this project.
            <br />
            <br />
            <img src={'/../../../../img/thanks.gif'} />
            <h4 className={localStyles.title}>Contributors</h4>
            <ul className={localStyles.ul}>
                <li>
                    <b>Jon Poltak Samosir</b> | Australia/Vietnam
                </li>
                <li>
                    <b>Gerben</b> | Netherlands/World
                </li>
                <li>
                    <b>Mukesh Kharita</b> | India
                </li>
                <li>
                    <b>Charlie Mathews</b> | South Africa/Canada
                </li>
                <li>
                    <b>Jon Pienaar</b> | South Africa/Canada
                </li>
                <li>
                    <b>Arpit Gogia</b> | India
                </li>
                <li>
                    <b>Shivang Bharadwaj</b> | India
                </li>
                <li>
                    <b>Yager Anderson</b> | Alaska
                </li>
                <li>
                    <b>Jean-Baptiste Dupas</b> | France
                </li>
                <li>
                    <b>Elio Qoshi</b> | Albania
                </li>
                <li>
                    <b>Kimberly Lauren Bryant</b> | Canada
                </li>
                <li>
                    <b>Nadine Collison</b> | Canada
                </li>
                <li>
                    <b>Urban Cvek</b> | Slovenia
                </li>
                <li>
                    <b>Aquib Master</b> | New Zealand
                </li>
                <li>
                    <b>Richard Smith-Unna</b> | United Kingdom
                </li>
                <li>
                    <b>Oliver Sauter</b> | Germany
                </li>
            </ul>
            <h4 className={localStyles.title}>Advisors</h4>
            <ul className={localStyles.ul}>
                <li>
                    <b>Samir Sekkat</b> | Germany/Marokko
                </li>
                <li>
                    <b>Benjamin Young</b> | United States
                </li>
                <li>
                    <b>David Passiak</b> | United States
                </li>
                <li>
                    <b>Gerben</b> | Netherlands/World
                </li>
                <li>
                    <b>Dan Lüdtke</b> | Germany
                </li>
                <li>
                    <b>Isabell Mohr</b> | Germany
                </li>
                <li>
                    <b>Christoph Pröschel</b> | Germany
                </li>
                <li>
                    <b>Aurelia Moser</b> | United States
                </li>
                <li>
                    <b>Abigail Cabunoc Mayes</b> | Canada
                </li>
                <li>
                    <b>Jan Kennedy</b> | United Kingdom/Germany
                </li>
            </ul>
            <h4 className={localStyles.title}>Funders</h4>
            <ul className={localStyles.ul}>
                <li>
                    <b>Oliver Sauter</b> | 35.000 €
                </li>
                <li>
                    <b>Margit Sauter</b> | 10.000 €
                </li>
                <li>
                    <b>Digital Science</b> | 5.500 €
                </li>
            </ul>
        </div>
    </div>
)

export default AcknowledgementContainer

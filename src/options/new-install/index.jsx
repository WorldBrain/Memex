import React from 'react'
import Slider from 'react-slick'

import analytics from 'src/util/analytics'
import localStyles from './styles.css'

const trackWelcomeChoice = action => () =>
    analytics.trackEvent({
        category: 'Welcome page selection',
        action,
    })

const settings = {
    autoplay: true,
    vertical: true,
    autoplaySpeed: 2500,
    arrows: false,
    // adaptiveHeight: false,
    centerMode: false,
    centerPadding: true,
}

const NewInstall = () => (
    <div className={localStyles.content}>
        <img className={localStyles.logobig} src="/img/worldbrain-logo.png" />
        <div className={localStyles.messageContainer}>
            <div className={localStyles.message}>
                <Slider {...settings} className={localStyles.slider}>
                    <div>
                        <h3 className={localStyles.h3}>
                            No more re-googling of pages you have seen in the
                            past.
                        </h3>
                    </div>
                    <div>
                        <h3 className={localStyles.h3}>
                            "Finally, I can close my tabs and not lose them
                            anymore!"
                        </h3>
                    </div>
                    <div>
                        <h3 className={localStyles.h3}>
                            No need to bookmark pages. Just remember them.
                        </h3>
                    </div>
                    <div>
                        <h3 className={localStyles.h3}>
                            "Why hasn't this existed before?"
                        </h3>
                    </div>
                </Slider>
            </div>
        </div>
        <div className={localStyles.btnBar}>
            <a
                className={localStyles.btnLink}
                onClick={trackWelcomeChoice('Tutorial video')}
                type="button"
                href="https://worldbrain.io/tutorial"
                target="_blank"
            >
                Watch 1-min Tutorial Video
            </a>

            <a
                className={localStyles.btnLink}
                onClick={trackWelcomeChoice('Tutorial page')}
                type="button"
                href="/options/options.html#/tutorial"
            >
                Read Step-By Step Tutorial
            </a>
        </div>
        <p>
            {' '}
            <a
                className={localStyles.link}
                onClick={trackWelcomeChoice('Go browsing')}
                href="https://worldbrain.io/"
                target="_blank"
            >
                Or just get started browsing the web
            </a>
        </p>
        <img style={{ width: '60%' }} src="/img/how_to_search.png" />
    </div>
)

export default NewInstall

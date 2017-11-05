import React from 'react'
import Slider from 'react-slick'
import localStyles from './styles.css'

const settings = {
    autoplay: true,
    vertical: true,
    autoplaySpeed: 2500,
    arrows: false,
    // adaptiveHeight: false,
    centerMode: false,
    centerPadding: true,
}

const newInstallContainer = () => (
    <div className={localStyles.content}>
        <h1 className={localStyles.heyyou}>Hey you, welcome to</h1>
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
                            anymore!
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
        <a
            className={localStyles.btnLink}
            type="button"
            href="https://worldbrain.io"
        >
            Start Browsing
        </a>
        <a
            className={localStyles.btnLink}
            type="button"
            href="/options/options.html#/tutorial"
        >
            Open Tutorial
        </a>
        <a
            className={localStyles.btnLink}
            type="button"
            href="/options/options.html#/import"
        >
            Import Existing History
        </a>
    </div>
)

export default newInstallContainer

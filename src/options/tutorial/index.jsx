import React from 'react'
import Slider from 'react-slick'
import LocalStyles from './style.css'

const settings = {
    dots: true,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: true,
}

const Tutorial = () => (
    <div>
        <Slider {...settings}>
            <div>
                <h3 className={LocalStyles.h3}>How to Search</h3>
                <p className={LocalStyles.text}>
                    After visiting articles or{' '}
                    <a
                        className={LocalStyles.link}
                        href="/options/options.html#/import"
                    >
                        importing your history/bookmarks
                    </a>, there are 3 ways to search:
                </p>
                <ol className={LocalStyles.list}>
                    <li className={LocalStyles.list_element}>
                        Use the address bar of the browser. Type `w` followed by
                        pressing 'space' or 'tab' to activate the search.
                    </li>
                    <li className={LocalStyles.list_element}>
                        Use the search box in WorldBrain’s popup
                    </li>
                    <li className={LocalStyles.list_element}>
                        In the Overview. You reach it by selecting the first
                        result of the address bar’s drop down or via the popup
                        search field.
                    </li>
                </ol>

                <img style={{ width: '100%' }} src="/img/how_to_search.png" />
            </div>
            <div>
                <h3 className={LocalStyles.h3}>Advanced Filtering</h3>
                <p className={LocalStyles.text}>
                    You can filter by time, by bookmarks and by domains.
                </p>
                <ul className={LocalStyles.list}>
                    <li className={LocalStyles.list_element}>
                        <strong style={{ fontSize: '17px' }}>
                            Filter by Time:
                        </strong>
                        <br /> Type in a date or express a time in natural
                        language (e.g. "2 weeks ago")<br />
                        In the address bar you have to additionally prefix
                        "before:" or "after:" to activate time filters.
                    </li>
                    <li className={LocalStyles.list_element}>
                        <strong style={{ fontSize: '17px' }}>
                            Only show Bookmarks:
                        </strong>
                        <br />Via the filter button or by typing in
                        "is_bookmark" into one of the search fields, you can
                        filter results by bookmarks.
                    </li>
                    <li className={LocalStyles.list_element}>
                        <strong style={{ fontSize: '17px' }}>
                            Filter by Domain(s):
                        </strong>
                        <br />Type in one or multiple domain names into the
                        search fields to only show results from these websites.
                    </li>
                </ul>

                <img style={{ width: '100%' }} src="/img/apply_filters.png" />
            </div>
            <div>
                <h3 className={LocalStyles.h3}>
                    Blacklisting Websites & Urls, and Pause All Indexing
                </h3>
                <p className={LocalStyles.text}>
                    By clicking on the small{' '}
                    <img
                        style={{
                            width: '20px',
                            verticalAlign: 'top',
                            display: 'inline',
                        }}
                        src="/img/worldbrain-logo-narrow-bw-48.png"
                    />-icon, you reach the popup. There you can:
                </p>
                <ul className={LocalStyles.list}>
                    <li className={LocalStyles.list_element}>
                        Directly blacklist the current website/url and delete
                        all database entries of that particular page.
                    </li>
                    <li className={LocalStyles.list_element}>
                        Pause <strong>all</strong> indexing of websites for a
                        period of time.
                    </li>
                </ul>

                <img
                    style={{ width: '100%' }}
                    src="/img/pausing_of_recording.png"
                />
            </div>
            <div>
                <h3 className={LocalStyles.h3}>
                    Import your existing history and bookmarks
                </h3>
                <p className={LocalStyles.text}>
                    After installing WorldBrain, all pages you visit & bookmark
                    are searchable.<br />
                    To also search everything before that, click on the
                    <img
                        style={{
                            width: '20px',
                            verticalAlign: 'top',
                            display: 'inline',
                        }}
                        src="/img/worldbrain-logo-narrow-bw-48.png"
                    />-icon in the menu and select "
                    <a
                        className={LocalStyles.link}
                        href="/options/options.html#/import"
                    >
                        Import History & Bookmarks
                    </a>".
                </p>
                <p className={LocalStyles.list}>
                    <img
                        style={{
                            width: '20px',
                            verticalAlign: 'top',
                            display: 'inline',
                            marginRight: '10px',
                        }}
                        src="/img/caution.png"
                    />{' '}
                    If you have many history items or bookmarks this
                    unfortunately can take a while, since we have to download &
                    index the content of all those urls.
                </p>

                <img style={{ width: '100%' }} src="/img/import.png" />
            </div>
        </Slider>
    </div>
)

export default Tutorial

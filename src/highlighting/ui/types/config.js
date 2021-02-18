/**
 * Configuration for an annotation service.
 *
 * See https://h.readthedocs.io/projects/client/en/latest/publishers/config/#cmdoption-arg-services
 *
 * The `onXXX` functions may be set by the embedder of the client. The
 * `onXXXProvided` booleans are correspondingly set in the annotator if a
 * particular function is provided.
 *
 * @typedef Service
 * @prop {string} apiUrl
 * @prop {string} authority
 * @prop {string} grantToken
 * @prop {string} [icon]
 * @prop {string[]|Promise<string[]>} [groups] -
 *   List of groups to show. The embedder can specify an array. In the sidebar
 *   this may be converted to a Promise if this information is fetched asynchronously.
 * @prop {boolean} [allowLeavingGroups]
 * @prop {boolean} [enableShareLinks]
 * @prop {Function} [onLoginRequest]
 * @prop {boolean} [onLoginRequestProvided]
 * @prop {Function} [onLogoutRequest]
 * @prop {boolean} [onLogoutRequestProvided]
 * @prop {Function} [onSignupRequest]
 * @prop {boolean} [onSignupRequestProvided]
 * @prop {Function} [onProfileRequest]
 * @prop {boolean} [onProfileRequestProvided]
 * @prop {Function} [onHelpRequest]
 * @prop {boolean} [onHelpRequestProvided]
 */

/**
 * Configuration for the Sentry crash-reporting service.
 *
 * @typedef SentryConfig
 * @prop {string} dsn
 * @prop {string} environment
 */

/**
 * Configuration for the sidebar app set by the Hypothesis backend ("h")
 * or baked into the sidebar app at build time (in the browser extension).
 *
 * See `h.views.client` in the "h" application.
 *
 * @typedef SidebarConfig
 * @prop {string} apiUrl
 * @prop {string} authDomain
 * @prop {string} [googleAnalytics]
 * @prop {string} oauthClientId
 * @prop {string[]} rpcAllowedOrigins
 * @prop {SentryConfig} [sentry]
 * @prop {string} [websocketUrl]
 */

/**
 * @typedef RequestConfigFromFrameOptions
 * @prop {number} ancestorLevel
 * @prop {string} origin
 */

/**
 * Configuration set by the embedder of the client and used by the sidebar.
 *
 * This is the subset of keys from
 * https://h.readthedocs.io/projects/client/en/latest/publishers/config/ which
 * excludes any keys used only by the "annotator" part of the application.
 *
 * @typedef HostConfig
 * @prop {string} [annotations] - Direct-linked annotation ID
 * @prop {string} [group] - Direct-linked group ID
 * @prop {string} [query] - Initial filter query
 * @prop {string} [appType] - Method used to load the client
 * @prop {boolean} [openSidebar] - Whether to open the sidebar on the initial load
 * @prop {boolean} [showHighlights] - Whether to show highlights
 * @prop {Object} [branding] -
 *   Theme properties (fonts, colors etc.)
 * @prop {boolean} [enableExperimentalNewNoteButton] -
 *   Whether to show the "New note" button on the "Page Notes" tab
 * @prop {RequestConfigFromFrameOptions|string} [requestConfigFromFrame]
 *   Origin of the ancestor frame to request configuration from
 * @prop {Service[]} [services] -
 *   Configuration for the annotation services that the client connects to
 * @prop {string} [theme]
 *   Name of the base theme to use.
 * @prop {string} [usernameUrl]
 *   URL template for username links
 */

/**
 * The `settings` object used in the sidebar app that is a result of merging
 * (filtered and validated) configuration from the host page with configuration
 * from h / the browser extension.
 *
 * @typedef {HostConfig & SidebarConfig} MergedConfig
 */

// Make TypeScript treat this file as a module.
export const unused = {}

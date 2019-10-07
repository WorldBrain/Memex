# Authentication

Our production authentication implementation is provided by Firebase Auth. Auth is registered in the background script and can be used by content scripts over the remote functions interface.

Authentication allows privileged and authorized access of specific features. Including the setup of user-protected multi-device synchronisation channels, and granting premium features to verified subscribed users. As well as a Single Sign-On experience across other Memex services, e.g. posting the the support forum.

## Consuming Auth

### From Background Script

To initialise an Auth service, do so providing it with an implementation, e.g.

```
const authService = new AuthService(new AuthFirebase())
```

To use the service already set up, import from the background script modules:

```
import { BackgroundModules } from 'src/background-script/setup'
const user = await backgroundModules.auth.authService.getUser()
```

### From Content Script

To obtain the currently logged in user object from a page's content script, use the `auth` key of the usual remote function interfaces.
I.e.

```
import { auth } from 'src/util/remote-functions-background'
```

and then use either

```
auth.getUser()
auth.refresh()
// etc, as indicated by AuthRemoteFunctionsInterface
```

(as registered at extension startup in `setupRemoteFunctionsImplementations` of `background.ts`)

#### Observing Auth Changes

In order to be able to react to observable changes in auth events, import the remote event emitter and register to recieve auth events as below:

```
import { getRemoteEventEmitter } from 'src/util/webextensionRPC'
const authEvents = getRemoteEventEmitter('auth')
authEvents.addListener('onAuthStateChanged', user => {
   console.log(`Frontend recieved onAuthStateChanged with user ${user}`)
})
```

#### Logging In

Providing an interface to login is most easily handled by delegating to the UI library and login logic already provided by Firebase.

We import a `StyledFirebaseAuth from 'react-firebaseui/StyledFirebaseAuth'`. The slight caveat here is the Firebase app object needs to be re-initialised in this script's scope, so that this UI library can use it directly (using the Firebase app already setup in the background script and trying to serialise it over the ipc channel is problematic). This just means importing firebase with it's config by way of `import { firebase } from 'src/util/firebase-app-initialized'` and providing the `StyledFirebaseAuth` with the param `firebaseAuth={firebase.auth()}`.

The backend Firebase app will will react to changes in the Authentication triggered above.

## Subscription

Our production subscription implementation is provided by Chargebee.

Several Firebase Functions are used to link between a user in Chargebee and Firebase, such that app users can checkout a subscription and be eligible for subscription level features (for instance, automatic backups and multi device sync).

### Checking / Observing Subscription

Users subscribed to a plan will have that plan's id and expiry date encoded into the Claims of their JWT auth token (provided by Firebase).

The high level interface to check which plan a user has enabled can be accessed by:

```
await auth.checkValidPlan(UserPlans.pro)
await auth.isAuthroizedForFeature(UserFeatures.backup)
```

### Subscription Checkout and Purchase

Subscription Checkout is handled by Chargebee.

The `UserSubscription` class coordinates the logic that interacts with Chargbee, to present the user with a dialog box loading a page from Chargebee's server, which the user can use to continue with the subscription process.

In order to provide a seamless login experience, where the page shown for subscription is already tied to the user logged into Memex, we use Firebase Functions to interact with Chargebee's server API.

-   'Subscribe' is called by user interaction
-   Chargebee UI helper script is loaded
-   Firebase Function (server side) is called which:
    -   Ensures the user is authenticated
    -   Generates a Chargebee URL endpoint, unique for the authenticated user to checkout
    -   Returns that URL
-   Chargebee UI is initialised with this URL
-   User continues the checkout process via the Chargebee UI (Chargebee hosted page)
-   Chargebee UI is closed
-   Memex refreshes the user's authentication to pickup any changes

### Existing Subscription Management

For the user to manage an existing subscription of theirs, the procedure happens almost identically to the above, but for the management page rather than the subscription page.

# Other

## Disabling Auth

## Testing Auth

## Appendix

### Checkout flow

Via, Firebase Auth, Firebase Functions and Chargebee integrations.

```
+-------+                                         +-----------+                                +-----------------+ +---------------+
| Memex |                                         | Firebase  |                                | ChargebeeServer | | ChargebeeAPI  |
+-------+                                         +-----------+                                +-----------------+ +---------------+
    |                                                   |                                               |                  |
    | Load UI helper script                             |                                               |                  |
    |-------------------------------------------------------------------------------------------------->|                  |
    | --------------------------\                       |                                               |                  |
    |-| Initialise Chargebee UI |                       |                                               |                  |
    | |-------------------------|                       |                                               |                  |
    |                                                   |                                               |                  |
    | getCheckoutLink                                   |                                               |                  |
    |-------------------------------------------------->|                                               |                  |
    |                                                   | ------------------------------\               |                  |
    |                                                   |-| Check user is authenticated |               |                  |
    |                                                   | |-----------------------------|               |                  |
    |                                                   | -------------------------------------\        |                  |
    |                                                   |-| Get unique user URL from chargebee |        |                  |
    |                                                   | |------------------------------------|        |                  |
    |                                                   |                                               |                  |
    |                                                   | chargebee.hosted_page.checkout_new            |                  |
    |                                                   |----------------------------------------------------------------->|
    |                                                   |                                               |                  |
    |                                                   |                                               |  ${Checkout URL} |
    |                                                   |<-----------------------------------------------------------------|
    |                                                   |                                               |                  |
    |                                   ${Checkout URL} |                                               |                  |
    |<--------------------------------------------------|                                               |                  |
    | --------------------------------------------\     |                                               |                  |
    |-| Chargebee UI to load page ${Checkout URL} |     |                                               |                  |
    | |-------------------------------------------|     |                                               |                  |
    |                                                   |                                               |                  |
    | Get ${Checkout URL}                               |                                               |                  |
    |-------------------------------------------------------------------------------------------------->|                  |
    |                                                   |          -----------------------------------\ |                  |
    |                                                   |          | User continues with Subscription |-|                  |
    |                                                   |          |----------------------------------| |                  |
    |                                                   |                                               |
```

(source)

```puml
object Memex Firebase ChargebeeServer ChargebeeAPI
Memex->ChargebeeServer: Load UI helper script
note right of Memex: Initialise Chargebee UI
Memex->Firebase: getCheckoutLink
note right of Firebase: Check user is authenticated
note right of Firebase: Get unique user URL from chargebee
Firebase->ChargebeeAPI: chargebee.hosted_page.checkout_new
ChargebeeAPI->Firebase: ${Checkout URL}
Firebase->Memex: ${Checkout URL}
note right of Memex: Chargebee UI to load page ${Checkout URL}
Memex->ChargebeeServer: Get ${Checkout URL}
note left of ChargebeeServer: User continues with Subscription
ChargebeeServer->Memex: Dialog closed
note right of Memex: Refresh Authentication
```

### Refresh Authentication

```puml
+-------+                                      +-----------+                                         +---------------+
| Memex |                                      | Firebase  |                                         | ChargebeeAPI  |
+-------+                                      +-----------+                                         +---------------+
    |                                                |                                                       |
    | refreshUser                                    |                                                       |
    |----------------------------------------------->|                                                       |
    |                                                | ------------------------------\                       |
    |                                                |-| Check user is authenticated |                       |
    |                                                | |-----------------------------|                       |
    |                                                | ---------------------------------------\              |
    |                                                |-| Get all valid subscriptions for user |              |
    |                                                | |--------------------------------------|              |
    |                                                |                                                       |
    |                                                | chargebee.subscription.list(query)                    |
    |                                                |------------------------------------------------------>|
    |                                                |                                                       |
    |                                                |                             ${Subscriptions} for user |
    |                                                |<------------------------------------------------------|
    |                                                | ----------------------------------------------\       |
    |                                                |-| for all subscriptions, check they are valid |       |
    |                                                | |---------------------------------------------|       |
    |                                                | --------------------------\                           |
    |                                                |-| get subscription expiry |                           |
    |                                                | |-------------------------|                           |
    |                                                | --------------------------------------------\         |
    |                                                |-| "FirebaseAuth Admin                       |         |
    |                                                | | -> setCustomClaims(userId,subscriptions)" |         |
    |                                                | |-------------------------------------------|         |
    |                                          done. |                                                       |
    |<-----------------------------------------------|                                                       |
    | -------------------------------------\         |                                                       |
    |-| "ReAuthenticate with Firebase Auth |         |                                                       |
    | | using existing credentials."       |         |                                                       |
    | -----------------------------------------\     |                                                       |
    |-| new subscription claims are picked up. |     |                                                       |
    | |----------------------------------------|     |                                                       |
    |                                                |                                                       |
```

(source)

```puml
object Memex Firebase ChargebeeAPI
Memex->Firebase: refreshUser
note right of Firebase: Check user is authenticated
note right of Firebase: Get all valid subscriptions for user
Firebase->ChargebeeAPI: chargebee.subscription.list(query)
ChargebeeAPI->Firebase: ${Subscriptions} for user
note right of Firebase: for all subscriptions, check they are valid
note right of Firebase: get subscription expiry
note right of Firebase: "FirebaseAuth Admin \n-> setCustomClaims(userId,subscriptions)"
Firebase->Memex: done.
note right of Memex: "ReAuthenticate with Firebase Auth\n using existing credentials."
note right of Memex: new subscription claims are picked up.
```

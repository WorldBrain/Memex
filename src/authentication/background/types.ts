interface AuthenticatedUser {
    displayName: string | null
    email: string | null
    uid: string
}

export interface AuthInterface {
    getCurrentUser(): Promise<AuthenticatedUser | null>

    getUserClaims(): Promise<Claims>

    refresh(): Promise<AuthenticatedUser | null>
}

// These are key-values that a client is verified to have by authenticating, e.g. Coming from a JWT token.
export interface Claims {
    subscriptions: { [key: string]: { refreshAt: number } }

    [key: string]: any
}

export interface SubscriptionCheckoutOptions {
    planId: string
}

// todo (ch): Type options
export interface SubscriptionServerFunctionsInterface {
    getCheckoutLink(options: SubscriptionCheckoutOptions): Promise<string>

    getManageLink(options: SubscriptionCheckoutOptions): Promise<string>
}

export interface AuthServerFunctionsInterface {
    refreshUserClaims(): Promise<any>
}

export interface AuthRemoteFunctionsInterface {
    getUser(): Promise<AuthenticatedUser | null>

    refresh(): Promise<AuthenticatedUser | null>

    checkValidPlan(plan): any

    hasSubscribedBefore(): any
}

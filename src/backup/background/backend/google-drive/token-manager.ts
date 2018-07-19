import * as queryString from 'query-string'

export class DriveTokenManager {
    public tokenStore: DriveTokenStore
    public accessToken: string
    // private refreshToken: string
    private lastTokenRefresh: Date
    private tokenExpiryDate: Date

    constructor({ tokenStore }: { tokenStore: DriveTokenStore }) {
        this.tokenStore = tokenStore
        this.tokenStore.retrieveAccessToken().then(({ token, expiryDate }) => {
            if (token) {
                this.accessToken = token
                this.tokenExpiryDate = expiryDate
            }
        })
    }

    async handleLoginRedirectedBack(locationHref: string) {
        this.lastTokenRefresh = new Date()
        const params: { [key: string]: string } = queryString.parse(locationHref.split('#')[1])

        const expiresInSeconds = parseInt(params['expires_in'])
        this.tokenExpiryDate = new Date(Date.now() + expiresInSeconds * 1000)

        this.accessToken = params['access_token']
        await this.tokenStore.storeAccessToken(this.accessToken, this.tokenExpiryDate)
        // this.refreshToken = await this.retrieveRefreshToken()
        // await this.tokenStore.storeToken('refresh', this.refreshToken)
    }

    // async retrieveRefreshToken(): Promise<string> {

    // }

    // async refreshAccessToken({ force }: { force: boolean }) {
    //     if (!force && !this.isAccessTokenExpired()) {
    //         return
    //     }
    // }

    // // margin says how much time before the actual expiry time in ms we actually want to refresh the token
    isAccessTokenExpired({ margin = 1000 * 60 * 10 } = {}): boolean {
        if (!this.tokenExpiryDate) {
            return true
        }

        const conservateExpiryTime = this.tokenExpiryDate.getTime() - margin
        return Date.now() >= conservateExpiryTime
    }
}

export type DriveTokenType = 'access' | 'refresh'
export interface DriveTokenStore {
    storeAccessToken(token: string, expiryDate: Date): Promise<any>
    retrieveAccessToken(): Promise<{ token: string, expiryDate: Date }>
}

export class LocalStorageDriveTokenStore implements DriveTokenStore {
    prefix: string

    constructor({ prefix }: { prefix: string }) {
        this.prefix = prefix
    }

    async storeAccessToken(token: string, expiryDate: Date): Promise<any> {
        localStorage.setItem(this.prefix + 'access', token)
        localStorage.setItem(this.prefix + 'access-expiry', expiryDate.getTime().toString())
    }

    async retrieveAccessToken() {
        return {
            token: localStorage.getItem(this.prefix + 'access'),
            expiryDate: new Date(parseFloat(localStorage.getItem(this.prefix + 'access-expiry'))),
        }
    }
}

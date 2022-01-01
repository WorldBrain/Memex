import { getLocalStorage } from 'src/util/storage'

export default async function getSignUpDate() {
    const signupDateLocalStorage = new Date(
        await getLocalStorage('signUpdate'),
    ).getTime()
    return signupDateLocalStorage
}

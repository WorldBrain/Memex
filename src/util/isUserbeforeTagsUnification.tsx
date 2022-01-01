import getSignUpDate from 'src/util/getSignUpDate'

export default async function isUserBeforeTagsUnification() {
    const migrationDate = 1642114800000
    const SignupDate = await getSignUpDate()

    if (SignupDate < migrationDate) {
        return true
    } else {
        return false
    }
}

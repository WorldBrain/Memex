export const bindMethod = <Target, Key extends keyof Target>(
    object: Target,
    key: Key,
): Target[Key] => (object[key] as any).bind(object)

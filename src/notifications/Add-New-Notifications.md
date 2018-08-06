# Add New Notification steps

Go to the `notifications.ts` file

Update the `releaseTime`, set this as current unix time, You can get by `Date.now()`

Now go to the NOTIFS array and add the notification content here

The mandtory fields of notification

```
id - It should be unique here
title
message
```

Optional fields

```
buttons - Array
```

# Button fields

Mandtory

```
action
label
```

Action fields

```
type: Action types are defined in the action-types.ts if you want to add a new one change in action-types.ts and use the same constant here, if you are addin a    new one then also implement the function in the registry.ts For open link you can use `OPEN_URL` and for local storage change use TOGGLE_SETTING from action-types.ts - Mandtory

url: If the button is used for open link then set the url here.

context: If the button is for open link then for self tab or in new tab, for new tab use new-tab

key: If the button is of action type then add the key when the data will change after clicking on the button, for example if we want to toggle the track then SHOULD_TRACK_STORAGE_KEY from the privacy constants module.
```

For more information you can see the types in the `types.ts`

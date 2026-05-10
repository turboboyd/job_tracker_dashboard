# GitHub Update Templates

## Universal short update

### Template
`Refactor update: cleaned <scope>. Removed <main problem>, introduced <main improvement>, no product behavior change intended. Result: <short measurable outcome>. Next: <next scope>.`

### Example
`Refactor update: cleaned routing boundary. Removed page dependency on route composition, extracted route constants into shared config, no product behavior change intended. Result: route cycle chain was cut and imports became predictable. Next: store boundary cleanup.`

---

## Slightly more detailed update

### Template
`Done: <scope>.`

`What changed:`
- `<change 1>`
- `<change 2>`
- `<change 3>`

`Why:`
- `<business / maintenance reason>`

`Result:`
- `<clear result>`

`Next:`
- `<next step>`

### Example
`Done: auth slice decoupling.`

`What changed:`
- `moved React-Redux adapters out of entity layer`
- `kept domain selectors and reducer inside entities/auth`
- `removed direct entity dependency on app/store hooks`

`Why:`
- `auth was participating in app-store circular dependency`

`Result:`
- `auth entity now has cleaner boundaries and is easier to reuse/test`

`Next:`
- `shared layer cleanup`

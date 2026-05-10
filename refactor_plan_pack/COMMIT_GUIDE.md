# Commit Guide

## Format

`<type>(<scope>): <message>`

## Allowed types
- `refactor`
- `chore`
- `docs`
- `test`
- `fix`

## Examples for this project

### Architecture / routing
- `refactor(routes): extract route constants from route composition`
- `refactor(pages): remove page imports from app router internals`
- `chore(arch): enable real circular dependency checks`

### Store / auth
- `refactor(store): remove loops ui reducer from page layer`
- `refactor(auth): move react-redux adapters out of entity layer`
- `refactor(auth): keep entity exports limited to domain contracts`

### Shared / i18n
- `refactor(shared): remove auth dependency from requireUid helper`
- `refactor(i18n): stop importing app header locales from shared config`
- `refactor(language-select): keep single connected implementation`

### Applications / loops / matches
- `refactor(application): add public api and hide internal status modules`
- `refactor(applications-firestore): split queries mutations and mappers`
- `refactor(loop): break model barrel cycles`
- `refactor(loop-match): remove dependency on applications feature layer`
- `refactor(matches): consume entity contracts through public api only`

### Docs / progress
- `docs(refactor): add staged architecture roadmap`
- `docs(progress): record baseline dependency violations`

## Short commit comment style

Плохо:
- `fix`
- `update`
- `cleanup`

Нормально:
- `refactor(routes): extract RoutePath into shared config`
- `refactor(auth): stop using app store hooks inside entity`
- `docs(progress): capture current depcruise baseline`

# Daymark — Todo & Expense Tracker

Daymark is a responsive, browser-based personal organizer for tasks and everyday spending. It is built with plain HTML, CSS, and JavaScript; no package installation or build step is required.

## Run it

Open `index.html` in a modern browser, or serve this folder with any static file server. Your tasks and expenses are stored in that browser's local storage and remain on that device.

## Features

- Create, view, edit, complete, and delete tasks.
- Set task priority and add optional notes.
- Create, view, edit, and delete expenses with a description, amount, category, and date.
- Search tasks and expenses; filter tasks by completion and expenses by category.
- See task totals, completed and open counts, expense totals, transaction counts, and the highest-spend category.
- Helpful empty states, form validation, keyboard-friendly dialogs, and responsive layouts.
- Event delegation for actions on dynamically rendered task and expense rows.

## Project files

- `index.html` — page structure and forms.
- `styles.css` — responsive layout and visual styles.
- `app.js` — CRUD operations, delegated events, validation, search, filtering, and local storage.

## Data and currency

Data is saved under `daymark.tasks.v1` and `daymark.expenses.v1` in `localStorage`. The app currently formats amounts in USD. To use a different currency, change the `CURRENCY` constant near the top of `app.js` to a supported ISO 4217 currency code.

Clearing site data in the browser removes saved records. The app does not send records to a server.

## License

MIT

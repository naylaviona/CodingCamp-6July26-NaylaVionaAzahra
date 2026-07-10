# Implementation Plan: Expense & Budget Visualizer

## Overview

Implement a single-page client-side web application using HTML, CSS, and Vanilla JavaScript. The implementation follows a unidirectional data flow pattern: Action → Mutate AppState → persist() → render(). All logic lives in `js/app.js` and all styling in `css/style.css`. Chart.js v4 is loaded via CDN. No frameworks or build tools are used.

## Tasks

- [x] 1. Build the HTML structure in `index.html`
  - [x] 1.1 Create `index.html` with all required sections
    - Add `<html data-theme="light">` root with `<head>` linking `css/style.css` and Chart.js CDN script, and `<script src="js/app.js" defer>`
    - Add `<header id="balance-header">` containing `<h1 id="balance-display" class="balance">$0.00</h1>`
    - Add `<main>` with `<form id="transaction-form">` containing: `<input id="item-name">`, `<span id="name-error">`, `<input id="item-amount">`, `<span id="amount-error">`, `<select id="category-select">`, `<button type="submit">`
    - Add custom category sub-form: `<input id="custom-category">`, `<button id="add-category-btn">`, `<span id="category-error">`
    - Add `<section id="spending-limit-panel">` with `<input id="limit-input">`, `<button id="set-limit-btn">`, `<span id="limit-error">`
    - Add `<button id="theme-toggle" aria-label="Toggle dark mode">` 
    - Add `<div id="sort-controls">` with `<select id="sort-select" disabled>`
    - Add `<section id="transaction-list">` and `<p id="empty-state">`
    - Add `<section id="chart-section">` with `<canvas id="spending-chart">` and `<p id="chart-placeholder">`
    - Add `<div id="toast-container">` for non-blocking messages
    - _Requirements: 1.1, 1.2, 2.1, 2.6, 3.1, 3.4, 4.1, 4.4, 6.3, 7.1, 8.1, 9.1, 10.1_

- [x] 2. Implement CSS foundation in `css/style.css`
  - [x] 2.1 Set up CSS custom properties and reset
    - Define `:root` CSS custom properties for light theme: `--bg`, `--surface`, `--text`, `--accent`, `--danger`, `--over-limit`, `--border`
    - Define `[data-theme="dark"]` overrides for all custom properties
    - Add box-sizing reset, base font, and body background/text using custom properties
    - _Requirements: 10.1, 10.2_

  - [x] 2.2 Implement mobile-first layout and responsive breakpoint
    - Write base styles targeting 320px: single-column flex/block layout, full-width form controls
    - Ensure all interactive elements (inputs, buttons, selects) have min `44 × 44px` touch targets
    - Add single `@media (min-width: 600px)` block switching to 2-column grid for main content
    - Style `#transaction-list` with `overflow-y: auto` and `max-height` constraint
    - Style `.balance--negative` with red colouring and `.balance--over-limit` with amber/orange colouring
    - Style `#toast-container` as fixed-position overlay with auto-dismissing toast items
    - Style `.transaction-item` with name, category, amount, and delete button layout
    - _Requirements: 2.2, 3.6, 6.1, 6.2, 6.3, 6.4, 6.5, 9.3_

- [x] 3. Implement Constants, AppState, and Storage modules in `js/app.js`
  - [x] 3.1 Write Constants and AppState
    - Define `STORAGE_KEYS` object with keys: `expense_transactions`, `expense_custom_categories`, `expense_theme`, `expense_spending_limit`
    - Define `DEFAULT_CATEGORIES` array: `['Food', 'Transport', 'Fun']`
    - Define `COLOUR_PALETTE` array of 12 hex colours as specified in the design
    - Define `AppState` object with `transactions: []`, `categories: []`, `sortOrder: 'date-desc'`, `theme: 'light'`, `spendingLimit: null`
    - _Requirements: 1.2, 5.6, 10.4_

  - [x] 3.2 Write Storage module functions
    - Implement `loadState()`: reads `expense_transactions` from `localStorage`, parses JSON, validates `Array.isArray`, sets `AppState.transactions`; falls back to `[]` and shows toast on error
    - Implement `saveState()`: serializes `AppState.transactions` to JSON, writes to `localStorage`; catches errors and shows toast
    - Implement `loadCategories()`: reads `expense_custom_categories`, merges with `DEFAULT_CATEGORIES` into `AppState.categories`; falls back silently
    - Implement `saveCategories()`: writes custom categories (minus defaults) to `expense_custom_categories`; catches errors and shows toast
    - Implement `loadTheme()` / `saveTheme()` and `loadSpendingLimit()` / `saveSpendingLimit()` with try/catch
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 7.2, 7.3, 7.6, 9.6, 10.3, 10.4, 10.5_

- [x] 4. Implement Validation module in `js/app.js`
  - [x] 4.1 Write validation functions
    - Implement `validateTransaction(name, amount)`: returns `{ valid, errors: { name?, amount? } }`; rejects empty/whitespace name, name > 100 chars, non-numeric amount, amount outside [0.01, 999999999.99]
    - Implement `validateCategory(name)`: returns `{ valid, error? }`; rejects empty/whitespace, length > 50, and case-insensitive duplicates against `AppState.categories`
    - Implement `validateSpendingLimit(value)`: returns `{ valid, error? }`; rejects zero, negative, non-numeric, outside [0.01, 999999999.99]
    - _Requirements: 1.4, 1.5, 7.4, 7.5, 9.1, 9.2_

- [x] 5. Implement Actions module in `js/app.js`
  - [x] 5.1 Write `addTransaction(name, amount, category)` action
    - Generate UUID v4 (`crypto.randomUUID()`) for `id`, set `createdAt: Date.now()`
    - Push new Transaction to `AppState.transactions`, call `saveState()`, call `render()`
    - Reset form fields: `item-name` to `''`, `item-amount` to `''`, `category-select` to index 0
    - _Requirements: 1.3, 1.6, 2.3, 3.2, 4.2, 5.1_

  - [x] 5.2 Write `deleteTransaction(id)` action
    - Filter `AppState.transactions` removing the item with matching `id`
    - Call `saveState()`, call `render()`
    - _Requirements: 2.3, 3.3, 4.3, 5.2_

  - [x] 5.3 Write `addCategory(name)` action
    - Push validated category to `AppState.categories`, call `saveCategories()`, call `renderCategoryOptions()`
    - Clear `#custom-category` input after success
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 5.4 Write `setSort(order)`, `setTheme(theme)`, and `setSpendingLimit(value)` actions
    - `setSort`: mutate `AppState.sortOrder`, call `renderList()`
    - `setTheme`: mutate `AppState.theme`, call `saveTheme()`, call `renderTheme()`
    - `setSpendingLimit`: mutate `AppState.spendingLimit`, call `saveSpendingLimit()`, call `renderBalance()`
    - _Requirements: 8.1, 8.2, 8.3, 9.5, 9.6, 10.1, 10.2, 10.3_

- [x] 6. Implement Render module — balance and transaction list
  - [x] 6.1 Write `renderBalance()` function
    - Read `AppState.transactions`, sum all amounts, format as `$X,XXX.XX` currency string
    - Update `#balance-display` text content
    - Toggle `.balance--negative` class when balance < 0
    - Toggle `.balance--over-limit` class when `AppState.spendingLimit !== null && balance > AppState.spendingLimit`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 9.3, 9.4, 9.5_

  - [x] 6.2 Write `getSortedTransactions()` helper and `renderList()` function
    - Implement `getSortedTransactions()`: sort `AppState.transactions` by active `sortOrder`; use `createdAt` descending as tiebreaker
    - Implement `renderList()`: clear `#transaction-list`, show `#empty-state` when empty, otherwise render `<article class="transaction-item">` elements with name, category, amount, and delete button (`aria-label="Delete transaction"`)
    - Enable/disable `#sort-select` based on transaction count
    - _Requirements: 2.1, 2.2, 2.4, 2.6, 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 7. Checkpoint — core features working
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implement Chart.js integration
  - [x] 8.1 Write `initChart()` and `updateChart()` functions
    - Guard with `if (!document.getElementById('spending-chart')) return` before creating Chart instance
    - Initialize Chart.js v4 pie chart on `#spending-chart` canvas with empty data, legend at bottom, percentage tooltip callback
    - Implement `updateChart()`: compute `categoryTotals` from `AppState.transactions`, assign colours from `COLOUR_PALETTE` by category insertion order, call `chartInstance.update()`
    - Show `#chart-placeholder` when no transactions; hide when data exists
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [x] 8.2 Write `renderChart()` function and wire into main `render()`
    - Call `updateChart()` from `renderChart()`
    - Add `renderChart()` call inside the main `render()` function alongside `renderBalance()` and `renderList()`
    - _Requirements: 4.2, 4.3_

- [x] 9. Implement custom categories rendering
  - [x] 9.1 Write `renderCategoryOptions()` function
    - Clear `#category-select` options, then re-populate from `AppState.categories`
    - Preserve selected option when possible; default to index 0
    - _Requirements: 1.2, 7.1, 7.3_

- [x] 10. Implement spending limit panel rendering
  - [x] 10.1 Write `renderSpendingLimit()` function
    - Set `#limit-input` value to `AppState.spendingLimit` if set, else empty string
    - Call `renderBalance()` to ensure highlight state is current
    - _Requirements: 9.3, 9.4, 9.5, 9.6_

- [x] 11. Implement theme rendering
  - [x] 11.1 Write `renderTheme()` function
    - Set `document.documentElement.setAttribute('data-theme', AppState.theme)` 
    - Update `#theme-toggle` button label/icon to reflect active theme
    - _Requirements: 10.1, 10.2_

- [x] 12. Implement toast/error notification system
  - [x] 12.1 Write `showToast(message)` function
    - Create `<div class="toast">` with the message, append to `#toast-container`
    - Remove the toast element after 4 seconds via `setTimeout`
    - _Requirements: 1.7, 2.4, 5.4, 5.5, 7.6_

- [x] 13. Implement Bootstrap module — event wiring and app init
  - [x] 13.1 Write `init()` function
    - Call `loadState()`, `loadCategories()`, `loadTheme()`, `loadSpendingLimit()` in sequence
    - Call `renderTheme()`, `renderCategoryOptions()`, then `render()` for initial paint
    - Attach submit listener on `#transaction-form`: run validation, show inline errors or call `addTransaction()`
    - Attach click listener on `#add-category-btn`: run `validateCategory()`, show inline error or call `addCategory()`
    - Attach click listener on `#set-limit-btn`: run `validateSpendingLimit()`, show inline error or call `setSpendingLimit()`
    - Attach click listener on `#theme-toggle`: call `setTheme()`
    - Attach change listener on `#sort-select`: call `setSort()`
    - Attach delegated click listener on `#transaction-list` for `.tx-delete` buttons: call `deleteTransaction(id)`
    - Call `initChart()` after DOM is ready
    - Fallback to `window.matchMedia('(prefers-color-scheme: dark)')` when no saved theme
    - Call `init()` on `DOMContentLoaded`
    - _Requirements: 1.3, 1.6, 2.3, 2.5, 5.3, 7.1, 8.2, 9.5, 10.1, 10.4, 10.5_

- [x] 14. Add accessibility attributes
  - [x] 14.1 Add ARIA attributes and ensure touch target sizes
    - Verify all form controls have associated `<label>` elements in `index.html`
    - Confirm `aria-label` is present on icon-only buttons: `#theme-toggle`, `.tx-delete`
    - Confirm all interactive elements meet 44×44 CSS pixel minimum in `css/style.css`
    - _Requirements: 6.3_

- [ ] 15. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- The app uses vanilla JS only — no frameworks, no npm, no build tools
- Chart.js is loaded via CDN: `https://cdn.jsdelivr.net/npm/chart.js`
- All CSS lives in `css/style.css` and all JS in `js/app.js` — no additional files
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests use fast-check; they target pure functions (validation, sort, balance calculation, serialization) and can be run with Node + fast-check
- Unit tests validate specific edge cases; property tests validate universal correctness

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "2.2", "3.1"] },
    { "id": 2, "tasks": ["3.2", "4.1"] },
    { "id": 3, "tasks": ["4.2", "4.3", "5.1", "5.2", "5.3", "5.4"] },
    { "id": 4, "tasks": ["5.5", "5.6", "6.1", "6.2", "8.1", "9.1"] },
    { "id": 5, "tasks": ["6.3", "6.4", "8.2", "10.1", "11.1", "12.1"] },
    { "id": 6, "tasks": ["10.2", "13.1"] },
    { "id": 7, "tasks": ["14.1", "15.1"] }
  ]
}
```
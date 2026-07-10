# Requirements Document

## Introduction

The Expense & Budget Visualizer is a mobile-friendly, client-side web application built with HTML, CSS, and Vanilla JavaScript. It enables users to track daily spending by recording transactions with a name, amount, and category. The app displays a running total balance, a scrollable transaction history with delete capability, and a live pie chart showing spending distribution by category. All data is persisted using the browser's Local Storage API with no backend or build tools required.

## Glossary

- **App**: The Expense & Budget Visualizer single-page web application.
- **Transaction**: A single spending record consisting of an item name, a positive numeric amount, and a category.
- **Category**: A label grouping transactions; default values are Food, Transport, and Fun. Custom categories may also be added by the user.
- **Balance**: The running sum of all transaction amounts currently stored, representing total expenditure.
- **Transaction_List**: The scrollable UI component that renders all stored transactions.
- **Input_Form**: The HTML form containing fields for item name, amount, and category used to add a new transaction.
- **Chart**: The pie chart rendered by Chart.js that visualises spending distribution by category.
- **Local_Storage**: The browser Web Storage API used to persist transaction data client-side.
- **Spending_Limit**: An optional user-defined monetary threshold; transactions that push the balance above this value are visually highlighted.
- **Theme**: The visual colour scheme of the App, either light or dark.

---

## Requirements

### Requirement 1: Transaction Input Form

**User Story:** As a user, I want to enter a transaction's name, amount, and category through a form, so that I can record my spending quickly.

#### Acceptance Criteria

1. THE Input_Form SHALL contain a text field for item name (accepting 1–100 characters), a numeric field for amount, and a category selector.
2. THE Input_Form SHALL provide at least three default category options: Food, Transport, and Fun.
3. WHEN the user submits the Input_Form with all fields filled and a valid positive amount, THE App SHALL add the transaction to the Transaction_List and persist it to Local_Storage within 1 second.
4. WHEN the user submits the Input_Form with one or more empty fields, THE Input_Form SHALL display an inline validation error message adjacent to each empty field before any transaction is added.
5. WHEN the user submits the Input_Form with an amount value that is not a positive number in the range 0.01–999,999,999.99, THE Input_Form SHALL display an inline validation error message and SHALL NOT add a transaction.
6. WHEN a transaction is successfully added, THE Input_Form SHALL reset the item name field to empty, the amount field to empty, and the category selector to the first default option.
7. IF Local_Storage is unavailable when a transaction is submitted, THEN THE App SHALL display a user-facing error message and store the transaction in session memory only for the current page session.

---

### Requirement 2: Transaction List

**User Story:** As a user, I want to see a scrollable list of all my recorded transactions, so that I can review my spending history.

#### Acceptance Criteria

1. THE Transaction_List SHALL display each transaction's item name (up to 100 characters), amount formatted to 2 decimal places with a currency symbol, and category.
2. WHEN the number of transactions exceeds the visible area, THE Transaction_List SHALL become vertically scrollable with no horizontal scrolling.
3. WHEN the user clicks the delete control on a transaction, THE App SHALL remove that transaction from the Transaction_List and from Local_Storage within 1 second.
4. IF a Local_Storage delete operation fails, THEN THE App SHALL display a non-blocking error message and retain the transaction in the Transaction_List.
5. WHEN Local_Storage contains previously saved transactions on App load, THE Transaction_List SHALL render all stored transactions within 2 seconds without requiring user action.
6. WHEN no transactions are stored, THE Transaction_List SHALL display an empty-state message indicating that no transactions have been recorded.

---

### Requirement 3: Total Balance Display

**User Story:** As a user, I want to see my total expenditure at a glance, so that I know how much I have spent overall.

#### Acceptance Criteria

1. THE App SHALL display the Balance in the topmost visible section of the page at a minimum font size of 24px.
2. WHEN a transaction is added, THE App SHALL recalculate and update the Balance display within 100 milliseconds.
3. WHEN a transaction is deleted, THE App SHALL recalculate and update the Balance display within 100 milliseconds.
4. THE App SHALL display the Balance formatted as a currency value with two decimal places and a currency symbol preceding the numeric value.
5. WHEN no transactions are stored, THE App SHALL display the Balance as "0.00".
6. WHEN the Balance is negative, THE App SHALL apply a visually distinct style (such as red colouring) to differentiate it from a positive or zero Balance.

---

### Requirement 4: Visual Spending Chart

**User Story:** As a user, I want to see a pie chart of my spending by category, so that I can understand where my money goes.

#### Acceptance Criteria

1. THE Chart SHALL render as a pie chart using Chart.js, displaying each category as a distinct coloured segment whose arc size is proportional to that category's percentage of total spending.
2. WHEN a transaction is added, THE Chart SHALL update to reflect the new spending distribution within 100 milliseconds.
3. WHEN a transaction is deleted, THE Chart SHALL update to reflect the revised spending distribution within 100 milliseconds.
4. WHEN no transactions are stored, THE Chart SHALL display a placeholder message in place of pie chart segments, indicating there is no data to visualise.
5. THE Chart SHALL display a legend mapping each colour segment to its category name and its percentage of total spending rounded to one decimal place.
6. No two visible segments in THE Chart SHALL share the same colour.
7. WHEN a transaction with a new category is added, THE Chart SHALL add a new segment for that category without altering the arc sizes of existing segments beyond recalculating all proportions.

---

### Requirement 5: Data Persistence via Local Storage

**User Story:** As a user, I want my transactions to persist between browser sessions, so that I do not lose my data when I close or refresh the page.

#### Acceptance Criteria

1. WHEN a transaction is added, THE App SHALL write the complete transaction list to Local_Storage as a serialised JSON string within 500 milliseconds.
2. WHEN a transaction is deleted, THE App SHALL write the updated transaction list to Local_Storage as a serialised JSON string within 500 milliseconds.
3. WHEN the App initialises, THE App SHALL read and deserialise the transaction list from Local_Storage before accepting user input.
4. IF Local_Storage is unavailable or returns data that is not a valid JSON array, THEN THE App SHALL initialise with an empty transaction list and display a non-blocking warning message that does not prevent further interaction.
5. IF a Local_Storage write operation fails after a transaction is added or deleted, THEN THE App SHALL display a non-blocking warning message informing the user that the change could not be saved.
6. FOR ALL valid transaction lists, serialising then deserialising the list SHALL produce a transaction list with strictly equal item names, amounts, and categories (round-trip property).

---

### Requirement 6: Mobile-Friendly Responsive Layout

**User Story:** As a user, I want the app to be usable on my phone, so that I can record transactions while on the go.

#### Acceptance Criteria

1. THE App SHALL render without horizontal overflow on viewports with a minimum width of 320 pixels.
2. THE App SHALL use a single-column layout on viewports narrower than 600 pixels.
3. THE Input_Form fields and submit button SHALL have touch targets of at least 44 × 44 CSS pixels.
4. WHILE the App is displayed on a viewport wider than 600 pixels, THE App SHALL use a multi-column layout with a minimum of 2 columns to make use of available space.
5. WHEN the viewport width crosses the 600-pixel breakpoint, THE App SHALL update its layout without requiring a page reload.

---

### Requirement 7: Custom Categories

**User Story:** As a user, I want to add custom spending categories, so that I can track expenses that do not fit the default categories.

#### Acceptance Criteria

1. THE Input_Form SHALL provide a text input (accepting 1–50 characters) and an add control that appends a new category to the category selector.
2. WHEN the user adds a custom category, THE App SHALL persist the custom category list to Local_Storage within 500 milliseconds.
3. WHEN the App initialises, THE App SHALL load previously saved custom categories from Local_Storage and display them after the default categories in the category selector.
4. IF a user attempts to add a custom category with a name that already exists among default or custom categories (case-insensitive), THEN THE Input_Form SHALL display a validation error and SHALL NOT add a duplicate category.
5. WHEN the user submits a custom category name that is empty or contains only whitespace, THE Input_Form SHALL display a validation error and SHALL NOT add the category.
6. IF Local_Storage is unavailable when saving custom categories, THEN THE App SHALL display a user-facing error message and retain the custom category in the selector for the current session only.

---

### Requirement 8: Sort Transactions

**User Story:** As a user, I want to sort my transaction list, so that I can find and analyse my spending more easily.

#### Acceptance Criteria

1. THE Transaction_List SHALL provide a sort control with the following options: sort by amount ascending, sort by amount descending, and sort by category A–Z.
2. WHEN the user selects a sort option, THE Transaction_List SHALL re-render all transactions in the chosen order within 300 milliseconds without resetting the sort selection.
3. WHEN a sort option is active and a new transaction is added, THE Transaction_List SHALL maintain the currently active sort order without resetting the sort selection.
4. WHEN no transactions are stored, THE Transaction_List SHALL display the sort control in a disabled state with an explanatory message that sorting is unavailable.
5. WHEN two transactions share the same sort key value, THE Transaction_List SHALL use the transaction's addition date in descending order as a tiebreaker.

---

### Requirement 9: Spending Limit Highlight

**User Story:** As a user, I want to set a spending limit and be warned when I exceed it, so that I can stay within my budget.

#### Acceptance Criteria

1. THE App SHALL provide an input field where the user can set a Spending_Limit as a positive numeric value in the range 0.01–999,999,999.99.
2. WHEN the user enters a Spending_Limit value that is zero, negative, non-numeric, or empty and attempts to save it, THE App SHALL display an inline validation error and preserve the previously saved Spending_Limit value.
3. WHEN the Balance exceeds the Spending_Limit, THE App SHALL apply a distinct visual highlight to the Balance display that is visually distinguishable from the default Balance style.
4. WHEN the Balance is at or below the Spending_Limit, THE App SHALL display the Balance without the highlight style.
5. WHEN the user updates the Spending_Limit value with a valid input, THE App SHALL re-evaluate and update the highlight state within 100 milliseconds.
6. THE App SHALL persist the Spending_Limit value to Local_Storage and restore it on App initialisation; IF no Spending_Limit is stored, THE App SHALL display the Spending_Limit field as empty with no highlight applied.

---

### Requirement 10: Dark/Light Mode Toggle

**User Story:** As a user, I want to switch between dark and light themes, so that I can use the app comfortably in different lighting conditions.

#### Acceptance Criteria

1. THE App SHALL provide a toggle control that switches the Theme between light mode and dark mode and visually indicates the currently active theme.
2. WHEN the user activates the toggle, THE App SHALL apply the selected Theme to all visible UI components within 100 milliseconds.
3. WHEN the user activates the toggle, THE App SHALL persist the selected Theme preference to Local_Storage, overwriting any previously stored value.
4. WHEN the App initialises, THE App SHALL restore the previously saved Theme preference from Local_Storage; IF no preference is saved, THEN THE App SHALL default to the system preference indicated by the `prefers-color-scheme` media query.
5. IF Local_Storage is unavailable at initialisation, THEN THE App SHALL apply the system preference indicated by the `prefers-color-scheme` media query without displaying an error related to theme loading.
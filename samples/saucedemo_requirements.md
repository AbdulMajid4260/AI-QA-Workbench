# SauceDemo assessment — core acceptance criteria

Application under test: https://www.saucedemo.com/
This is a training specification for the public demonstration application, not a production business specification.

## R1 — Login
A shopper using standard_user and secret_sauce can sign in. Successful sign-in navigates to inventory.html and displays six products.
An invalid username or incorrect password must keep the shopper on the login page and show an error containing "Username and password do not match".
Submitting an empty username must show "Username is required". The locked_out_user account, with password secret_sauce, must be rejected with an error containing "locked out".

## R2 — Product selection and cart
A signed-in standard_user can add Sauce Labs Backpack to the cart. The product action changes from Add to cart to Remove. The shopping cart badge shows 1. Opening the cart shows exactly one item named Sauce Labs Backpack.

## R3 — Checkout
After adding Sauce Labs Backpack, a standard_user can check out with synthetic first name Demo, last name Tester and postal code 530001. Continuing shows an order overview with a total. Selecting Finish displays "Thank you for your order!".
The required behavior for blank checkout fields, invalid postal codes and field length limits is not specified here. Identify these gaps instead of inventing validation rules.

## R4 — Logout
A signed-in standard_user can open the application menu and log out. The login button becomes visible again.

## R5 — Data-driven coverage
The same login workflow must support independent CSV or JSON rows: valid credentials, invalid username, invalid password, both fields blank and a locked account. Record each row separately with its expected success or failure outcome.

## Review constraints
Use the public demonstration credentials only. Additional security, accessibility, sorting and removal tests are proposals requiring confirmation, not established requirements in this brief. Exact lockout thresholds, response-time targets, password policies and mobile breakpoints are unspecified. Keep unsupported cases manual.

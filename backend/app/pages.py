"""Reusable SauceDemo page objects. Locators are owned by the framework."""

from playwright.sync_api import expect

AUT = "https://www.saucedemo.com/"


class LoginPage:
    def __init__(self, page):
        self.page = page

    def open(self):
        self.page.goto(AUT, wait_until="domcontentloaded")

    def login(self, username, password):
        self.page.locator('[data-test="username"]').fill(username)
        self.page.locator('[data-test="password"]').fill(password)
        self.page.locator('[data-test="login-button"]').click()

    def assert_success(self):
        expect(self.page).to_have_url(AUT + "inventory.html")
        expect(self.page.locator(".inventory_item")).to_have_count(6)

    def assert_failure(self, message=""):
        error = self.page.locator('[data-test="error"]')
        expect(error).to_be_visible()
        if message:
            expect(error).to_contain_text(message)
        expect(self.page.locator('[data-test="login-button"]')).to_be_visible()
        return error.inner_text()


class InventoryPage:
    def __init__(self, page):
        self.page = page

    def add(self, name):
        item = self.page.locator(".inventory_item").filter(
            has=self.page.get_by_text(name, exact=True)
        )
        expect(item).to_have_count(1)
        item.get_by_role("button", name="Add to cart", exact=True).click()
        expect(item.get_by_role("button", name="Remove", exact=True)).to_be_visible()
        expect(self.page.locator(".shopping_cart_badge")).to_have_text("1")

    def cart(self, name):
        self.page.locator(".shopping_cart_link").click()
        expect(self.page.locator(".cart_item")).to_have_count(1)
        expect(
            self.page.locator(".cart_item").get_by_text(name, exact=True)
        ).to_be_visible()

    def logout(self):
        self.page.get_by_role("button", name="Open Menu").click()
        self.page.locator("#logout_sidebar_link").click()
        expect(self.page.locator('[data-test="login-button"]')).to_be_visible()


class CheckoutPage:
    def __init__(self, page):
        self.page = page

    def complete(self, data, expected="Thank you for your order!"):
        self.page.locator('[data-test="checkout"]').click()
        for key, selector in [
            ("first_name", "firstName"),
            ("last_name", "lastName"),
            ("postal_code", "postalCode"),
        ]:
            self.page.locator(f'[data-test="{selector}"]').fill(data[key])
        self.page.locator('[data-test="continue"]').click()
        expect(self.page.locator(".summary_total_label")).to_be_visible()
        self.page.locator('[data-test="finish"]').click()
        expect(self.page.locator(".complete-header")).to_have_text(expected)

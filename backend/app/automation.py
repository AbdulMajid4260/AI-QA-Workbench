"""Allowlisted actions only; never eval/exec generated code. One isolated context per row."""

import json
import os
import time
from pathlib import Path
from playwright.sync_api import sync_playwright
from . import store
from .pages import LoginPage, InventoryPage, CheckoutPage, AUT

LOGIN_DATA = [
    {
        "case_id": "LOGIN-VALID",
        "username": "standard_user",
        "password": "secret_sauce",
        "expected": "success",
        "expected_error": "",
    },
    {
        "case_id": "LOGIN-USER",
        "username": "invalid_user",
        "password": "secret_sauce",
        "expected": "failure",
        "expected_error": "Username and password do not match",
    },
    {
        "case_id": "LOGIN-PASSWORD",
        "username": "standard_user",
        "password": "wrong_password",
        "expected": "failure",
        "expected_error": "Username and password do not match",
    },
    {
        "case_id": "LOGIN-EMPTY",
        "username": "",
        "password": "",
        "expected": "failure",
        "expected_error": "Username is required",
    },
    {
        "case_id": "LOGIN-LOCKED",
        "username": "locked_out_user",
        "password": "secret_sauce",
        "expected": "failure",
        "expected_error": "locked out",
    },
]
DEFAULT_DATA = {
    "username": "standard_user",
    "password": "secret_sauce",
    "product": "Sauce Labs Backpack",
    "first_name": "Demo",
    "last_name": "Tester",
    "postal_code": "530001",
}
CONTRACTS = {
    "login_valid": "Enter credentials; assert inventory URL and six products.",
    "login_invalid": "Enter credentials; assert visible login error and optional expected_error substring.",
    "cart_add": "Log in; add one exact product; assert badge=1, Remove button and product in cart.",
    "checkout": "Log in; add one product; complete checkout with supplied synthetic fields; assert Thank you for your order!",
    "logout": "Log in; open menu; log out; assert login button.",
    "manual": "Documented for manual execution; no browser adapter.",
}


def plan(request):
    if request.suite == "data_driven":
        dataset = (
            store.get("datasets", request.dataset_id) if request.dataset_id else None
        )
        if request.dataset_id and not dataset:
            raise ValueError("Dataset not found")
        rows = dataset["rows"] if dataset else LOGIN_DATA
        return [
            {
                "id": r["case_id"],
                "case_id": None,
                "title": r["case_id"],
                "key": "login_valid" if r["expected"] == "success" else "login_invalid",
                "data": r,
                "expected": r["expected"],
                "origin": "CSV/JSON data row",
            }
            for r in rows
        ]
    if request.suite == "approved":
        if not request.case_ids:
            raise ValueError("Select at least one approved case.")
        items = []
        for ident in dict.fromkeys(request.case_ids):
            c = store.get("cases", ident)
            if not c or c["review_status"] != "approved" or c["validation_issues"]:
                raise ValueError(
                    f"{ident} must be valid and approved before execution."
                )
            if c["automation_key"] == "manual":
                raise ValueError(f"{ident} requires manual execution.")
            items.append(
                {
                    "id": ident,
                    "case_id": ident,
                    "title": c["title"],
                    "key": c["automation_key"],
                    "data": c["test_data"],
                    "expected": CONTRACTS[c["automation_key"]],
                    "origin": c["origin"],
                    "snapshot": c,
                }
            )
        return items
    keys = (
        ["login_valid", "cart_add", "checkout", "logout"]
        if request.suite == "smoke"
        else ["checkout"]
    )
    return [
        {
            "id": f"BASE-{i+1:02d}",
            "case_id": None,
            "title": (
                "Controlled assertion failure"
                if request.suite == "failure_demo"
                else key.replace("_", " ").title()
            ),
            "key": key,
            "data": dict(DEFAULT_DATA),
            "expected": CONTRACTS[key],
            "origin": "Curated framework baseline",
            "injected": request.suite == "failure_demo",
        }
        for i, key in enumerate(keys)
    ]


def run_browser(run_id, headless=True):
    run = store.get("runs", run_id)
    run.update(status="running", started_at=store.now())
    store.put("runs", run)
    folder = store.DATA / "evidence" / run_id
    folder.mkdir(parents=True, exist_ok=True)
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(
                headless=headless,
                executable_path=os.getenv("BROWSER_EXECUTABLE_PATH") or None,
            )
            run["browser_version"] = browser.version
            run["browser_source"] = (
                "Explicit local executable"
                if os.getenv("BROWSER_EXECUTABLE_PATH")
                else "Playwright managed Chromium"
            )
            for index, item in enumerate(run["plan"]):
                rid = f"R{index+1:03d}"
                started = time.monotonic()
                result = {
                    "id": rid,
                    "case_id": item.get("case_id"),
                    "title": item["title"],
                    "status": "running",
                    "automation_key": item["key"],
                    "data": item["data"],
                    "expected": item["expected"],
                    "injected": item.get("injected", False),
                    "steps": [],
                    "console": [],
                    "evidence": {},
                }
                context = browser.new_context(viewport={"width": 1440, "height": 1000})
                context.tracing.start(screenshots=True, snapshots=True, sources=True)
                page = context.new_page()
                page.set_default_timeout(12000)
                page.set_default_navigation_timeout(45000)
                page.on(
                    "pageerror", lambda err: result["console"].append(str(err)[:500])
                )
                try:
                    login = LoginPage(page)
                    inv = InventoryPage(page)
                    result["steps"].append("Navigate to " + AUT)
                    login.open()
                    data = item["data"]
                    result["steps"].append("Enter dataset credentials and submit login")
                    login.login(data.get("username", ""), data.get("password", ""))
                    if item["key"] == "login_invalid":
                        actual = login.assert_failure(data.get("expected_error", ""))
                    else:
                        login.assert_success()
                        actual = "Inventory URL and six products verified"
                        if item["key"] in ("cart_add", "checkout"):
                            product = data["product"]
                            result["steps"].append(
                                "Add product and verify cart: " + product
                            )
                            inv.add(product)
                            inv.cart(product)
                            actual = (
                                "One product, Remove button and cart contents verified"
                            )
                        if item["key"] == "checkout":
                            result["steps"].append(
                                "Complete checkout and assert confirmation text"
                            )
                            expected = (
                                "DEMO: deliberately incorrect confirmation"
                                if item.get("injected")
                                else "Thank you for your order!"
                            )
                            CheckoutPage(page).complete(data, expected)
                            actual = "Order confirmation verified"
                        if item["key"] == "logout":
                            result["steps"].append("Log out and verify login page")
                            inv.logout()
                            actual = "Logout verified"
                    result.update(status="passed", actual=actual)
                except Exception as exc:
                    result.update(
                        status="failed",
                        actual=str(exc)[:6000],
                        error_type=type(exc).__name__,
                    )
                finally:
                    result["url"] = page.url
                    for kind, extension in [("screenshot", "png"), ("trace", "zip")]:
                        name = f"{rid}.{extension}"
                        try:
                            if kind == "screenshot":
                                page.screenshot(path=str(folder / name), full_page=True)
                            else:
                                context.tracing.stop(path=str(folder / name))
                            result["evidence"][kind] = f"/api/evidence/{run_id}/{name}"
                        except Exception as exc:
                            result.setdefault("capture_errors", []).append(
                                str(exc)[:300]
                            )
                    context.close()
                    result["duration_ms"] = round((time.monotonic() - started) * 1000)
                    run["results"].append(result)
                    store.put("runs", run)
                    if item.get("case_id"):
                        case = store.get("cases", item["case_id"])
                        # Results link to the exact approved snapshot in the run.
                        case.update(
                            execution_status=result["status"],
                            actual_result=result["actual"],
                            last_run_id=run_id,
                            executed_at=store.now(),
                            evidence=result["evidence"],
                        )
                        store.put("cases", case)
            browser.close()
        run.update(status="completed", finished_at=store.now())
    except Exception as exc:
        run.update(
            status="error",
            error=str(exc)[:600] + "\n" + str(exc)[-1600:],
            finished_at=store.now(),
        )
    run["counts"] = {
        s: sum(r["status"] == s for r in run["results"])
        for s in ["passed", "failed", "skipped"]
    }
    run["counts"]["not_run"] = len(run["plan"]) - len(run["results"])
    store.put("runs", run)
    store.audit("execution_finished", run_id, run["status"])
    return run

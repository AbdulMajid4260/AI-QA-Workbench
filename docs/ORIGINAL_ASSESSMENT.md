1\. PROJECT OVERVIEW

The objective of this assessment is to build a small AI-Powered QA Workbench that demonstrates how Artificial Intelligence can be integrated into real-world Quality Engineering activities.

Instead of performing traditional manual testing or generating test cases using simple prompts, you will build a working solution that uses AI to assist with requirement analysis, test design, test automation, test execution, and defect analysis.

The solution should demonstrate how AI can improve the overall QA workflow, reduce repetitive effort, and help testers make better quality-related decisions.

**Application Under Test (AUT):**

- Application: SauceDemo
- URL: [https://www.saucedemo.com/](https://www.saucedemo.com/)
- Purpose: E-commerce application for demonstrating login, product selection, cart, and checkout workflows.

2\. PROJECT OBJECTIVE

Build an AI-powered solution that follows this workflow:

Requirement Input → AI Requirement Analysis → AI Test Case Generation → Automated Test Execution → AI Defect Analysis → QA Execution Report

The solution should bring these capabilities together into one application or integrated workflow.

3\. FUNCTIONAL REQUIREMENTS

Module 1: AI-Powered Requirement Analyzer

Build a feature that accepts requirements in natural language and uses an AI model to analyze them.

**Expected functionality:**

- Accept requirements or user stories as input.
- Generate a simple requirement summary.
- Identify missing information and ambiguous requirements.
- Identify positive, negative, and edge-case scenarios.
- Suggest additional scenarios that may have been missed.

**Example input:**

"As a user, I should be able to log in to the application using valid credentials."

**Expected AI output:**

- Successful login with valid credentials.
- Login with an invalid username.
- Login with an invalid password.
- Login with empty credentials.
- Verify appropriate error messages.
- Verify successful navigation after login.

Module 2: AI-Powered Test Case Generator

Build a feature that generates structured test cases from the requirements or scenarios identified in Module 1.

**Expected functionality:**

- Generate functional test cases.
- Generate negative test cases.
- Generate boundary and edge-case test cases.
- Generate sample test data.
- Allow users to review and modify generated test cases.

Each test case should contain:

- Test Case ID
- Test Scenario
- Preconditions
- Test Steps
- Test Data
- Expected Result
- Priority (High, Medium, Low)

The generated test cases should be structured and reusable rather than plain AI-generated text.

Module 3: AI-Assisted Test Automation

Implement automated test execution against the SauceDemo application.

**Expected functionality:**

- Generate or assist in generating automation scripts using AI.
- Automate the login functionality.
- Automate product selection and adding products to the cart.
- Automate the checkout workflow.
- Use reusable functions, page objects, or an equivalent framework structure.
- Capture screenshots or other evidence when tests fail.

The automation should be executable and should produce actual results.

**Supported tools:**

- Playwright
- Selenium

Module 4: Data-Driven Testing

Implement data-driven testing using CSV or JSON files.

**Expected functionality:**

- Maintain test data separately from automation scripts.
- Execute login tests using multiple sets of credentials.
- Include valid and invalid login combinations.
- Execute the same test with different input datasets.
- Capture individual results for each dataset.

**Example test data:**

- standard_user / secret_sauce – Expected: Successful login
- invalid_user / secret_sauce – Expected: Login failure
- standard_user / wrong_password – Expected: Login failure
- Blank username / Blank password – Expected: Login failure

Module 5: AI-Powered Defect Analysis

Implement an AI feature that analyzes failed test executions and helps generate defect reports.

**Expected functionality:**

- Capture failed test execution details.
- Provide failure logs and screenshots to the AI model where appropriate.
- Analyze the failure and suggest possible reasons.
- Generate a structured defect report.
- Suggest additional regression test scenarios.

The defect report should contain:

- Defect Title
- Description
- Steps to Reproduce
- Expected Result
- Actual Result
- Severity
- Priority
- Possible Root Cause (as a hypothesis)

AI-generated root causes must be treated as suggestions, not confirmed facts.

Module 6: QA Execution Dashboard and Reporting

Build a basic dashboard to display the overall testing status.

**Expected functionality:**

- Display generated test cases.
- Display total tests executed.
- Display passed, failed, and skipped test counts.
- Display execution results.
- Provide access to execution reports.
- Allow users to trigger test execution, if supported by the implementation.

An HTML execution report or equivalent should be generated.

Module 7: AI-Assisted Test Documentation

Implement basic AI-assisted test documentation.

**Expected functionality:**

- Generate test documentation from requirements and test cases.
- Map requirements to corresponding test cases.
- Identify requirements without test coverage.
- Generate an execution summary.

Module 8: AI Governance and Output Validation

Demonstrate responsible use of AI in the QA workflow.

**Expected functionality:**

- Validate AI-generated test cases before execution.
- Avoid hardcoding AI responses or using static outputs as AI integration.
- Identify unsupported or incorrect AI-generated information.
- Use synthetic test data instead of real personal or confidential information.
- Ensure important decisions and generated artifacts can be reviewed by a human.

4\. MANDATORY AND OPTIONAL SCOPE

The assessment is intended to evaluate practical implementation. You do not need to build a complete enterprise-grade platform.

**Mandatory Requirements:**

- Requirement analysis using AI.
- AI-powered test case generation.
- Working SauceDemo automation using Playwright or Selenium.
- CSV/JSON-based data-driven testing.
- AI-assisted failure analysis and defect report generation.
- Basic execution results and reporting.

**Optional Enhancements – Additional Credit:**

- Interactive dashboard with test suite selection.
- Requirement Traceability Matrix (RTM).
- Automated coverage gap identification.
- Advanced failure analysis using screenshots and logs.
- Human approval/review workflow for AI-generated artifacts.
- Integration with Jira or other test management tools.

Focus on completing the mandatory requirements properly before attempting optional enhancements.

5\. RECOMMENDED TECHNOLOGY STACK

You may choose your own technology stack, but the following is recommended:

- Frontend: React&#x20;
- Backend: Python / Node.js
- AI Integration: OpenAI / Gemini / Claude / Ollama / Groq
- UI Automation: Playwright / Selenium
- Test Data: CSV / JSON
- Reporting: HTML Report / Extent Reports
- Version Control: Git / GitHub

You are free to use other suitable technologies if you can justify your choices.

6\. EXPECTED DELIVERABLES

Each trainee must submit the following:

**A. Source Code**

- Complete project source code.
- GitHub repository.
- Proper project structure.
- README containing project overview, technology stack, setup instructions, and execution steps.

**B. Testing Artifacts**

- Sample requirements.
- AI-generated test scenarios.
- AI-generated test cases.
- Sample CSV/JSON test data.
- Automation scripts.
- Execution screenshots or evidence.
- Sample defect reports.
- Execution report.

**C. Documentation**

- Project overview and architecture.
- Technology stack.
- AI model and integration details.
- Setup and execution instructions.
- Known limitations and incomplete features.

**D. Demo Preparation**

Prepare your project for a 30-minute live demonstration through screen sharing.

Be ready to demonstrate the working application, explain the implementation, and answer questions about your project.

7\. EVALUATION CRITERIA

The project will be evaluated based on the following:

- Prompt Engineering and AI Integration – 15%
- Requirement Analysis and Test Case Generation – 20%
- Automation Framework and Execution – 20%
- Data-Driven Testing – 10%
- AI-Powered Defect Analysis and Reporting – 10%
- Dashboard and User Interface – 10%
- Documentation and Traceability – 5%
- AI Governance and Output Validation – 5%
- Code Quality and Innovation – 5%

**Total: 100%**

8\. GENERAL GUIDELINES

- AI-assisted development tools such as Claude Code, Cursor, GitHub Copilot, ChatGPT, and similar tools are allowed.
- You are encouraged to use AI tools to design, develop, debug, and improve your solution.
- However, simply generating code using AI is not sufficient. You must understand the implementation and be able to explain it.
- AI integration must be functional. Hardcoded AI responses or static outputs will not be considered actual AI integration.
- All automation must execute against the provided SauceDemo application.
- Generated test cases and automation scripts must be reviewed and validated.
- Use synthetic test data only. Do not expose API keys or credentials in the GitHub repository.
- Focus on working functionality, clean implementation, and practical use of AI rather than unnecessary complexity.
- Clearly identify incomplete features and known limitations.

9\. WHAT WE EXPECT YOU TO DEMONSTRATE

The objective is not to build another traditional test automation framework.

We want you to demonstrate how you can combine QA knowledge, software engineering, AI integration, and automation to build a practical solution.

Your solution should demonstrate that you can:

- Understand and analyze requirements.
- Use AI effectively through well-designed prompts and integrations.
- Convert requirements into meaningful test scenarios and test cases.
- Build and execute automation.
- Use data-driven testing.
- Analyze failures and generate useful defect reports.
- Validate AI-generated outputs instead of blindly trusting them.
- Build a working application that brings these capabilities together.

**The final outcome should be a working AI-powered QA Workbench that demonstrates the complete flow:**

Requirement Analysis → AI Test Design → Test Automation → Test Execution → AI Defect Analysis → QA Reporting &#x20;
# Contributing to MES-ERP

First off, thank you for considering contributing to the MES-ERP project! Whether you're part of the core team, a future MES volunteer, or an interested developer, your help is valuable.

This document provides guidelines for contributing to the project effectively.

## Code of Conduct

This project and everyone participating in it is governed by the [MES-ERP Code of Conduct](CodeOfConduct.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to the project lead (see Code of Conduct for contact details).

## How Can I Contribute?

There are many ways to contribute, including:

*   Reporting bugs
*   Suggesting enhancements or new features
*   Writing or improving documentation
*   Writing code (fixing bugs, implementing features)
*   Reviewing Pull Requests

## Getting Started

1.  **Set up your development environment:** Follow the instructions in the [INSTALL.md](INSTALL.md) file (specifically the Developer section) to get the project running locally. This involves cloning the repository, installing dependencies (Node.js, npm), and configuring environment variables (especially for Supabase).
2.  **Find an issue:** Look through the [GitHub Issues](https://github.com/Housam2020/MES-ERP/issues) for tasks labelled `good first issue`, `help wanted`, or specific bugs/features you're interested in.
3.  **Communicate:** If you plan to work on an existing issue, leave a comment to let others know you're taking it on. If you want to work on something not listed, consider opening a new issue first to discuss your idea.

## Making Changes



1.  **Write Code:** Make your changes, adhering to the project's coding standards (see below).

2.  **Write Tests:** Add relevant unit tests (using Jest/React Testing Library) for any new logic or components. Ensure existing tests pass. Aim to maintain or improve code coverage.

3.  **Commit Changes:** Make small, logical commits.

4.  **Lint and Format:** Ensure your code passes the ESLint checks and is formatted with Prettier. This should be checked automatically by the CI pipeline and potentially pre-commit hooks.

5.  **Push Changes:** Push your branch to your fork or the main repository (if you have permissions).

6.  **Submit a Pull Request (PR):**
    *   Open a PR from your branch to the `main` branch.
    *   Provide a clear title and description for your PR. Explain the purpose of the changes and how they address the linked issue (use `Closes #issue-number`).
    *   Ensure all automated CI checks (linting, testing, builds) pass.
    *   Request a review from at least one other team member.

7.  **Address Feedback:** Respond to comments and make necessary changes based on the review.

8.  **Merge:** Once the PR is approved and checks pass, a maintainer will merge it into the `main` branch.

## Coding Standards

Please adhere to the coding standards outlined in the [Development Plan](docs/DevelopmentPlan/DevelopmentPlan.tex) (Section 11). Key points include:

*   Use TypeScript with strict type checking.
*   Follow ESLint rules for code style and potential errors.
*   Format code using Prettier (this should be automated).
*   Use clear and descriptive naming conventions (camelCase for variables/functions, PascalCase for components/types).
*   Add comments (inline or JSDoc) for complex logic.

## Testing

Contributions should ideally include unit tests for new functionality or bug fixes. Ensure all tests pass by running:

```bash
npm test
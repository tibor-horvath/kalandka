# Security policy

Kalandka is a static app for children aged 5–7. It has no backend and no accounts: profiles and progress stay on the device, and the QR profile transfer goes from one device's screen to the other's camera.
Even so, a problem in it reaches children's tablets, so please report it privately.

## Supported versions

Only the latest release, the one served at [kalandka.hu](https://kalandka.hu), gets fixes. Installed apps update themselves the next time they are opened online.

## Reporting a vulnerability

Use **Report a vulnerability** on the repository's [Security tab](https://github.com/tibor-horvath/kalandka/security). Please do not open a public issue, pull request or discussion for it.

Include what you found, how to reproduce it, and the device and browser.

You will get an answer within a week. Please keep the details private until a fix is released; you will be credited in the release notes unless you prefer not to be.

## In scope

- The app's code in this repository and the site at `kalandka.hu` and `www.kalandka.hu`.
- The response headers set in `public/staticwebapp.config.json` (Content Security Policy and the rest).
- The QR profile transfer and anything else that reads data from outside the app.
- The GitHub Actions workflows in `.github/workflows/`.

Out of scope: denial-of-service against the hosting, reports from automated scanners without a working example, and problems that need an already compromised device.

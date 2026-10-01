# Politiet appointment checker

Checks the authenticated rescheduling page every minute. When the page offers a slot from October 8 through October 22, 2026, it selects the earliest one, clicks **Bekreft ny tid**, and sends a macOS notification.

## Run

```sh
npm install
npm start
```

A dedicated browser window opens. Log in manually with the booking number and email address, then leave the browser and terminal running. The browser profile stays in `.browser-profile`, so credentials are not stored in source code and the session can be reused.

The checker only clicks **Vis første ledige time**, a qualifying timestamped slot, **Bekreft ny tid**, and the site's session-refresh control. It never clicks cancellation or session-exit links.

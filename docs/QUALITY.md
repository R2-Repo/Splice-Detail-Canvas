# Quality bar (UI and UX)

These expectations apply once the product UI exists (after onboarding replaces the bootstrap shell). Agents treat them as **defaults** unless `PROJECT_OVERVIEW.md` sets stricter rules.

## Layout and devices

- **Responsive:** Primary layouts must work from **320px** width upward without horizontal scroll for core content.
- **Touch targets:** Interactive controls at least **44×44px** effective hit area where applicable.
- **Readable type:** Body text comfortable at default zoom; avoid relying on tiny text for critical information.

## Accessibility

- **Semantics:** Use meaningful heading order, landmarks (`main`, `header`, `footer`), and native controls where possible.
- **Keyboard:** Every interactive control reachable and operable with keyboard alone; visible focus styles.
- **Images:** Provide **alt text** for informative images; use empty `alt=""` for decorative only.
- **Contrast:** Meet **WCAG 2.1 AA** for text and essential UI on supported themes unless the product explicitly documents an exception.

## Performance (static app)

- Avoid unnecessary large assets in the default path; lazy-load heavy media when you add it.
- Keep the critical path understandable: avoid blocking the first paint without reason.

## Verification

- Extend **Playwright** specs for critical user journeys.
- For visual or motion-heavy work, add **manual steps or a screen recording** per `docs/TESTING.md`.

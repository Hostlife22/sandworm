# Accessibility

SANDWORM MK-X provides an interactive 3D machine view and a text/SVG engineering
atlas. This document describes implemented support and known limitations; it is
not a claim of WCAG conformance.

## Available controls

- Use Tab and Shift+Tab to move between links and buttons. Focus is visibly marked.
  Buttons expose names and pressed states; a skip link reaches the viewport.
- Keys 1–6 select Front, Side, Aerial, Chase, Outpost and Orbit. Space pauses or
  resumes, X toggles the underground scan, R returns to the reference pose, and H
  hides or shows the atlas. Hotkeys ignore editable fields and modified shortcuts.
- All shortcut actions also have visible buttons. Camera presets provide keyboard
  access to the main views; free camera rotation and zoom use drag/scroll or touch.
- Pause stops machine motion, particles and technical animation while leaving camera
  inspection available. Users with `prefers-reduced-motion` start paused and must
  explicitly choose Play. Their camera transitions are immediate.
- On narrow screens, the viewport has a dedicated gesture area and the atlas follows
  in the scrolling page. The 390 px layout is checked for horizontal overflow.
- Text specifications and labeled diagrams accompany the canvas. If WebGL is
  unavailable, the atlas remains readable and a recovery message is displayed.

## Known limitations

The WebGL scene has no complete screen-reader equivalent for spatial relationships
or live motion. Free camera manipulation is not fully keyboard operated. Some
technical labels remain small on desktop, and automated checks do not establish
contrast or zoom compliance. The application interface is currently in English.

Keyboard behavior, reduced motion, mobile overflow and the WebGL fallback are covered
by Chromium tests. A full screen-reader audit, browser matrix and physical-device
touch evaluation have not been completed. See [validation](docs/VALIDATION.md).

## Reporting a barrier

[Open an issue](https://github.com/Hostlife22/sandworm/issues) with the affected
control or view, reproduction steps, browser, operating system and assistive
technology, if applicable. Describe what you expected and what prevented you from
continuing. Avoid including private information; screenshots are optional.

Contributors should preserve focus visibility, semantic controls, pause/reduced-motion
behavior and readable fallback content. See [CONTRIBUTING.md](CONTRIBUTING.md).

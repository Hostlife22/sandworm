# Motion and materials review

Compared the supplied recording at 14–20 seconds for travel and 49–51 seconds for
panel materials and sand detail.

## Motion correction

The previous head coordinate was `x = 22 - q`, where `q` was distance along the body.
For the head, `q = 0`: its horizontal position did not advance with time. Vertical
waves changed its pose around one location. A separate 50 ms frame cap also made
animation run at one quarter speed on a 5 FPS renderer.

The replacement samples a fixed, closed world route by traveled distance. The head
advances at 5 scene units per second; each ring occupies a point the head passed
earlier. Four vertical cycles along the route produce emergence and burial. Arc
length controls spacing, including on curves. The route fits inside the desert.

Front, Side, Aerial, Chase and Orbit accompany the machine. Outpost remains fixed;
stations and terrain never move. The live map draws this same route and head position.
The light's shadow region accompanies the body. Dust stays at world contact points.
Foreground frames retain elapsed time up to five seconds; tab suspension is discarded.

[Start](screenshots/10-travel-start.png) and
[six seconds later](screenshots/11-travel-later.png) use the same Outpost camera.
The browser test checks a horizontal head displacement above 20 scene units and
camera displacement below 0.01. Pure tests verify equal travel at 1, 2, 5, 10, 30 and
60 FPS, following the head's history, route seams, spacing and normalized rotations.

## Material correction

- Replaced high-frequency world-coordinate wear with a seeded UV texture: marks
  remain attached to armor while the body moves.
- Reduced armor metalness, raised roughness, softened panel color variation and
  retained dark joints. Added shallow service-panel variants and a thicker drill rim.
- Reworked sand ridges and derivative-based normal shading, with distance filtering
  to limit aliasing. Lighting is less bright and metallic than the initial version.

Geometry, dunes and the route remain procedural interpretations of the recording.
Fine asymmetric panel details and the exact recorded route are not reconstructed.

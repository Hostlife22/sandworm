# Reference study

Source: the supplied `ssstwitter.com_1790943778658.mp4`, 1874 × 1080,
78.583 seconds. Inspected contact sheets spanning the full recording at two-second
intervals and full-resolution details at 0.5 and 51 seconds. Local extracts live
in ignored `docs/reference/`; the application never loads the video or frames.

## Form and composition

- The initial head is on the right, near the viewer; the tail recedes left into sand.
- Roughly three dozen segments; pale armor belts alternate with deep graphite gaps.
- Belts consist of curved individual plates, recessed service panels, vents, fasteners
  and axial rods. Broad silhouette and joints matter more than surface noise.
- The head has a thick outer rim, a second bronze ring, then a funnel of radial teeth.
  Its hollow depth must remain readable at an oblique angle.
- The desert uses warm low-contrast sand, narrow ripple lines and a long soft shadow.
  Tiny drones and outposts establish scale.
- Information stays at the edges: left specifications and map, right cross-section,
  bottom three drawings. The scene is visible behind the atlas.

## State and camera map

The video timings are approximate observational cues, not a kinematic ground truth.
The reference tour uses these camera/X-ray cues with the independent continuous simulation.

| Time        | Camera / scan | Visible transition                                           |
| ----------- | ------------- | ------------------------------------------------------------ |
| 0–8         | Front         | High arch, head descends, following rings progressively bury |
| 8–13.8      | Aerial        | Remaining tail disappears; next emergence begins             |
| 13.8–18.3   | Front         | Head near the sand, large jaw opening readable               |
| 18.3–20.3   | Aerial        | Full route and length                                        |
| 20.3–23     | Side          | Low profile against dunes                                    |
| 23–30.8     | Side, X-ray   | Buried head and body become cyan; head begins to emerge      |
| 30.8–34.5   | Front, X-ray  | Head rises, rear remains underground                         |
| 34.5–41.3   | Orbit, X-ray  | Close armor and joint views; descending head                 |
| 41.3–46.5   | Aerial, X-ray | Progressive burial over most of the length                   |
| 46.5–49     | Chase, X-ray  | Look forward along the rings                                 |
| 49–54       | Orbit, X-ray  | Close view of hatches, vents and actuators                   |
| 54–57.3     | Side, X-ray   | Above-ground arc and buried continuation                     |
| 57.3–62.5   | Aerial, X-ray | Curved, almost entirely hidden body                          |
| 62.5–69     | Front, X-ray  | Sand cuts across head and body                               |
| 69–71.3     | Front         | Scan off; underground body becomes invisible                 |
| 71.3–76.8   | Chase         | Next emergence                                               |
| 76.8–78.583 | Front         | Return toward the head                                       |

Outpost, pause and reference-pose controls are present but not demonstrated.
Their behavior follows the supplied specification: fixed station camera,
simulation-only pause and repeatable smooth reference pose.

## Reproduction

`REFERENCE TOUR` follows all camera/scan entries above over 78.583 simulation seconds.
It preserves the current motion phase. Selecting a camera, toggling X-ray or dragging
ends the tour. Pause suspends its clock. This is a camera demonstration, not a frame
accurate reconstruction of the source motion.

The browser capture suite uses explicit phases for repeatable visual inspection.
See [VALIDATION.md](VALIDATION.md) for images and differences.

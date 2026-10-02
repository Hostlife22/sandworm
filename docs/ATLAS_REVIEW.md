# Atlas drawings: reference review

Compared the three supplied panel screenshots and sampled the first 13 seconds of
`ssstwitter.com_1790943778658.mp4`, cropping the left column, head section and lower
technical drawings separately to distinguish diagram animation from camera motion.

## Observed motion and implementation

| Panel                | Reference behavior                                           | Updated implementation                                                                                                                                                      |
| -------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Regional map         | Coastlines and deployment zone remain stationary.            | Detailed irregular coastlines, islands, lakes, highland marks and compass. No artificial continent animation.                                                               |
| Topographic map      | A moving machine marker follows a route over fixed contours. | Ten-metre contours sampled from the actual desert height function; the live articulated body and heading follow the world simulation.                                       |
| Head cross section   | Radial machinery and an outer index arc rotate.              | Detailed blades, hammer ring, fasteners, counter-rotating auger and a clearly visible outer index arc.                                                                      |
| Longitudinal section | The body itself changes curvature.                           | Every drawn ring follows the simulation's height and spacing; rods and the local terrain section update with it. The old static body and separate moving line were removed. |
| Typical ring         | The axonometric view changes as the ring turns.              | Projected armor panels, hatches, structural rims, rods and fasteners move together with a changing viewing angle.                                                           |
| Locomotion cycle     | Four small segmented bodies and arrows move.                 | Four offset phases animate the segments and direction arrows, with the current phase emphasized.                                                                            |

All drawing animation uses the simulation's pose time. Pause freezes the actual SVG
geometry; Play resumes it. Reference reset and reduced-motion startup use the same
clock. No independent CSS animation continues behind paused diagrams.

The drawings are procedural reconstructions. The world map matches our terrain and
route, and the head drawing retains the 40 blades of our 3D model; these are not
pixel-exact reproductions of the video's map and 32-blade illustration.

## Layout corrections

The specifications and both maps now share a left column in the atlas grid. Their
heights determine the row's minimum height, with a shared gap between panels. Lower
drawings occupy the next row. Short desktop windows can scroll to the complete
atlas instead of clipping it or overlapping the two maps. Wheel events over panels
scroll the page; free areas of the 3D viewport retain camera controls.

Browser checks cover 1920×900, 1440×900, 1280×720, 1024×768, 768×1024 and 390×844.
They test gaps, horizontal overflow and scrolling to the complete profile panel.
A separate test checks nine moving SVG attributes before/after simulation advance,
then verifies that all remain unchanged on pause and resume changing on Play.

- [Reference pose](screenshots/12-atlas-reference.png)
- [Another motion phase](screenshots/13-atlas-moving-phase.png)
- [Lower drawings reached in a short window](screenshots/14-atlas-short-window.png)

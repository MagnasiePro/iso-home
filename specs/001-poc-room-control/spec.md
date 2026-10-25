# Feature Specification: POC – One Room, Touch-Controlled on a Tablet

**Feature Branch**: `001-poc-room-control`

**Created**: 2026-10-24

**Status**: Draft

**Input**: User description: "POC: a room of my house, rendered in isometric pixel art, with real
Home Assistant devices placed in it and controllable by touch, with live state feedback, on a
wall tablet. Importer from a Magicplan export, zod-validated HomeModel, gesture-driven rendering
(tap/long-press/pan/pinch/double-tap), a base element pack (lamp, ceiling light, TV, speaker), a
Lovelace card plus a standalone playground (mock and live modes), and contributor docs. Three
checkpoints requiring sign-off: bare room rendered, elements + gestures in mock mode, then live
Home Assistant wiring."

## Clarifications

### Session 2026-10-24

- Q: When the hand-written device list and the importer's room output are merged into one
  HomeModel, how should a device's `roomId` reliably point at "the room," given the importer
  re-runs every time the Magicplan export is re-imported? → A: Room id is a deterministic slug of
  the room name (e.g. `living-room`), regenerated identically on every import; merge fails with a
  clear error if an object's `roomId` doesn't match an existing room.
- Q: When the Home Assistant WebSocket connection drops on a tablet expected to run 24/7 (network
  blip, HA restart, tablet sleep), what should the dashboard show while reconnecting? → A: Freeze
  all sprites to a visibly stale/dimmed look until the connection is confirmed restored, so the
  homeowner never mistakes stale state for current reality.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See the room, recognizably (Priority: P1)

As the homeowner, I open the dashboard on my wall tablet and see my room rendered as a
recognizable isometric pixel-art scene, with my real devices placed where they actually are and
showing their current state.

**Why this priority**: Nothing else in this POC has value without a legible room that someone
can actually recognize as their own space. It is the foundation every later interaction builds on.

**Independent Test**: In mock mode, a person who has not seen the real room can look at the
rendered scene and correctly identify its shape, its doors, and its windows, with every device
shown in a visually distinct, correct simulated state.

**Acceptance Scenarios**:

1. **Given** a Magicplan export of the room and a hand-written device list, **When** the importer
   and renderer run, **Then** the rendered scene shows the room's wall outline, doors, and
   windows, scaled to fill the screen in both portrait and landscape.
2. **Given** the rendered room, **When** no state changes and no one is touching the screen,
   **Then** the renderer draws zero frames per second (confirmed by an on-screen debug counter).

---

### User Story 2 - Touch a device to control it (Priority: P2)

As the homeowner, I tap a device sprite to open its normal Home Assistant controls, and I can
long-press it for a one-touch action, without the touch ever scrolling the underlying dashboard.

**Why this priority**: This is the core premise of the project — "touch the house to control
it." It depends on Story 1's rendered scene but is where the product actually delivers control.

**Independent Test**: In mock mode, tapping a lamp sprite opens its info popup; long-pressing the
same lamp toggles it immediately (progress ring while holding, brief haptic feedback, visual
confirmation), with no popup shown.

**Acceptance Scenarios**:

1. **Given** a device with no declared quick action, **When** it is tapped or long-pressed,
   **Then** both gestures open the same native info popup.
2. **Given** a lamp with a `light.toggle` quick action, **When** it is long-pressed for ~500ms
   without the finger moving more than 10px, **Then** the lamp sprite flips state instantly and
   a brief haptic pulse fires where supported.
3. **Given** a pack manifest that declares a quick action on a forbidden domain (lock, alarm
   control panel, a garage/door/gate cover, or a valve), **When** the pack is loaded, **Then** it
   is rejected with a clear console message and the device remains tap-only.
4. **Given** a one-finger drag, a pinch, or a double-tap on the scene, **When** performed,
   **Then** the scene pans, zooms in integer steps, or recenters respectively, and the gesture
   never scrolls the page behind it.

---

### User Story 3 - Wire it to the real house (Priority: P3)

As the homeowner, I connect the dashboard to my real Home Assistant instance and see my real
lamp's state reflected within a second of changing it from the Home Assistant app, and I can
control it back from the tablet.

**Why this priority**: This closes the loop from simulation to reality. It is the final
validation milestone and the highest-risk piece, since it depends on live connectivity and real
device behavior rather than mocked data.

**Independent Test**: With the Lovelace card installed via HACS (or the playground in live mode)
pointed at a real Home Assistant instance, toggling the real lamp from the Home Assistant mobile
app updates the tablet's sprite within 1 second, and tapping/long-pressing the sprite controls the
real device.

**Acceptance Scenarios**:

1. **Given** the Lovelace card is receiving `hass` updates, **When** a watched entity's state
   changes in Home Assistant, **Then** the corresponding sprite updates within 1 second.
2. **Given** a lit lamp entity exposing `rgb_color` and `brightness`, **When** its state updates,
   **Then** the sprite's halo is tinted to match those attributes.
3. **Given** an action call fails (e.g., device offline), **When** the optimistic sprite update
   was already shown, **Then** the sprite rolls back and a small error indicator appears.
4. **Given** the playground in live mode, **When** a long-lived token is read from `.env.local`,
   **Then** no token is ever written into a tracked file.
5. **Given** the Home Assistant connection drops (network blip, HA restart, tablet sleep),
   **When** the dashboard notices it is disconnected, **Then** every sprite is visibly marked
   stale (e.g., dimmed) until the connection and state are confirmed restored.

---

### Edge Cases

- A pack manifest declares a quick action on a forbidden domain → rejected at load time with a
  clear console message; the device itself remains controllable via tap/popup.
- A quick-action service call fails mid-flight → the optimistic sprite update rolls back and a
  small, visible error indicator is shown.
- A long-press is started but the finger moves more than 10px before ~500ms elapses → the press
  is canceled and treated as a normal tap on release instead.
- A device has no entity bound to it (e.g., a decorative element) → it renders as part of the
  scene but is not tappable/controllable.
- The room is viewed on a tablet rotated between portrait and landscape mid-session → the scene
  re-fits to the new viewport without requiring a reload.
- The Home Assistant connection drops while the tablet keeps running → sprites are visibly marked
  stale (dimmed) rather than silently kept looking current, and return to normal once the
  connection and state are confirmed restored.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The importer MUST extract wall outline, door, and window geometry from a Magicplan
  room export and convert it into the HomeModel coordinate system in meters, snapped to a 0.5m
  grid, assigning the room a deterministic id (a slug of the room name) that stays identical
  across repeated imports of the same room.
- **FR-002**: The system MUST represent a room as a validated HomeModel: rooms (id, name,
  polygon, openings) and objects (id, type, roomId, position, rotation, optional entityId). When
  the importer's room output and the hand-written object list are merged, the merge MUST fail
  with a clear error if any object's `roomId` does not match an existing room id.
- **FR-003**: The renderer MUST draw the room as an isometric pixel-art scene with correct depth
  sorting (back walls visible, front walls hidden) and MUST auto-fit the room to the viewport in
  both portrait and landscape orientation.
- **FR-004**: The scene MUST support five gestures: tap (open device), long-press (quick action
  if declared, otherwise same as tap), one-finger drag (pan), pinch (zoom in integer steps), and
  double-tap (recenter).
- **FR-005**: A long-press MUST trigger after approximately 500ms, MUST cancel if the finger
  moves more than 10px, MUST show a progress indicator while held, and MUST trigger brief haptic
  feedback where the platform supports it.
- **FR-006**: Any user-triggered state change MUST update the sprite optimistically first, then
  reconcile with the real state reported by Home Assistant; a failed call MUST roll the sprite
  back and show a small error indicator.
- **FR-007**: Device sprites MUST reflect a real Home Assistant state change within 1 second of
  that change, including tinting a lit lamp's halo by its `rgb_color`/`brightness` attributes
  when those attributes are present.
- **FR-008**: The renderer MUST stay idle (zero redraws per second) while nothing is changing,
  redrawing only on a state change, a user interaction, or an in-progress animation.
- **FR-009**: The system MUST reject, at load time, any element pack that declares a quick action
  on a forbidden domain (lock, alarm control panel, a garage/door/gate cover, or a valve),
  regardless of what the pack's own manifest requests, and MUST log a clear reason.
- **FR-010**: The base element pack MUST support the light, switch, fan, input_boolean, and
  media_player (play/pause) domains, with distinct visual states for a lamp, a ceiling light, a
  TV, and a speaker.
- **FR-011**: Adding a new visual element type MUST require only a new folder under the packs
  directory (manifest + spritesheet), with no change to core code — demonstrated by an example
  "plant" pack that has no entity bound to it.
- **FR-012**: The system MUST be consumable two ways: a Home Assistant Lovelace card (bundled as
  a single JS file, installable through HACS) and a standalone playground with a mock mode
  (simulated entities with debug toggles) and a live mode (a real Home Assistant connection using
  a token read only from an untracked local file).
- **FR-013**: The rendering surface MUST disable native touch scrolling so that gestures on the
  scene never scroll the page or dashboard behind it.
- **FR-014**: Every interactive element MUST expose a tap target of at least 44×44px (enlarged
  past the sprite's own bounds if needed), and the entire experience MUST be fully usable by
  touch alone, with no function depending on mouse hover or a keyboard.
- **FR-015**: The choice between the two supplied Magicplan export formats (SVG and DXF) as the
  importer's source of truth MUST be recorded as a written decision record, with the rationale
  for picking one over the other.
- **FR-016**: The project MUST publish a visual style guide, an asset-prompting guide with a
  contributor validation checklist, and a README, contribution guide, and issue template for
  proposing a new element pack.
- **FR-017**: The system MUST detect a lost Home Assistant connection and visibly mark every
  sprite as stale (e.g., dimmed) for as long as the connection is down, rather than silently
  continuing to display last-known state as if it were current; sprites MUST return to normal
  only once the connection and real state are confirmed restored.

### Key Entities

- **HomeModel**: The root, validated data contract shared by the importer, the core renderer, and
  every adapter. Holds the full set of rooms and placed objects for one house.
- **Room**: A named polygon with a list of openings (doors/windows), belonging to a HomeModel,
  identified by a deterministic slug of its name that stays stable across re-imports.
- **Object (placed element)**: A type, a room, a position, a rotation, and an optional link to a
  Home Assistant entity.
- **Element Pack**: A self-contained folder (manifest + spritesheet) declaring one element type's
  visual states, the Home Assistant domains it is compatible with, how an entity's state maps to
  a visual state, and an optional quick action.
- **Quick Action**: An optional single Home Assistant service call a pack may bind to the
  long-press gesture, always subject to the core's domain blocklist regardless of what the pack
  requests.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A person unfamiliar with the real room can correctly identify its shape, doors, and
  windows from the rendered scene on a tablet-sized screen.
- **SC-002**: Toggling a real device from the Home Assistant app updates its tablet sprite within
  1 second, every time, across a representative sample of test toggles.
- **SC-003**: A long-press toggles a device's state with visible feedback in under 1 second,
  without ever opening a popup.
- **SC-004**: An element pack that attempts a forbidden quick action is rejected 100% of the
  time, with a human-readable reason recorded.
- **SC-005**: A contributor can add a new visual element type by adding exactly one new folder,
  with zero changes to any existing core file — demonstrated by the "plant" example pack.
- **SC-006**: The dashboard produces zero redraws per second while idle, confirmed by an on-screen
  debug counter during a sustained idle period.
- **SC-007**: Panning and zooming remain visually smooth on a tablet performance profile with the
  CPU throttled 4x, confirmed against a reference visual-test capture.
- **SC-008**: The entire experience is operable by touch alone (no mouse, no keyboard) on the
  Home Assistant Companion app on both iOS and Android, and on Fully Kiosk Browser.
- **SC-009**: After a simulated connection drop, every sprite is visibly marked stale within one
  rendering cycle of the disconnect being detected, and returns to normal within 1 second of the
  connection and state being restored.

## Assumptions

- The exact room name and the real device inventory (entity IDs, approximate positions) will be
  supplied before implementation starts; this spec treats them as configuration data to be filled
  in, not as fixed requirements of the feature itself.
- Both Magicplan export formats (SVG and DXF) are provided only to inform the decision in
  FR-015; only one becomes the importer's actual source format for this POC.
- This POC covers exactly one room. A house editor, multi-room/multi-floor support, Home
  Assistant–side persistence, a pack marketplace, sound, and animated characters are explicitly
  out of scope.
- Visual polish is not a goal of this POC: placeholder sprites that still follow the project's
  style guide are an acceptable deliverable; the data/rendering pipeline is what is being proven.
- Progress pauses at three checkpoints for explicit sign-off before continuing: (1) the imported
  room rendered bare, (2) elements placed with states and gestures in mock mode, (3) live Home
  Assistant wiring through the card and the playground.

import type { PlacedObject } from "@iso-home/core-model";

// Hand-written device list for the sample 4m x 3m room (spec.md Assumptions:
// the real room's devices are still-to-come configuration data).
export const sampleDevices: PlacedObject[] = [
  {
    id: "lamp-1",
    type: "floor-lamp",
    roomId: "living-room",
    position: { x: 1.5, y: 0.5 },
    rotation: 0,
    entityId: "light.floor_lamp",
  },
  {
    id: "ceiling-1",
    type: "ceiling-light",
    roomId: "living-room",
    position: { x: 2.5, y: 1.5 },
    rotation: 0,
    entityId: "light.ceiling",
  },
  {
    id: "tv-1",
    type: "tv",
    roomId: "living-room",
    position: { x: 3.5, y: 0.5 },
    rotation: 0,
    entityId: "media_player.tv",
  },
  {
    id: "speaker-1",
    type: "speaker",
    roomId: "living-room",
    position: { x: 0.5, y: 2.5 },
    rotation: 0,
    entityId: "media_player.speaker",
  },
  {
    id: "plant-1",
    type: "plant",
    roomId: "living-room",
    position: { x: 3.5, y: 2.5 },
    rotation: 0,
  },
];

/** Deliberately misconfigured pack (`?bad-pack`): FR-009 must strip its quick action. */
export const badPack = {
  id: "speaker-bad",
  type: "speaker-bad",
  haDomains: ["lock"],
  footprint: { width: 1, height: 1 },
  sprites: { off: "speaker-off.png" },
  quickAction: { service: "lock.unlock" },
};

export const badPackDevice: PlacedObject = {
  id: "bad-1",
  type: "speaker-bad",
  roomId: "living-room",
  position: { x: 1.5, y: 2.5 },
  rotation: 0,
  entityId: "lock.front_door",
};

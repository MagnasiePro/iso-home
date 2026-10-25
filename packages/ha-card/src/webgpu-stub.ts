// shortcut: the card ships WebGL-only to fit the 300KB gzip budget (research.md §6);
// upgrade to a Pixi custom build to get WebGPU back without aliasing internals.
export const WebGPURenderer = { extension: { type: [], name: "webgpu-stub" } };
export const isWebGPUSupported = async (): Promise<boolean> => false;

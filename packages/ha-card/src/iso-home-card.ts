import { type ElementPack, HomeModelSchema } from "@iso-home/core-model";
import {
  Camera,
  ConnectionState,
  IdleRenderLoop,
  type Interactions,
  type RenderedObject,
  attachInteractions,
  buildObjectSprites,
  buildRoomScene,
  createApp,
  loadPacks,
} from "@iso-home/core-render";
import { LitElement, css, html } from "lit";
import { type Application, Assets, type Texture } from "pixi.js";
import { diffEntities } from "./entity-diff.js";
import type { Hass, HassConnection, HassEntity } from "./hass.js";

interface CardConfig {
  /** URL of the HomeModel JSON (importer rooms + hand-written objects). */
  homeModelPath?: string;
  /** URLs of element pack manifests; sprite files resolve relative to each manifest. */
  packPaths?: string[];
}

const DEFAULT_MODEL_PATH = "/local/iso-home/home-model.json";

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`iso-home-card: ${url} returned ${response.status}`);
  return response.json();
}

class IsoHomeCard extends LitElement {
  static override styles = css`
    :host { display: block; min-height: 320px; height: 100%; background: #1a1410; }
    #stage { width: 100%; height: 100%; min-height: inherit; }
    canvas { display: block; touch-action: none; }
  `;

  private config: CardConfig = {};
  private hassValue: Hass | undefined;
  private readonly connection = new ConnectionState();
  private boundConnection: HassConnection | undefined;
  private readonly lastStates = new Map<string, HassEntity | undefined>();
  private interactions: Interactions | undefined;
  private items: RenderedObject[] = [];
  private teardown: (() => void) | undefined;
  private destroyed = false;

  setConfig(config: CardConfig): void {
    this.config = config;
  }

  getCardSize(): number {
    return 6;
  }

  set hass(hass: Hass) {
    this.hassValue = hass;
    this.bindConnection(hass.connection);
    this.syncEntities();
  }

  get hass(): Hass | undefined {
    return this.hassValue;
  }

  protected override render() {
    return html`<div id="stage"></div>`;
  }

  protected override firstUpdated(): void {
    this.destroyed = false;
    this.init().catch((error: unknown) => console.error("[iso-home-card]", error));
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.destroyed = true;
    this.teardown?.();
    this.teardown = undefined;
  }

  /** The card never opens its own socket; it mirrors HA's own connection lifecycle (FR-017). */
  private bindConnection(connection: HassConnection | undefined): void {
    if (connection === undefined || connection === this.boundConnection) return;
    this.boundConnection = connection;
    connection.addEventListener("ready", () => this.connection.setStatus("connected"));
    connection.addEventListener("disconnected", () => this.connection.setStatus("reconnecting"));
  }

  private syncEntities(): void {
    if (this.hassValue === undefined || this.interactions === undefined) return;
    const watched = this.items.flatMap((i) => (i.object.entityId ? [i.object.entityId] : []));
    for (const [id, entity] of diffEntities(this.lastStates, this.hassValue.states, watched)) {
      this.interactions.applyEntityState(id, entity.state, entity.attributes);
    }
  }

  private async init(): Promise<void> {
    const stage = this.renderRoot.querySelector<HTMLElement>("#stage");
    if (stage === null) return;

    const packPaths = this.config.packPaths ?? [];
    const [rawModel, manifests] = await Promise.all([
      fetchJson(this.config.homeModelPath ?? DEFAULT_MODEL_PATH),
      Promise.all(packPaths.map(fetchJson)),
    ]);
    const model = HomeModelSchema.parse(rawModel);
    const room = model.rooms[0];
    if (room === undefined) throw new Error("iso-home-card: HomeModel has no rooms");

    const packs = loadPacks(manifests);
    const baseUrls = new Map(
      manifests.map((m, i) => [
        (m as { id: string }).id,
        new URL(packPaths[i] as string, location.href).href,
      ]),
    );
    const textures = new Map<string, Texture>();
    for (const pack of packs.values()) {
      for (const frame of Object.values(pack.sprites)) {
        const texture = await Assets.load<Texture>(new URL(frame, baseUrls.get(pack.id)).href);
        texture.source.scaleMode = "nearest";
        textures.set(`${pack.id}/${frame}`, texture);
      }
    }
    const texture = (pack: ElementPack, frame: string): Texture =>
      textures.get(`${pack.id}/${frame}`) as Texture;
    if (this.destroyed) return;

    const size = () => ({ width: stage.clientWidth || 640, height: stage.clientHeight || 480 });
    const app: Application = await createApp(size());
    if (this.destroyed) {
      app.destroy(true);
      return;
    }
    stage.appendChild(app.canvas);

    const world = buildRoomScene(room);
    app.stage.addChild(world);
    this.items = buildObjectSprites(model.objects, packs, texture);
    for (const item of this.items) world.addChild(item.sprite);
    const camera = new Camera(world, room, size);
    camera.refit();

    app.stop();
    const loop = new IdleRenderLoop(() => app.render());
    let frame = 0;
    const tick = (): void => {
      loop.tick();
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    this.interactions = attachInteractions({
      canvas: app.canvas,
      stage: app.stage,
      items: this.items,
      camera,
      texture,
      loop,
      connection: this.connection,
      onOpenDevice: (item) =>
        this.dispatchEvent(
          new CustomEvent("hass-more-info", {
            detail: { entityId: item.object.entityId },
            bubbles: true,
            composed: true,
          }),
        ),
      onQuickAction: async (item, service) => {
        const [domain = "", name = ""] = service.split(".");
        await this.hassValue?.callService(domain, name, { entity_id: item.object.entityId });
      },
    });

    const observer = new ResizeObserver(() => {
      const { width, height } = size();
      app.renderer.resize(width, height);
      camera.refit();
      loop.requestRender();
    });
    observer.observe(stage);

    this.teardown = () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      this.interactions?.dispose();
      this.interactions = undefined;
      app.destroy(true);
    };
    this.syncEntities();
  }
}

customElements.define("iso-home-card", IsoHomeCard);

(window as unknown as { customCards?: unknown[] }).customCards ??= [];
(window as unknown as { customCards: unknown[] }).customCards.push({
  type: "iso-home-card",
  name: "IsoHome",
  description: "Touch-controlled isometric room",
});

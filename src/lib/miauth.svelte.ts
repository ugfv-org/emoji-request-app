import { api } from "misskey-js";
import { v4 as uuid } from "uuid";
import { accessToken } from "./store";
import { get } from "svelte/store";
import { PUBLIC_MISSKEY_SERVER_URL } from "$env/static/public";

export class MiAuth {
  private sessionId = $state<string | null>(null);
  constructor() {}

  readonly isTokenReady = $derived(this.sessionId != null);
  getUrl(): string {
    this.sessionId = uuid();
    return `${PUBLIC_MISSKEY_SERVER_URL}/miauth/${this.sessionId}?name=emoji-request-app&permission=read:account`;
  }
  async requestToken(): Promise<void> {
    if (this.sessionId == null) throw new Error("token is not ready");
    const client = new api.APIClient({ origin: PUBLIC_MISSKEY_SERVER_URL });
    const { token } = (await client.request(`miauth/${this.sessionId}/check`)) as unknown as { token: string };
    this.sessionId = null;
    accessToken.set(token);
  }
}
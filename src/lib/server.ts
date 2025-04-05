
import { env } from '$env/dynamic/private';
import { PUBLIC_MISSKEY_SERVER_URL, PUBLIC_CHANNEL_ID } from '$env/static/public';
import { Hono } from 'hono';
import { api, note } from 'misskey-js';
import type { DriveFilesCreateResponse, AdminEmojiAddRequest } from 'misskey-js/entities.js';

import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

// import { REST } from 'discord.js';

const miApi = new api.APIClient({
  origin: PUBLIC_MISSKEY_SERVER_URL,
  credential: env.EMOJI_ACCESS_TOKEN,
})

// const rest = new REST().setToken(DISCORD_TOKEN)

export const addEmoji = async (request: AdminEmojiAddRequest) => {
  // const formData = new FormData();
  // formData.append("i", EMOJI_ACCESS_TOKEN);
  // formData.append("file", file);
  // const createFile = await (await miApi.fetch(`${PUBLIC_MISSKEY_SERVER_URL}/api/drive/files/create`, {
  //   method: "POST", body: formData, headers: {},
  // })).json() as any as DriveFilesCreateResponse
  // request.fileId = createFile.id;
  const ret = await miApi.request("admin/emoji/add", request);

  let noteText = `新しい絵文字:${ret.name}:（\`${ret.name}\`）が追加されました。\n`
  if (ret.category !== "" && ret.category !== null) {
    noteText += `この絵文字は\`${ret.category}\`に分類されています。\n`;
  }

  if (ret.aliases[0] !== "" && ret.aliases[0] !== null) {
    noteText += `また、この絵文字は\`${ret.aliases.join(
      ", "
    )}\`でも出す事が出来ます。\n`;
  }
  noteText += `$[x3 :${ret.name}:]\n`;
  if (ret.license !== "" && ret.license !== null) {
    const replacedMention = ret.license.replaceAll("@", "@ ")
    noteText += `ライセンス： ${replacedMention}`;
  }


  const note = await miApi.request("notes/create", {
    text: noteText,
    channelId: PUBLIC_CHANNEL_ID,
  })
  console.log(ret)
}

const app = new Hono()
  .post('/api/req', zValidator('json', z.object({
    noteId: z.string(),
    authorToken: z.string(),
    emojis: z.array(z.object({
      name: z.string(),
      fileId: z.string(),
      category: z.string().nullable().optional(),
      aliases: z.array(z.string()).optional(),
      license: z.string().nullable().optional(),
      isSensitive: z.boolean().optional(),
      localOnly: z.boolean().optional(),
      roleIdsThatCanBeUsedThisEmojiAsReaction: z.array(z.string()).optional(),
    }))
  })), async (c) => {
    const request = c.req.valid('json');

    // 申請者のトークンとノートの作者のトークンが一致するか
    const miCheckApi = new api.APIClient({
      origin: PUBLIC_MISSKEY_SERVER_URL,
      credential: request.authorToken,
    })

    const promiseNote = miCheckApi.request("notes/show", {
      noteId: request.noteId,
      includeReactions: false,
      includeRenote: false,
      includeUser: true,
    })

    const promiseI = miCheckApi.request("i", {})

    const [note, i] = await Promise.all([promiseNote, promiseI])
    if (i.id !== note.user.id) {
      return c.text("Unauthorized", 401)
    }

    for (let i = 0; i < request.emojis.length; i++) {
      await addEmoji(request.emojis[i])
    }
    return c.text("ok")
  });




export default app;
export type App = typeof app;

import { env } from '$env/dynamic/private';
import { PUBLIC_MISSKEY_SERVER_URL, PUBLIC_CHANNEL_ID } from '$env/static/public';
import { Hono } from 'hono';
// import { api, note } from 'misskey-js';
import type { AdminEmojiAddRequest, AdminEmojiAddResponse } from 'misskey-js/entities.js';

import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

// import { REST } from 'discord.js';

// const miApi = new api.APIClient({
//   origin: PUBLIC_MISSKEY_SERVER_URL,
//   credential: env.EMOJI_ACCESS_TOKEN,
// })

// const rest = new REST().setToken(DISCORD_TOKEN)

export const addEmoji = async (request: AdminEmojiAddRequest) => {
  // const formData = new FormData();
  // formData.append("i", EMOJI_ACCESS_TOKEN);
  // formData.append("file", file);
  // const createFile = await (await miApi.fetch(`${PUBLIC_MISSKEY_SERVER_URL}/api/drive/files/create`, {
  //   method: "POST", body: formData, headers: {},
  // })).json() as any as DriveFilesCreateResponse
  // request.fileId = createFile.id;
  // const ret = await miApi.request("admin/emoji/add", request);

  const ret = await (await fetch(`${PUBLIC_MISSKEY_SERVER_URL}/api/admin/emoji/add`, {
    method: "POST",
    body: JSON.stringify({
      ...request,
      i: env.EMOJI_ACCESS_TOKEN,
    }),
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${env.EMOJI_ACCESS_TOKEN}`,
    },
  })).json() as any as AdminEmojiAddResponse

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

  await fetch(`${PUBLIC_MISSKEY_SERVER_URL}/api/notes/create`, {
    method: "POST",
    body: JSON.stringify({
      text: noteText,
      channelId: PUBLIC_CHANNEL_ID,
    }),
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${env.EMOJI_ACCESS_TOKEN}`,
    },
  })
  // const note = await miApi.request("notes/create", {
  //   text: noteText,
  //   channelId: PUBLIC_CHANNEL_ID,
  // })
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

    try {
      const request = c.req.valid('json');

      // 申請者のトークンとノートの作者のトークンが一致するか
      // const miCheckApi = new api.APIClient({
      //   origin: PUBLIC_MISSKEY_SERVER_URL,
      //   credential: request.authorToken,
      // })

      // const promiseNote = miCheckApi.request("notes/show", {
      //   noteId: request.noteId,
      //   includeReactions: false,
      //   includeRenote: false,
      //   includeUser: true,
      // })

      // const promiseI = miCheckApi.request("i", {})

      const promiseNote = fetch(`${PUBLIC_MISSKEY_SERVER_URL}/api/notes/show`, {
        method: "POST",
        body: JSON.stringify({
          noteId: request.noteId,
          includeReactions: false,
          includeRenote: false,
          includeUser: true,
          i: env.EMOJI_ACCESS_TOKEN,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      })
      
      const promiseI = fetch(`${PUBLIC_MISSKEY_SERVER_URL}/api/i`, {
        method: "POST",
        body: JSON.stringify({
          i: request.authorToken,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      })

      const [note, i] = await Promise.all([promiseNote, promiseI]) as any[]
      const noteJson = await note.json()
      const iJson = await i.json()
      if (iJson.id !== noteJson.user.id) {
        return c.text("Unauthorized", 401)
      }

      for (let i = 0; i < request.emojis.length; i++) {
        await addEmoji(request.emojis[i])
      }
      return c.text("ok")
    } catch (err) {
      console.log(err)
      return c.text("error", 500)
    }
  });




export default app;
export type App = typeof app;
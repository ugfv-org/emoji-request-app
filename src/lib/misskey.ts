import { api } from "misskey-js";

import { accessToken, type Emoji } from "./store";
import { get } from "svelte/store";
import type { APIClient } from "misskey-js/api.js";
import type { AdminEmojiAddRequest, DriveFilesCreateResponse, Note } from "misskey-js/entities.js";
import { PUBLIC_MISSKEY_SERVER_URL } from "$env/static/public";


let miApi: APIClient;

const NAMECHAR = "①"
const SPLITCHAR = "▼"
const TAGSPLITCHAR = / |　/
const REPEATCHAR_REGEXP = /^(★|☆)$/
const EMOJINAME_REGEXP = /:([a-z0-9_+-]+):/i

// 読み取りはこの順番に行われる。入れ替わりがあると正しく読み取られない
const requestFields: [string, (text: string, emoji: Emoji) => void][] = [
  ["①", (text, emoji) => emoji.name = text.match(EMOJINAME_REGEXP)![1]],
  ["②", (text, emoji) => emoji.license = text],
  ["③", (text, emoji) => emoji.from = text],
  ["④", (text, emoji) => emoji.description = text],
  ["⑤", (text, emoji) => emoji.tag = text.split(TAGSPLITCHAR)],
  // 以下docに定義なし フォーマットの定義が必要
  ["⑥", (text, emoji) => emoji.category = text],
  ["⑦", (text, emoji) => emoji.isSensitive = text],
  ["⑧", (text, emoji) => emoji.localOnly = text],
];

export const init = () => {
  miApi = new api.APIClient({
    origin: PUBLIC_MISSKEY_SERVER_URL,
    credential: get(accessToken),
  })
}

export const getNote = async (noteId: string): Promise<Note> => {
  const note = await miApi.request("notes/show", {
    noteId
  })

  return note;
}

export const splitEmojis = (note: Note): Emoji[] => {

  const splitText = note.text?.split(SPLITCHAR);
  const emojis: Emoji[] = []

  if (splitText == null) return [];

  if (!splitText[0].includes(NAMECHAR)) {
    splitText.splice(0, 1);
  }

  let prevFieldTexts: string[] = [];

  splitText.forEach((emojiText, emojiIdx) => {
    if (!emojiText.includes(NAMECHAR)) return;
    if (note.files?.[emojiIdx] == null) return;

    const positions = [];
    for (const [numbering] of requestFields) {
      const prevPosObj = positions.at(-1);
      const prevPos = prevPosObj == null ? 0 : prevPosObj.pos + prevPosObj.skip;
      const pos = emojiText.indexOf(numbering, prevPos); 
      if (pos === -1) break;
      positions.push({ pos, skip: numbering.length });
    }
    positions.push({ pos: emojiText.length, skip: 0});

    const fieldTexts: string[] = [];
    positions.reduce((start, end) => {
      fieldTexts.push(emojiText.slice(start.pos + start.skip, end.pos).trim());
      return end;
    });

    fieldTexts.map((text, i) => {
      if (text.match(REPEATCHAR_REGEXP)) fieldTexts[i] = prevFieldTexts[i];
    });

    prevFieldTexts = fieldTexts;

    const emoji: Emoji = {
      name: "",
      license: "",
      from: "",
      description: "",
      tag: [],
      originalText: emojiText,
      category: "",
      isSensitive: "",
      localOnly: "",
      file: note.files[emojiIdx]
    }

    fieldTexts.forEach((text, idx) => {
      requestFields[idx][1](text, emoji);
    });

    emojis.push(emoji);
  })

  return emojis
}

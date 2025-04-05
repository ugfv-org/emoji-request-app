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

  // 前の絵文字のフィールド値を保持する (フィールド番号をキーとする)
  let prevFieldTexts: Record<string, string> = {};

  splitText.forEach((emojiText, emojiIdx) => {
    if (!emojiText.includes(NAMECHAR)) return;
    if (note.files?.[emojiIdx] == null) return;

    // 各フィールドの番号と位置、テキストを抽出
    const foundFields: { numbering: string; pos: number; text: string }[] = [];
    for (const [numbering] of requestFields) {
      const pos = emojiText.indexOf(numbering);
      if (pos !== -1) {
        foundFields.push({ numbering, pos, text: "" });
      }
    }

    // 位置でソート
    foundFields.sort((a, b) => a.pos - b.pos);

    // 各フィールドのテキストを抽出
    for (let i = 0; i < foundFields.length; i++) {
      const currentField = foundFields[i];
      const nextField = foundFields[i + 1];
      const start = currentField.pos + currentField.numbering.length;
      const end = nextField ? nextField.pos : emojiText.length;
      currentField.text = emojiText.slice(start, end).trim();
    }

    // 現在の絵文字のフィールド値を一時的に保持する
    const currentFieldTexts: Record<string, string> = {};

    const emoji: Emoji = {
      name: "", // デフォルト値を設定
      license: "",
      from: "",
      description: "",
      tag: [],
      originalText: emojiText,
      category: "",
      isSensitive: "",
      localOnly: "",
      file: note.files[emojiIdx],
    };

    // requestFieldsMap を作成して、番号から処理関数を引けるようにする
    const requestFieldsMap = new Map(requestFields);

    // 抽出したフィールド情報を使って emoji オブジェクトを更新
    foundFields.forEach(field => {
      const processFunc = requestFieldsMap.get(field.numbering);
      let valueToSet = field.text;

      // ★や☆が見つかった場合、前の絵文字の同じフィールドの値を使用
      if (valueToSet.match(REPEATCHAR_REGEXP)) {
        valueToSet = prevFieldTexts[field.numbering] || ""; // 前の値がなければ空文字
      }

      // 現在の絵文字のフィールド値を保存 (次の絵文字の繰り返し処理用)
      currentFieldTexts[field.numbering] = valueToSet;

      // 対応する処理関数を実行
      if (processFunc) {
        processFunc(valueToSet, emoji);
      }
    });

    emojis.push(emoji);

    // 次の絵文字のために、現在のフィールド値を prevFieldTexts として保存
    prevFieldTexts = currentFieldTexts;
  })

  return emojis
}

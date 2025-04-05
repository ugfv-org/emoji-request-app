<script lang="ts">
	import {
		PUBLIC_MISSKEY_SERVER_URL,
		PUBLIC_MISSKEY_SERVER_NAME,
		PUBLIC_EMOJI_TERMS,
		PUBLIC_CHANNEL_ID
	} from '$env/static/public';
	import { MiAuth } from '$lib/miauth.svelte';
	import { accessToken, getCookie, updateCookie, note, emojis, sendEmojis } from '$lib/store';
	import { get } from 'svelte/store';
	import { getNote, init, splitEmojis } from '$lib/misskey';
	import { onMount, tick } from 'svelte';
	import EmojiViewer from '../components/EmojiViewer.svelte';

	import { hc } from 'hono/client';
	import type { App } from '$lib/server';
	const client = hc<App>('/');

	let parsed = $state(false);
	let authed = $state(false);
	let noteUrl = $state('');
	let requested = $state(false);
	let agree = $state(false);
	let error = $state(false);
	let selectedTab: null | number = $state(null);

	const tabSelect = async (tabId: typeof selectedTab) => {
		selectedTab = null;
		await tick();
		selectedTab = tabId;
	};

	const miAuth = new MiAuth();

	onMount(() => {
		getCookie();
		if (get(accessToken)) {
			init();
			authed = true;
		}
	});

	const auth = async () => {
		await miAuth.requestToken();
		updateCookie();
		init();
		authed = true;
	};

	const parseNoteUrl = async () => {
		note.set(await getNote(noteUrl));
		console.log(note);
		emojis.set(splitEmojis(get(note)));
		console.log(get(emojis));
		if (get(emojis).length > 0) {
			parsed = true;
			tabSelect(0);
		}
	};

	const requestEmoji = async () => {
		
		try {
			await client.api.req.$post({
				json: {
					noteId: get(note).id,
					authorToken: get(accessToken),
					emojis: get(sendEmojis)
				}
			});
			requested = true;
		} catch (e) {
			console.error(e);
			error = true;
		}
	};

	const removeAuth = () => {
		accessToken.set('');
		updateCookie();
		authed = false;
	};
</script>

<svelte:head>
	<title>{PUBLIC_MISSKEY_SERVER_NAME} 絵文字申請ページ</title>
</svelte:head>

{#if error}
	エラーが発生しました
{:else if requested}
	申請が完了しました 申請結果は<a href={`${PUBLIC_MISSKEY_SERVER_URL}/channels/${PUBLIC_CHANNEL_ID}`} class="link link-hover link-secondary"
		>こちら</a
	>
{:else if authed}
	<div class="flex justify-center">
		<div class="card min-w-180">
			<div class="card-body">
				<div class="card-title prose">
					<h1>{PUBLIC_MISSKEY_SERVER_NAME} 絵文字申請ページ</h1>
				</div>
				<div>
					<fieldset class="fieldset">
						<legend class="fieldset-legend">ノートのURL</legend>
						<input
							class="input w-full"
							placeholder={PUBLIC_MISSKEY_SERVER_URL + '/notes/xxxxxxのxxxxxxの部分を貼り付け'}
							type="text"
							bind:value={noteUrl}
						/>
					</fieldset>
					<button class="btn btn-block btn-secondary" onclick={parseNoteUrl}>ノートを取得</button>
				</div>

				<div role="tablist" class="tabs tabs-bordered bg-base-300 w-full overflow-auto shadow">
					{#each $emojis as emoji, index}
						<button
							role="tab"
							class="tab {selectedTab === index ? 'tab-active' : ''} overflow-hidden"
							onclick={() => tabSelect(index)}
						>
							<div class="flex min-w-4 flex-row">
								<!-- svelte-ignore a11y_missing_attribute -->
								<img class="w-4 object-contain" src={emoji.file.url} />
								<span class="px-2 whitespace-nowrap">:{emoji.name}:</span>
							</div>
						</button>
					{/each}
				</div>

				<div class="p-4">
					{#if selectedTab == null}
						<div></div>
					{:else}
						<EmojiViewer bind:sendEmojiData={$sendEmojis[selectedTab]} bind:emoji={$emojis[selectedTab]}></EmojiViewer>
					{/if}
				</div>
				{#if parsed}
					<div class="form-control text-center">
						<label class="label cursor-pointer">
							<span class="label-text m-4 text-2xl"
								><a href={PUBLIC_EMOJI_TERMS} class="link link-hover link-secondary" target="_blank"
									>絵文字申請ルール</a
								>を確認しました</span
							>
							<input
								type="checkbox"
								class="toggle toggle-secondary toggle-lg"
								bind:checked={agree}
							/>
						</label>
					</div>
					<button class="btn btn-primary" disabled={!agree} onclick={requestEmoji}>申請する</button>
				{:else}
					<button class="btn btn-sm btn-ghost" onclick={removeAuth}>認証解除</button>
				{/if}
			</div>
		</div>
	</div>
{:else}
	<div class="flex justify-center">
		<div class="card">
			<div class="card-body prose">
				<div class="card-title">
					<h1>{PUBLIC_MISSKEY_SERVER_NAME} 絵文字申請フォーム</h1>
				</div>
				<div class="card-actions">
					{#if miAuth.isTokenReady}
						<button class="btn btn-secondary btn-block" onclick={auth}> 認証完了後クリック </button>
					{:else}
						<button class="btn btn-primary btn-block" onclick={() => open(miAuth.getUrl())}>
							認証
						</button>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}

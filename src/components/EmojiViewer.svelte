<script lang="ts">
	import { note, serverUrl, type Emoji } from '../lib/store';
	import { get } from 'svelte/store';
	import type { AdminEmojiAddRequest } from 'misskey-js/entities.js';

	export let emoji: Emoji;

	let taginput = '';

	export let sendEmojiData: AdminEmojiAddRequest;
	

</script>

<div class="card shadow-md">
	<div class="card-body">
		<div class="card-title text-lg">申請情報</div>
		<div class="flex flex-wrap gap-2">
			<img class="w-4 bg-black object-contain" src={emoji.file.url} />
			<img class="w-4 bg-white object-contain" src={emoji.file.url} />
			<img class="w-8 bg-black object-contain" src={emoji.file.url} />
			<img class="w-8 bg-white object-contain" src={emoji.file.url} />
			<img class="w-16 bg-black object-contain" src={emoji.file.url} />
			<img class="w-16 bg-white object-contain" src={emoji.file.url} />
			<img class="w-32 bg-black object-contain" src={emoji.file.url} />
			<img class="w-32 bg-white object-contain" src={emoji.file.url} />
		</div>
		<table class="table-zebra table table-fixed">
			<tbody>
				<tr>
					<th>申請ユーザーID</th>
					<td>
						<a class="link" href={`https://${$serverUrl}/@${$note.user.username}`} target="_blank"
							>{$note.user.username}</a
						>
					</td>
				</tr>
				<tr>
					<th>ショートコード</th>
					<td>{emoji.name}</td>
				</tr>
				<tr>
					<th>ライセンス</th>
					<td>{emoji.license}</td>
				</tr>
				<tr>
					<th>作成方法</th>
					<td>{emoji.from}</td>
				</tr>
				<tr>
					<th>説明</th>
					<td>{emoji.description}</td>
				</tr>
				<tr>
					<th>タグ</th>
					<td>{emoji.tag}</td>
				</tr>
				<tr>
					<th>ファイル名</th>
					<td>{emoji.file.name}</td>
				</tr>
				<tr>
					<th>ファイルタイプ</th>
					<td>{emoji.file.type}</td>
				</tr>
				<tr>
					<th>ファイルサイズ</th>
					<td>{emoji.file.size / 1000.0} KB</td>
				</tr>
				<tr>
					<th>ファイルURL</th>
					<td class="max-w-24 text-wrap"
						><a class="link" href={emoji.file.url} target="_blank">{emoji.file.url}</a></td
					>
				</tr>
			</tbody>
		</table>
	</div>
</div>
<div class="card shadow-md">
	<div class="card-body">
		<div class="card-title">登録</div>
		<div class="grid grid-cols-2 gap-2">
			<div>
				<div class="form-control">
					<label> <span class="label-text">ショートコード</span></label>
					<input
						id="name"
						bind:value={sendEmojiData.name}
						type="text"
						class="input input-xs input-bordered md:input-md md:w-full"
					/>
				</div>
				<div class="form-control">
					<label> <span class="label-text">ライセンス</span></label>
					<input
						id="license"
						bind:value={sendEmojiData.license}
						type="text"
						class="input input-xs input-bordered md:input-md md:w-full"
					/>
				</div>

				<div class="form-control">
					<label>
						<span class="label-text">タグ</span>
						<input
							id="tag"
							bind:value={taginput}
							type="text"
							class="input input-xs input-bordered md:input-md md:w-full"
							onchange={() => {
								sendEmojiData.aliases = [...sendEmojiData.aliases!, taginput];
								taginput = '';
							}}
						/></label
					>
				</div>
			</div>
			<div>
				<div class="form-control">
					<label> <span class="label-text">カテゴリー</span></label>
					<input
						id="category"
						bind:value={sendEmojiData.category}
						type="text"
						class="input input-xs input-bordered md:input-md md:w-full"
					/>
				</div>
				<div class="flex gap-8">
					<div class="form-control">
						<label class="label cursor-pointer">
							<span class="label-text m-4">センシティブ</span>
							<input type="checkbox" class="toggle toggle-secondary" bind:checked={sendEmojiData.isSensitive} />
						</label>
					</div>
					<div class="form-control">
						<label class="label cursor-pointer">
							<span class="label-text m-4">ローカルのみ</span>
							<input type="checkbox" class="toggle toggle-secondary" bind:checked={sendEmojiData.localOnly} />
						</label>
					</div>
				</div>
			</div>
			<div class="flex flex-wrap gap-4">
				{#each sendEmojiData.aliases! as tag, index}
					<button
						class="btn btn-outline btn-sm rounded-full"
						onclick={() => {
							sendEmojiData.aliases!.splice(index, 1);
							sendEmojiData.aliases = sendEmojiData.aliases;
						}}
					>
						{tag}
						<div class="badge badge-error">×</div>
					</button>
				{/each}
			</div>
		</div>
	</div>
</div>

import axios from 'axios';
import fs from 'fs';
import { EventEmitter } from 'events';
import IServiceAdapterInput from './interfaces/IServiceAdapterInput';
import Message from './Message';

export default class ServiceAdapter {
	private readonly isDev: boolean;
	private readonly message: Message;
	private readonly options: Record<string, unknown>;
	private readonly token?: string;
	private readonly internalEmitter: EventEmitter;

	private currentConfig: Record<string, unknown>;
	private poll: boolean;

	readonly baseUrl: string;
	readonly emitter: EventEmitter;
	readonly fileName?: string;
	readonly organization?: string;
	readonly repository?: string;
	readonly username?: string;

	local: boolean;
	mute: boolean;
	pollInterval?: number;
	timeoutFn: typeof setTimeout;
	verbose: boolean;

	constructor({
		fileName = process.env.GIT_FILE,
		local = false,
		mute = false,
		organization = process.env.GIT_ORG,
		pollInterval,
		repository = process.env.GIT_REPO,
		token = process.env.GIT_SERVICE_ACCESS_TOKEN,
		username = process.env.GIT_USERNAME,
		verbose = false,
		timeoutFn = setTimeout,
	}: IServiceAdapterInput) {
		this.baseUrl = 'https://api.github.com';
		this.currentConfig = {};
		this.emitter = new EventEmitter();
		this.fileName = fileName;
		this.internalEmitter = new EventEmitter();
		this.isDev = process.env.NODE_ENV === 'development';
		this.local = local;
		this.mute = mute;
		this.message = new Message();
		this.organization = organization;
		this.poll = true;
		this.pollInterval = pollInterval;
		this.repository = repository;
		this.username = username;
		this.token = token;
		this.verbose = verbose;
		this.timeoutFn = timeoutFn;

		this.options = {
			headers: {
				Authorization: `token ${this.token}`,
				accept: 'application/vnd.github.v3+json',
			},
		};

		this.internalEmitter.addListener(
			'configReceived',
			this.onConfigReceived
		);
		this.checkInputs();
	}

	private checkInputs() {
		const missingInputs = [];
		if (!this.username) missingInputs.push('username');
		if (!this.token) missingInputs.push('token');
		if (!this.repository) missingInputs.push('repository');
		if (!this.fileName) missingInputs.push('fileName');
		if (this.local && this.isDev) {
			this.message.isLocal();
			if (missingInputs.length)
				this.message.missingInputsWarning({
					missingInputs,
					isLocal: this.local,
				});
		} else {
			if (missingInputs.length)
				this.message.missingInputsWarning({
					missingInputs,
					isLocal: this.local,
					throwErr: true,
				});
		}
	}

	async establishConnection() {
		try {
			const { data } = await axios.get(
				`${this.baseUrl}/user`,
				this.options
			);
			const { login } = data;
			if (login !== this.username)
				throw new Error('Token did not grant access.');
		} catch (e) {
			!this.mute && this.message.establishConnectionFailure({ e });
			return false;
		}

		!this.mute &&
			this.message.establishConnectionSuccess({
				username: `${this.username}`,
			});

		return true;
	}

	async fetchConfigFile() {
		if (this.local) return this.fetchFromLocal();
		let res;
		const url = this.organization
			? `${this.baseUrl}/repos/${this.organization}/${this.repository}/contents/${this.fileName}`
			: `${this.baseUrl}/repos/${this.username}/${this.repository}/contents/${this.fileName}`;

		try {
			const { data } = await axios.get(url, this.options);
			const { download_url } = data;
			res = await this.fetchFromRemote({ download_url });
		} catch (e) {
			!this.mute &&
				this.message.fetchConfigFileFailure({
					fileName: this.fileName,
					repository: this.repository,
					e,
				});
			this.startPollLoop();
			return false;
		}

		return res;
	}

	private fetchFromLocal(): Record<string, unknown> | undefined {
		const CWD = process.cwd();
		const pathToConfig = `${CWD}/local.json`;
		let res;

		try {
			const raw = fs.readFileSync(pathToConfig);
			res = JSON.parse(raw.toString());
		} catch (e) {
			!this.mute && this.message.fetchLocalConfigFileFailure({ e });
			this.startPollLoop();
			return;
		}
		this.internalEmitter.emit('configReceived', res, this);
		return Object.freeze({ ...res });
	}

	private async fetchFromRemote({ download_url }: { download_url: string }) {
		let res;
		try {
			const { data } = await axios.get(download_url);
			res = data;
		} catch (e) {
			throw e;
		}
		this.internalEmitter.emit('configReceived', res, this);
		return Object.freeze({ ...res });
	}

	private async onConfigReceived(data: any, context: any) {
		await context.reconcileConfig({ data });
	}

	private async reconcileConfig({ data }: { data: any }) {
		const current = JSON.stringify(this.currentConfig);
		const proposed = JSON.stringify(data);
		if (current !== proposed) {
			this.currentConfig = { ...data };
			!this.mute &&
				this.message.receivedNewConfigSuccessfully({
					username: this.local ? 'local.json' : `${this.username}`,
				});
			if (this.verbose && this.isDev) console.log(data, '\n');
			this.emitter.emit('configUpdated', Object.freeze({ ...data }));
		}
		this.startPollLoop();
	}

	private startPollLoop() {
		if (!this.pollInterval || !this.poll) return;
		this.timeoutFn(async () => this.fetchConfigFile(), this.pollInterval);
	}

	togglePollLoop(mode: boolean) {
		if (typeof mode !== 'boolean') return;
		this.poll = mode;
		!this.mute && this.message.pollingBehaviorToggled(mode);
	}

	printConnection() {
		this.message.printConnection({
			repository: this.repository,
			organization: this.organization,
			username: this.username,
			fileName: this.fileName,
		});
	}
}

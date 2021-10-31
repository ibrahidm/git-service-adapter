import chalk from 'chalk';

export default class Message {
	establishConnectionSuccess({ username }: { username: string }) {
		console.log(
			`\n\t${chalk.blue('Git Service Adapter')}:\n\t${chalk.black.bgGreen(
				` Successfully established connection with ${chalk.magenta(
					username
				)} `
			)}\n`
		);
	}

	establishConnectionFailure({ e }: { e: unknown }) {
		console.log(
			`\t${chalk.blue(
				'Git Service Adapter'
			)}:\n\tCould not establish connection with github.\n\tPlease check your input values.\n\t${chalk.redBright(
				e
			)}\n`
		);
	}

	isLocal() {
		console.log(
			`\n\t${chalk.blue(
				'Git Service Adapter'
			)}:\n\t${chalk.black.bgYellow(
				` Local Development Environment:\n\t You may still call \`establishConnection()\` to verify credentials,\n\t however config environment will be loaded from: `
			)}\n\n\t${chalk.black.bgWhite(
				'  local.json  '
			)}\n\n\t${chalk.black.bgYellow(
				` Please ensure this file exists in the root directory of your project. `
			)}\n`
		);
	}

	missingInputsWarning({
		missingInputs,
		isLocal,
		throwErr,
	}: {
		missingInputs: Array<string>;
		isLocal: boolean;
		throwErr?: boolean;
	}) {
		console.log(
			`\t${chalk.blue('Git Service Adapter')}:\n\t${chalk.white.bgRed(
				` The following arguments could not be read from the environment and\n\t were missing from class instantiation: \n\n\t\t- ${missingInputs.join(
					'\n\t\t- '
				)}\n\n\t in non-local environments, this warning will be followed by an error.`
			)}\n\n\tNODE_ENV = ${chalk.green(
				process.env.NODE_ENV
			)}\n\tLocal Flag = ${chalk.green(isLocal)}\n`
		);

		if (throwErr) {
			throw new Error('Missing essential arguments.');
		}
	}

	fetchConfigFileFailure({
		fileName,
		repository,
		e,
	}: {
		fileName: string | undefined;
		repository: string | undefined;
		e: unknown;
	}) {
		console.log(
			`\t${chalk.blue(
				'Git Service Adapter'
			)}:\n\tCould not fetch file ${fileName} from ${repository}.\n\t${chalk.redBright(
				e
			)}\n`
		);
	}

	fetchLocalConfigFileFailure({ e }: { e: unknown }) {
		console.log(
			`\t${chalk.blue(
				'Git Service Adapter'
			)}:\n\tCould not find or fetch local.json from root.\n\t${chalk.redBright(
				e
			)}\n`
		);
	}

	printConnection({
		repository,
		username,
		organization,
		fileName,
	}: {
		repository: string | undefined;
		organization: string | undefined;
		username: string | undefined;
		fileName: string | undefined;
	}) {
		console.log(
			`\t${chalk.blue(
				'Git Service Adapter:'
			)}\n\n\t ${chalk.black.bgYellow(
				' username '
			)}: ${username}\n\t ${chalk.black.bgYellow(
				' repository '
			)}: ${repository}\n\t ${chalk.black.bgYellow(
				' organization '
			)}: ${organization}\n\t ${chalk.black.bgYellow(
				' fileName '
			)}: ${fileName}\n`
		);
	}

	receivedNewConfigSuccessfully({ username }: { username: string }) {
		console.log(
			`\n\t${chalk.blue('Git Service Adapter')}:\n\t${chalk.black.bgGreen(
				` Successfully emitted new environment from ${chalk.magenta(
					username
				)} `
			)}\n`
		);
	}

	pollingBehaviorToggled(mode: boolean) {
		console.log(
			`\n\t${chalk.blue(
				'Git Service Adapter'
			)}:\n\tPolling Behavior has been set to: ${chalk.green(`${mode}`)}`
		);
	}
}

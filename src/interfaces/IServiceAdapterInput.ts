export default interface IServiceAdapterInput {
	username?: string;
	token?: string;
	pollInterval?: number;
	organization?: string;
	repository?: string;
	fileName?: string;
	mute?: boolean;
	local?: boolean;
	verbose?: boolean;
}

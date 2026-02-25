export class SessionObject {
	constructor(
		private state: DurableObjectState,
		private env: Env,
	) {}

	async fetch(request: Request) {
		return new Response("Session object Ready");
	}
}

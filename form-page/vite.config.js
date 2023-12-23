import dynamicImport from "vite-plugin-dynamic-import";

export default {
	plugins: [
		dynamicImport({
			filter(id) {
				// `node_modules` is exclude by default, so we need to include it explicitly
				// https://github.com/vite-plugin/vite-plugin-dynamic-import/blob/v1.3.0/src/index.ts#L133-L135
				if (id.includes("/node_modules/i18n-iso-countries")) {
					return true;
				}
			},
		}),
	],
};

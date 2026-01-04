declare module 'papaparse' {
	export interface ParseResult<T> {
		data: T[];
		errors: any[];
		meta: {
			fields: string[];
			delimitedBy: string;
		};
	}

	export interface ParseConfig<T> {
		header?: boolean;
		dynamicTyping?: boolean;
		complete?: (results: ParseResult<T>) => void;
		error?: (error: any) => void;
		download?: boolean;
	}

	export function parse<T>(url: string, config: ParseConfig<T>): void;
}

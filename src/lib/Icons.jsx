export function Icon({ name, size = 18, ...props }) {
	const paths = {
		layers: (
			<>
				<path d="m12 3 9 5-9 5-9-5 9-5Z" />
				<path d="m3 12 9 5 9-5M3 16l9 5 9-5" />
			</>
		),
		search: (
			<>
				<circle cx="10.5" cy="10.5" r="6.5" />
				<path d="m16 16 4.5 4.5" />
			</>
		),
		plus: <path d="M12 5v14M5 12h14" />,
		minus: <path d="M5 12h14" />,
		extent: (
			<>
				<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5" />
				<path d="M8 8h8v8H8z" />
			</>
		),
		home: (
			<>
				<path d="m3 10 9-7 9 7M5 9v12h14V9" />
				<path d="M9 21v-8h6v8" />
			</>
		),
		download: (
			<>
				<path d="M12 3v12m-4-4 4 4 4-4M4 17v4h16v-4" />
			</>
		),
		check: <path d="m5 12 4 4 10-10" />,
		close: <path d="m6 6 12 12M6 18 18 6" />,
		chevron: <path d="m6 9 6 6 6-6" />,
		code: (
			<>
				<path d="m7 6-6 6 6 6m10-12 6 6-6 6m-3-15-4 18" />
			</>
		),
		arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
		cursor: <path d="m4 3 6 18 3-8 8-3L4 3Z" />,
		info: (
			<>
				<circle cx="12" cy="12" r="9" />
				<path d="M12 11v6m0-10v.1" />
			</>
		),
		globe: (
			<>
				<circle cx="12" cy="12" r="9" />
				<path d="M3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18Z" />
			</>
		)
	};
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.7"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
			{...props}
		>
			{paths[name]}
		</svg>
	);
}

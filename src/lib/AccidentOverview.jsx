import { formatAccidents } from './accidents.js';

export function AccidentOverview({
	data,
	summary,
	year,
	onYear,
	title,
	unavailable,
	error,
	onRetry,
	onState
}) {
	const max = Math.max(1, ...(summary?.trend.map((item) => item.value ?? 0) ?? []));
	return (
		<section className="accident-overview" aria-label="Road accident data">
			<div className="accident-heading">
				<div>
					<p className="accident-label">Reported road accidents</p>
					<h2>{title}</h2>
				</div>
			</div>
			{error ? (
				<div role="alert" className="accident-unavailable">
					Accident data could not load.{' '}
					<button className="text-button" onClick={onRetry}>
						Retry accident data
					</button>
				</div>
			) : !data ? (
				<p role="status" className="small muted">
					Loading accident data…
				</p>
			) : unavailable ? (
				<div className="accident-unavailable">
					<strong>{unavailable}</strong>
					<p>This dataset reports state and union territory totals only.</p>
					{onState && (
						<button className="text-button" onClick={onState}>
							View state totals
						</button>
					)}
				</div>
			) : (
				summary && (
					<div className="accident-content">
						<div className="accident-metrics">
							<strong className="accident-total">{formatAccidents(summary.total)}</strong>
							<span className="small muted">accidents in {year}</span>
							<div className="accident-secondary">
								{summary.change != null && (
									<span>
										<strong>
											{summary.change > 0 ? '+' : ''}
											{summary.change.toFixed(1)}%
										</strong>{' '}
										vs {year - 1}
									</span>
								)}
								{summary.share != null && (
									<span>
										<strong>{summary.share.toFixed(1)}%</strong> of India total
									</span>
								)}
								{summary.rank != null && (
									<span>
										<strong>#{summary.rank}</strong> by count
									</span>
								)}
							</div>
							{summary.note && <p className="accident-note">{summary.note}</p>}
						</div>
						<div className="accident-trend" role="group" aria-label="Annual accident totals">
							{summary.trend.map((item) => (
								<button
									key={item.year}
									className={`trend-year ${item.year === year ? 'current' : ''}`}
									onClick={() => onYear(item.year)}
									aria-label={`${item.year}: ${formatAccidents(item.value)} accidents`}
									aria-pressed={item.year === year}
								>
									<span className="trend-value">
										{item.value == null ? 'N/A' : formatAccidents(item.value)}
									</span>
									<span className="trend-track">
										<span
											className="trend-bar"
											style={{
												height: `${item.value == null ? 0 : Math.max(3, (item.value / max) * 100)}%`
											}}
										/>
									</span>
									<span>{item.year}</span>
								</button>
							))}
						</div>
					</div>
				)
			)}
			{data && (
				<p className="accident-source">
					<a href={data.source.url} target="_blank" rel="noreferrer">
						MoRTH / PIB
					</a>{' '}
					· 2018–2022 dataset · Counts, not population-adjusted risk
				</p>
			)}
		</section>
	);
}

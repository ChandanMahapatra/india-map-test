"""Normalize the bundled CSV; checked against PIB release 2042509, Annexure I."""
import csv
import io
import json
from pathlib import Path
root = Path(__file__).resolve().parents[1]
rows = list(csv.reader(io.StringIO((root / 'static/total_accidents.csv').read_text())))
years = list(range(2018, 2023))
aliases = {'A & N': 'Andaman and Nicobar Islands', 'J & K': 'Jammu and Kashmir', 'D & N Haveli': 'Dadra and Nagar Haveli and Daman and Diu'}
states = {f['properties']['name']: f['properties']['id'] for f in json.loads((root/'static/india-states.geojson').read_text())['features']}
records = []
daman = next(r for r in rows[2:] if r[1] == 'Daman & Diu')
for row in rows[2:]:
    name = row[1]
    if name == 'Daman & Diu': continue
    if name == 'Himachal Pradesh':
        assert row[2] == ''
        row.pop(2)
    values = {str(year): None if row[2+i] in ('NA', '') else int(row[2+i].replace(',', '').rstrip('*')) for i, year in enumerate(years)}
    if name == 'D & N Haveli':
        for i, year in enumerate(years[:2]): values[str(year)] += int(daman[2+i])
    display = aliases.get(name, name)
    records.append({'stateId': states[display], 'name': display, 'values': values})
expected = [470403,456959,372181,412432,461312]
assert [sum(r['values'][str(y)] or 0 for r in records) for y in years] == expected
assert len(records) == 36
payload = {'years': years, 'metric': 'Reported road accidents', 'geographicLevel': 'state',
 'source': {'name': 'Ministry of Road Transport & Highways / PIB', 'url': 'https://www.pib.gov.in/PressReleseDetailm.aspx?PRID=2042509', 'published': '7 August 2024', 'table': 'Annexure I, calendar years 2018–2022'},
 'totals': dict(zip(map(str, years), expected)), 'records': records,
 'notes': ['Jammu and Kashmir includes Ladakh for 2018–2020; separate Ladakh data are unavailable for those years.', 'Dadra and Nagar Haveli and Daman and Diu: pre-merger 2018–2019 rows are added; the Dadra and Nagar Haveli row already includes Daman and Diu for 2020–2022.', 'The bundled CSV has an extra blank field in the Himachal Pradesh row; corrected to match the government table. The stray Daman and Diu 2020–2021 cells are excluded because those totals are already included in the merged UT.']}
(root/'static/accidents.json').write_text(json.dumps(payload, indent=2)+'\n')
print('36 state/UT records; all five national totals match the government table.')

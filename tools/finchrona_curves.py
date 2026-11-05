"""Month-end Treasury curves for the FinChrona figure, from a FinChrona release.

    python tools/finchrona_curves.py <finchrona_treasury_rates.parquet>

Writes assets/data/finchrona-monthly.json: for every month, the last trading day's
nominal par yields (11 maturities) and real par yields (5), in basis points, plus how
many trading days that month the 10-year minus 2-year spread was negative. Missing
source values stay missing (null); nothing is filled. Needs pandas and pyarrow.
Get the Parquet from the FinChrona repository (data/processed/) or its Zenodo record.
"""
import json
import sys
from pathlib import Path

import pandas as pd

NOM = ['1M', '3M', '6M', '1Y', '2Y', '3Y', '5Y', '7Y', '10Y', '20Y', '30Y']
REAL = ['5Y', '7Y', '10Y', '20Y', '30Y']
OUT = Path(__file__).resolve().parent.parent / 'assets' / 'data' / 'finchrona-monthly.json'


def bp(v):
    return None if pd.isna(v) else int(round(v * 100))


def main(src):
    df = pd.read_parquet(src)
    n = df[df.curve_type == 'par_nominal'].pivot(index='observation_date', columns='maturity_label', values='value_pct').sort_index()
    r = df[df.curve_type == 'par_real'].pivot(index='observation_date', columns='maturity_label', values='value_pct').sort_index()
    month = n.index.to_period('M')
    last = n.groupby(month).apply(lambda g: g.index.max())
    spread = n['10Y'] - n['2Y']
    inv = (spread < 0).groupby(month).sum().astype(int)
    days = spread.notna().groupby(month).sum().astype(int)

    out = {'start': str(last.index[0]), 'end': str(last.index[-1]), 'nom': NOM, 'real': REAL,
           'day': [], 'n': [], 'r': [], 'inv': [], 'td': []}
    for per, d in last.items():
        out['day'].append(int(d.day))
        out['n'].append([bp(n.at[d, m]) if m in n.columns else None for m in NOM])
        out['r'].append([bp(r.at[d, m]) if m in r.columns else None for m in REAL] if d in r.index else None)
        out['inv'].append(int(inv.get(per, 0)))
        out['td'].append(int(days.get(per, 0)))

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(out, separators=(',', ':')), encoding='utf-8')
    print(f"{OUT.name}: {len(out['day'])} months, {out['start']} to {out['end']}, "
          f"{sum(out['inv'])} of {sum(out['td'])} days inverted")


if __name__ == '__main__':
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])

import React from 'react';
import { api } from '../api/client';
import UEFABracket from '../components/UEFABracket';

export default function Bracket() {
  const [bracketId, setBracketId] = React.useState('main');
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState('');

  const load = React.useCallback(() => {
    setLoading(true);
    api.getBracket(bracketId)
      .then(setData)
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false));
  }, [bracketId]);

  React.useEffect(() => { load(); }, [load]);

  return (
    <div className="bracket-page">
      <div className="page-head">
        <h1>Championship Bracket</h1>
        <div className="row">
          <label>
            Bracket ID:
            <input value={bracketId} onChange={e => setBracketId(e.target.value)} onBlur={load} />
          </label>
        </div>
      </div>

      {loading && <p>Loading bracket…</p>}
      {err && <p className="error">{err}</p>}
      {data && <UEFABracket rounds={data.rounds} accent="blue" />}
    </div>
  );
}
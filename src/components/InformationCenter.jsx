import React from 'react';

import { get, getDatabase, ref } from 'firebase/database';

import { useAuth } from '../AuthContext';
import app from '../firebaseConfig';
import OwnerSidebarLayout from './OwnerSidebarLayout';

const InformationCenter = () => {
  const { user, loading } = useAuth();

  const [items, setItems] = React.useState([]);
  const [error, setError] = React.useState('');
  const [fetching, setFetching] = React.useState(false);

  const [typeFilter, setTypeFilter] = React.useState('all');

  const load = React.useCallback(async () => {
    if (!user) return;
    setFetching(true);
    setError('');
    try {
      const db = getDatabase(app);
      const snap = await get(ref(db, 'announcements'));
      const val = snap.exists() ? snap.val() : {};

      const arr = Object.keys(val || {})
        .filter((id) => id !== '__meta')
        .map((id) => ({ id, ...val[id] }))
        .filter((a) => a?.isPublished === true)
        ;

      arr.sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
      setItems(arr);
    } catch (e) {
      setItems([]);
      setError('Could not load information. Please try again.');
    } finally {
      setFetching(false);
    }
  }, [user]);

  React.useEffect(() => {
    if (loading) return;
    if (!user) return;
    load();
  }, [loading, user, load]);

  const visible = React.useMemo(() => {
    if (typeFilter === 'all') return items;
    return items.filter((i) => String(i.type || '') === typeFilter);
  }, [items, typeFilter]);

  const fmtDate = (ts) => {
    if (!ts) return '—';
    try {
      return new Date(Number(ts)).toLocaleString();
    } catch {
      return '—';
    }
  };

  return (
    <OwnerSidebarLayout title="Information Center">
      {error ? (
        <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
      ) : null}

      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div className="text-sm text-muted-foreground">Announcements and health information.</div>
          <div className="flex items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">All</option>
              <option value="announcement">Announcements</option>
              <option value="health">Health</option>
            </select>
            <Button
              type="button"
              variant="outline"
              onClick={load}
              disabled={fetching}
            >
              {fetching ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </div>

        {fetching && !visible.length ? <div className="text-sm text-muted-foreground">Loading...</div> : null}

        {!fetching && !visible.length ? <div className="text-sm text-muted-foreground">No published items yet.</div> : null}

        <div className="space-y-3">
          {visible.map((it) => (
            <div key={it.id} className="rounded-md border border-border p-4">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold">{it.title || '—'}</div>
                  <div className="text-xs text-muted-foreground">{String(it.type || '').toUpperCase()} · {fmtDate(it.createdAt)}</div>
                </div>
              </div>

              {it.imageUrl ? (
                <div className="mt-3">
                  <img src={it.imageUrl} alt={it.title || 'announcement'} className="max-h-56 w-full object-cover rounded-md border border-border" />
                </div>
              ) : null}

              {it.content ? <div className="mt-3 text-sm whitespace-pre-wrap">{it.content}</div> : null}
            </div>
          ))}
        </div>
      </div>
    </OwnerSidebarLayout>
  );
};

export default InformationCenter;

import React from 'react';

import { getDatabase, get, ref } from 'firebase/database';

import AdminSidebarLayout from './AdminSidebarLayout';
import { Button } from './ui/Button';
import { auth } from '../auth';
import app from '../firebaseConfig';

const AdminAuditTrail = () => {
  const [auditRecords, setAuditRecords] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [actionFilter, setActionFilter] = React.useState('');
  const [roleFilter, setRoleFilter] = React.useState('');
  const [page, setPage] = React.useState(1);
  const pageSize = 10;

  const fetchAuditRecords = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated.');

      const db = getDatabase(app);
      const auditSnap = await get(ref(db, 'auditTrail'));

      const auditVal = auditSnap.exists() ? auditSnap.val() : {};

      const arr = [];
      Object.keys(auditVal || {}).forEach((recordId) => {
        const record = auditVal[recordId];
        arr.push({
          recordId,
          timestamp: record.timestamp || 0,
          userId: record.userId || '',
          userRole: record.userRole || '',
          actionType: record.actionType || '',
          targetRecordId: record.targetRecordId || '',
          targetRecordType: record.targetRecordType || '',
          beforeValues: record.beforeValues || null,
          afterValues: record.afterValues || null,
        });
      });

      arr.sort((a, b) => Number(b.timestamp || 0) - Number(a.timestamp || 0));
      setAuditRecords(arr);
    } catch (e) {
      setAuditRecords([]);
      setError(e?.message || 'Failed to load audit records.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchAuditRecords();
  }, [fetchAuditRecords]);

  const filteredRecords = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return auditRecords.filter((record) => {
      if (actionFilter && record.actionType !== actionFilter) return false;
      if (roleFilter && record.userRole !== roleFilter) return false;
      if (!q) return true;
      const userId = String(record.userId || '').toLowerCase();
      const targetRecordId = String(record.targetRecordId || '').toLowerCase();
      const targetRecordType = String(record.targetRecordType || '').toLowerCase();
      return userId.includes(q) || targetRecordId.includes(q) || targetRecordType.includes(q);
    });
  }, [auditRecords, search, actionFilter, roleFilter]);

  React.useEffect(() => {
    setPage(1);
  }, [search, actionFilter, roleFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const pageItems = filteredRecords.slice(start, start + pageSize);

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '—';
    const d = new Date(timestamp);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString();
  };

  const formatValues = (values) => {
    if (!values) return '—';
    try {
      return JSON.stringify(values, null, 2);
    } catch {
      return String(values);
    }
  };

  const actionTypes = React.useMemo(() => {
    const types = new Set();
    auditRecords.forEach((record) => {
      if (record.actionType) types.add(record.actionType);
    });
    return Array.from(types).sort();
  }, [auditRecords]);

  const roles = React.useMemo(() => {
    const roleSet = new Set();
    auditRecords.forEach((record) => {
      if (record.userRole) roleSet.add(record.userRole);
    });
    return Array.from(roleSet).sort();
  }, [auditRecords]);

  return (
    <AdminSidebarLayout title="Audit Trail">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h2 className="text-lg font-semibold">Audit Trail</h2>
          <div className="flex items-center gap-2">
            <Button onClick={fetchAuditRecords} disabled={loading}>
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex flex-col md:flex-row md:items-center gap-2">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1" htmlFor="search">Search</label>
              <input
                id="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by user ID, record ID, or record type"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="actionFilter">Action Type</label>
              <select
                id="actionFilter"
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">All</option>
                {actionTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="roleFilter">Role</label>
              <select
                id="roleFilter"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">All</option>
                {roles.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {error ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
        ) : null}

        <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b-2 border-slate-200">
                  <th className="py-3 px-4 text-left font-semibold border-r border-slate-200 whitespace-nowrap">Timestamp</th>
                  <th className="py-3 px-4 text-left font-semibold border-r border-slate-200 whitespace-nowrap">User ID</th>
                  <th className="py-3 px-4 text-left font-semibold border-r border-slate-200 whitespace-nowrap">Role</th>
                  <th className="py-3 px-4 text-left font-semibold border-r border-slate-200 whitespace-nowrap">Action Type</th>
                  <th className="py-3 px-4 text-left font-semibold border-r border-slate-200 whitespace-nowrap">Target Record ID</th>
                  <th className="py-3 px-4 text-left font-semibold border-r border-slate-200 whitespace-nowrap">Record Type</th>
                  <th className="py-3 px-4 text-left font-semibold border-r border-slate-200 whitespace-nowrap">Before Values</th>
                  <th className="py-3 px-4 text-left font-semibold whitespace-nowrap">After Values</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      Loading...
                    </td>
                  </tr>
                ) : pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      No audit records found.
                    </td>
                  </tr>
                ) : (
                  pageItems.map((record) => (
                    <tr key={record.recordId} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 border-r border-slate-300 whitespace-nowrap">{formatTimestamp(record.timestamp)}</td>
                      <td className="py-3 px-4 border-r border-slate-300">{record.userId || '—'}</td>
                      <td className="py-3 px-4 border-r border-slate-300">{record.userRole || '—'}</td>
                      <td className="py-3 px-4 border-r border-slate-300">{record.actionType || '—'}</td>
                      <td className="py-3 px-4 border-r border-slate-300">{record.targetRecordId || '—'}</td>
                      <td className="py-3 px-4 border-r border-slate-300">{record.targetRecordType || '—'}</td>
                      <td className="py-3 px-4 border-r border-slate-300 max-w-xs truncate" title={formatValues(record.beforeValues)}>{formatValues(record.beforeValues)}</td>
                      <td className="py-3 px-4 max-w-xs truncate" title={formatValues(record.afterValues)}>{formatValues(record.afterValues)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            Showing {filteredRecords.length === 0 ? 0 : start + 1} - {Math.min(start + pageSize, filteredRecords.length)} of{' '}
            {filteredRecords.length}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(1)} disabled={safePage === 1}>
              First
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1}>
              Prev
            </Button>
            <div className="text-sm">
              Page {safePage} / {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
            >
              Next
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage(totalPages)} disabled={safePage === totalPages}>
              Last
            </Button>
          </div>
        </div>
      </div>
    </AdminSidebarLayout>
  );
};

export default AdminAuditTrail;

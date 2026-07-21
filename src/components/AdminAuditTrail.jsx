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
  const [userNames, setUserNames] = React.useState({});

  const fetchAuditRecords = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Please log in to continue.');

      const db = getDatabase(app);
      const [auditSnap, ownersSnap] = await Promise.all([
        get(ref(db, 'auditTrail')),
        get(ref(db, 'owners')),
      ]);

      const auditVal = auditSnap.exists() ? auditSnap.val() : {};
      const ownersVal = ownersSnap.exists() ? ownersSnap.val() : {};

      // Create mapping of user IDs to full names
      const nameMap = {};
      Object.entries(ownersVal || {}).forEach(([ownerId, owner]) => {
        if (ownerId !== '__meta' && owner) {
          const fullName = `${owner.firstname || ''} ${owner.lastname || ''}`.trim() || 'Unknown';
          nameMap[ownerId] = fullName;
        }
      });
      setUserNames(nameMap);

      const arr = [];
      Object.keys(auditVal || {}).forEach((recordId) => {
        const record = auditVal[recordId];
        arr.push({
          recordId,
          timestamp: record.timestamp || 0,
          userId: record.performedBy || record.userId || '',
          userRole: record.userRole || '',
          actionType: record.action || record.actionType || '',
          targetRecordId: record.targetId || record.targetRecordId || '',
          targetRecordType: record.targetType || record.targetRecordType || '',
          beforeValues: record.beforeValues || null,
          afterValues: record.afterValues || null,
        });
      });

      arr.sort((a, b) => Number(b.timestamp || 0) - Number(a.timestamp || 0));
      setAuditRecords(arr);
    } catch (e) {
      setAuditRecords([]);
      setError('Could not load audit records. Please try again.');
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

  const formatValues = (values, compareValues = null) => {
    if (!values) return '—';
    try {
      if (compareValues) {
        // Show only the changed values
        const changed = {};
        Object.keys(values).forEach((key) => {
          if (values[key] !== compareValues[key]) {
            changed[key] = values[key];
          }
        });
        if (Object.keys(changed).length === 0) return 'No changes';
        return JSON.stringify(changed, null, 2);
      }
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
          <div className="flex flex-col md:flex-row md:items-center gap-2">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1" htmlFor="search">Search</label>
              <input
                id="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by user ID, record ID, or record type"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="actionFilter">Action Type</label>
              <select
                id="actionFilter"
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
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
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              >
                <option value="">All</option>
                {roles.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={fetchAuditRecords} disabled={loading}>
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
        </div>

        {error ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
        ) : null}

        <div className="w-full min-w-0 rounded-xl border border-slate-200 bg-white shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[700px]">
              <thead className="sticky top-0 z-10">
                <tr className="bg-gradient-to-r from-slate-800 to-slate-700">
                  <th className="py-3.5 px-4 text-left text-xs font-bold uppercase tracking-wider text-slate-100 whitespace-nowrap border-r border-slate-600">Timestamp</th>
                  <th className="py-3.5 px-4 text-left text-xs font-bold uppercase tracking-wider text-slate-100 whitespace-nowrap border-r border-slate-600">User ID</th>
                  <th className="py-3.5 px-4 text-left text-xs font-bold uppercase tracking-wider text-slate-100 whitespace-nowrap border-r border-slate-600">Role</th>
                  <th className="py-3.5 px-4 text-left text-xs font-bold uppercase tracking-wider text-slate-100 whitespace-nowrap border-r border-slate-600">Action Type</th>
                  <th className="py-3.5 px-4 text-left text-xs font-bold uppercase tracking-wider text-slate-100 whitespace-nowrap border-r border-slate-600 hidden lg:table-cell">Target Record ID</th>
                  <th className="py-3.5 px-4 text-left text-xs font-bold uppercase tracking-wider text-slate-100 whitespace-nowrap border-r border-slate-600 hidden lg:table-cell">Record Type</th>
                  <th className="py-3.5 px-4 text-left text-xs font-bold uppercase tracking-wider text-slate-100 whitespace-nowrap border-r border-slate-600 hidden xl:table-cell">Before Values</th>
                  <th className="py-3.5 px-4 text-left text-xs font-bold uppercase tracking-wider text-slate-100 whitespace-nowrap hidden xl:table-cell">After Values</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-emerald-600"></div>
                        <span className="text-sm">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-sm font-medium">No audit records found</span>
                        <span className="text-xs text-slate-300">Try adjusting your filters</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  pageItems.map((record, idx) => (
                    <tr key={record.recordId} className={`border-b border-slate-100 hover:bg-emerald-50/50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                      <td className="py-3 px-4 border-r border-slate-100 whitespace-nowrap font-mono text-xs text-slate-700">{formatTimestamp(record.timestamp)}</td>
                      <td className="py-3 px-4 border-r border-slate-100 text-slate-700">{userNames[record.userId] || record.userId || '—'}</td>
                      <td className="py-3 px-4 border-r border-slate-100">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${record.userRole === 'admin' ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-600'}`}>
                          {record.userRole || '—'}
                        </span>
                      </td>
                      <td className="py-3 px-4 border-r border-slate-100">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${record.actionType === 'create' ? 'bg-emerald-100 text-emerald-700' : record.actionType === 'update' ? 'bg-blue-100 text-blue-700' : record.actionType === 'delete' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                          {record.actionType || '—'}
                        </span>
                      </td>
                      <td className="py-3 px-4 border-r border-slate-100 font-mono text-xs text-slate-600 hidden lg:table-cell">{record.targetRecordId || '—'}</td>
                      <td className="py-3 px-4 border-r border-slate-100 text-slate-600 hidden lg:table-cell">{record.targetRecordType || '—'}</td>
                      <td className="py-3 px-4 border-r border-slate-100 max-w-xs truncate text-slate-500 text-xs hidden xl:table-cell" title={formatValues(record.beforeValues, record.afterValues)}>{formatValues(record.beforeValues, record.afterValues)}</td>
                      <td className="py-3 px-4 max-w-xs truncate text-slate-500 text-xs hidden xl:table-cell" title={formatValues(record.afterValues, record.beforeValues)}>{formatValues(record.afterValues, record.beforeValues)}</td>
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

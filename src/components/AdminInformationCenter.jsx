import React from 'react';

import { get, getDatabase, push, ref, remove, set, update } from 'firebase/database';

import AdminSidebarLayout from './AdminSidebarLayout';
import Modal from './Modal';
import { Button } from './ui/Button';
import ImageUpload from './ImageUpload';
import { useAuth } from '../AuthContext';
import app from '../firebaseConfig';

const AdminInformationCenter = () => {
  const { user } = useAuth();

  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  const [search, setSearch] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState('all');

  const [submitting, setSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState('');
  const [formMessage, setFormMessage] = React.useState('');

  const [addOpen, setAddOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [selected, setSelected] = React.useState(null);

  const [form, setForm] = React.useState({
    title: '',
    content: '',
    type: 'announcement',
    imageUrl: '',
    isPublished: false,
  });

  const load = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const db = getDatabase(app);
      const snap = await get(ref(db, 'announcements'));
      const val = snap.exists() ? snap.val() : {};
      const arr = Object.keys(val || {})
        .filter((id) => id !== '__meta')
        .map((id) => ({ id, ...val[id] }));
      arr.sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
      setItems(arr);
    } catch (e) {
      setItems([]);
      setError('Could not load announcements. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => {
    setForm({
      title: '',
      content: '',
      type: 'announcement',
      imageUrl: '',
      isPublished: false,
    });
    setFormError('');
    setFormMessage('');
  };

  const openAdd = () => {
    resetForm();
    setAddOpen(true);
  };

  const closeAdd = () => {
    setAddOpen(false);
  };

  const openEdit = (row) => {
    setSelected(row);
    setForm({
      title: row?.title || '',
      content: row?.content || '',
      type: row?.type || 'announcement',
      imageUrl: row?.imageUrl || '',
      isPublished: row?.isPublished === true,
    });
    setFormError('');
    setFormMessage('');
    setEditOpen(true);
  };

  const closeEdit = () => {
    setEditOpen(false);
    setSelected(null);
  };

  const validate = () => {
    if (!String(form.title || '').trim()) return 'Title is required.';
    if (!String(form.content || '').trim()) return 'Content is required.';
    const t = String(form.type || '').trim();
    if (t !== 'announcement' && t !== 'health') return 'Type is invalid.';
    return '';
  };

  const createItem = async () => {
    setFormError('');
    setFormMessage('');
    const msg = validate();
    if (msg) {
      setFormError(msg);
      return;
    }
    if (!user) {
      setFormError('Please log in to continue.');
      return;
    }

    setSubmitting(true);
    try {
      const db = getDatabase(app);
      const node = push(ref(db, 'announcements'));
      const id = node.key;
      await set(node, {
        id,
        title: String(form.title || '').trim(),
        content: String(form.content || '').trim(),
        type: String(form.type || 'announcement'),
        ...(String(form.imageUrl || '').trim() ? { imageUrl: String(form.imageUrl).trim() } : {}),
        isPublished: form.isPublished === true,
        createdBy: user.uid,
        createdAt: Date.now(),
      });
      setFormMessage('Saved.');
      await load();
      setAddOpen(false);
    } catch (e) {
      setFormError('Could not create announcement. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const saveEdit = async () => {
    if (!selected?.id) return;
    setFormError('');
    setFormMessage('');
    const msg = validate();
    if (msg) {
      setFormError(msg);
      return;
    }

    setSubmitting(true);
    try {
      const db = getDatabase(app);
      await update(ref(db, `announcements/${selected.id}`), {
        title: String(form.title || '').trim(),
        content: String(form.content || '').trim(),
        type: String(form.type || 'announcement'),
        imageUrl: String(form.imageUrl || '').trim(),
        isPublished: form.isPublished === true,
        updatedAt: Date.now(),
      });
      setFormMessage('Updated.');
      await load();
      setEditOpen(false);
      setSelected(null);
    } catch (e) {
      setFormError('Could not update announcement. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const togglePublish = async (row) => {
    if (!row?.id) return;
    setError('');
    try {
      const db = getDatabase(app);
      await update(ref(db, `announcements/${row.id}`), {
        isPublished: row.isPublished !== true,
        updatedAt: Date.now(),
      });
      await load();
    } catch (e) {
      setError('Could not update publish status. Please try again.');
    }
  };

  const doDelete = async (row) => {
    if (!row?.id) return;
    setError('');
    try {
      const db = getDatabase(app);
      await remove(ref(db, `announcements/${row.id}`));
      await load();
    } catch (e) {
      setError('Could not delete announcement. Please try again.');
    }
  };

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return items
      .filter((i) => {
        if (typeFilter === 'all') return true;
        return String(i.type || '') === typeFilter;
      })
      .filter((i) => {
        if (!q) return true;
        const title = String(i.title || '').toLowerCase();
        const content = String(i.content || '').toLowerCase();
        return title.includes(q) || content.includes(q);
      });
  }, [items, search, typeFilter]);

  const fmtDate = (ts) => {
    if (!ts) return '—';
    try {
      return new Date(Number(ts)).toLocaleString();
    } catch {
      return '—';
    }
  };

  return (
    <AdminSidebarLayout title="Information Center">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex flex-col md:flex-row md:items-center gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title/content..."
              className="w-full md:w-80 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full md:w-44 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            >
              <option value="all">All types</option>
              <option value="announcement">Announcement</option>
              <option value="health">Health</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={load} disabled={loading}>Refresh</Button>
            <Button type="button" variant="green" onClick={openAdd}>Add New</Button>
          </div>
        </div>

        {error ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
        ) : null}

        <div className="w-full min-w-0 rounded-xl border border-slate-800 bg-slate-900 shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border-collapse min-w-[420px]">
              <thead>
                <tr className="bg-gradient-to-r from-slate-800 to-slate-700">
                  <th className="py-3.5 px-4 text-left text-xs font-bold uppercase tracking-wider text-slate-100 whitespace-nowrap">Title</th>
                  <th className="py-3.5 px-4 text-left text-xs font-bold uppercase tracking-wider text-slate-100 whitespace-nowrap">Type</th>
                  <th className="py-3.5 px-4 text-left text-xs font-bold uppercase tracking-wider text-slate-100 whitespace-nowrap">Published</th>
                  <th className="py-3.5 px-4 text-left text-xs font-bold uppercase tracking-wider text-slate-100 whitespace-nowrap">Created</th>
                  <th className="py-3.5 px-4 text-left text-xs font-bold uppercase tracking-wider text-slate-100 whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="py-12 text-center text-slate-400" colSpan={5}>
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-emerald-600"></div>
                        <span className="text-sm">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : filtered.length ? (
                  filtered.map((row) => (
                    <tr key={row.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors even:bg-slate-900/50">
                      <td className="py-3 px-4 font-medium max-w-[200px] truncate text-slate-100" title={row.title}>{row.title || '—'}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${row.type === 'announcement' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                          {row.type || '—'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${row.isPublished ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                          {row.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="py-3 px-4">{fmtDate(row.createdAt)}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          <Button size="xs" variant="blue" type="button" onClick={() => openEdit(row)}>Edit</Button>
                          <Button size="xs" variant="outline" type="button" onClick={() => togglePublish(row)}>
                            {row.isPublished ? 'Unpublish' : 'Publish'}
                          </Button>
                          <Button size="xs" variant="destructive" type="button" onClick={() => doDelete(row)}>Delete</Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="py-12 text-center text-slate-400" colSpan={5}>
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-sm font-medium">No items found</span>
                        <span className="text-xs text-slate-300">Create new content to get started</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal
        open={addOpen}
        title="Create Content"
        onClose={closeAdd}
        maxWidthClassName="max-w-2xl"
      >
        <div className="max-h-[70vh] overflow-y-auto pr-2 pl-2">
          <div className="space-y-4">
            {formError ? (
              <div className="mb-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{formError}</div>
            ) : null}
            {formMessage ? (
              <div className="mb-3 rounded-md border border-border bg-muted px-3 py-2 text-sm">{formMessage}</div>
            ) : null}

            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="md:col-span-2">
                <label className="block text-xs text-slate-500 mb-1">Title</label>
                <input
                  name="title"
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Type</label>
                <select
                  name="type"
                  value={form.type}
                  onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                >
                  <option value="announcement">announcement</option>
                  <option value="health">health</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <ImageUpload
                  value={form.imageUrl}
                  onChange={({ url }) => setForm((p) => ({ ...p, imageUrl: url }))}
                  folder="announcements"
                  label="Image"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-slate-500 mb-1">Content</label>
                <textarea
                  name="content"
                  rows={4}
                  value={form.content}
                  onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                />
              </div>
              <div className="md:col-span-2 flex items-center gap-2">
                <input
                  name="isPublished"
                  type="checkbox"
                  checked={form.isPublished === true}
                  onChange={(e) => setForm((p) => ({ ...p, isPublished: e.target.checked }))}
                  className="rounded border-gray-300 text-green-600 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                />
                <label className="text-sm">Published</label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <Button
                variant="outline"
                onClick={closeAdd}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                variant="green"
                onClick={createItem}
                disabled={submitting}
              >
                {submitting ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={editOpen}
        title="Edit Content"
        onClose={closeEdit}
        maxWidthClassName="max-w-2xl"
      >
        <div className="max-h-[70vh] overflow-y-auto pr-2 pl-2">
          <div className="space-y-4">
            {formError ? (
              <div className="mb-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{formError}</div>
            ) : null}
            {formMessage ? (
              <div className="mb-3 rounded-md border border-border bg-muted px-3 py-2 text-sm">{formMessage}</div>
            ) : null}

            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="md:col-span-2">
                <label className="block text-xs text-slate-500 mb-1">Title</label>
                <input
                  name="title"
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Type</label>
                <select
                  name="type"
                  value={form.type}
                  onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                >
                  <option value="announcement">announcement</option>
                  <option value="health">health</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <ImageUpload
                  value={form.imageUrl}
                  onChange={({ url }) => setForm((p) => ({ ...p, imageUrl: url }))}
                  folder="announcements"
                  label="Image"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-slate-500 mb-1">Content</label>
                <textarea
                  name="content"
                  rows={4}
                  value={form.content}
                  onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                />
              </div>
              <div className="md:col-span-2 flex items-center gap-2">
                <input
                  name="isPublished"
                  type="checkbox"
                  checked={form.isPublished === true}
                  onChange={(e) => setForm((p) => ({ ...p, isPublished: e.target.checked }))}
                  className="rounded border-gray-300 text-green-600 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                />
                <label className="text-sm">Published</label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <Button
                variant="outline"
                onClick={closeEdit}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                variant="green"
                onClick={saveEdit}
                disabled={submitting}
              >
                {submitting ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </AdminSidebarLayout>
  );
};

export default AdminInformationCenter;

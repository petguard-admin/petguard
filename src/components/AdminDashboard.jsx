import React from 'react';

import { getDatabase, get, ref } from 'firebase/database';

import app from '../firebaseConfig';
import AdminSidebarLayout from './AdminSidebarLayout';
import { useAuth } from '../AuthContext';
import { Button } from './ui/Button';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, PawPrint, ShieldCheck, ShieldAlert, TrendingUp, BarChart3, Activity, MapPin } from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [totalUsers, setTotalUsers] = React.useState(0);
  const [totalPets, setTotalPets] = React.useState(0);
  const [vaccinatedPets, setVaccinatedPets] = React.useState(0);
  const [unvaccinatedPets, setUnvaccinatedPets] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [usersPerMonth, setUsersPerMonth] = React.useState([]);
  const [dogsAndCats, setDogsAndCats] = React.useState([]);
  const [petsByBarangay, setPetsByBarangay] = React.useState([]);

  React.useEffect(() => {
    const loadStats = async () => {
      if (!user) return;
      try {
        const db = getDatabase(app);
        const [ownersSnap, petsSnap, medicalRecordsSnap] = await Promise.all([
          get(ref(db, 'owners')),
          get(ref(db, 'petsByOwner')),
          get(ref(db, 'medicalRecordsByPet')),
        ]);

        const ownersVal = ownersSnap.exists() ? ownersSnap.val() : {};
        const totalUsers = Object.keys(ownersVal || {}).filter((k) => k !== '__meta').length;

        const petsVal = petsSnap.exists() ? petsSnap.val() : {};
        let totalPets = 0;
        const allPetIds = [];
        Object.values(petsVal || {}).forEach((ownerPets) => {
          if (!ownerPets) return;
          Object.values(ownerPets).forEach((pet) => {
            if (pet && typeof pet === 'object') {
              totalPets += 1;
              allPetIds.push(pet.id);
            }
          });
        });

        const medicalRecordsVal = medicalRecordsSnap.exists() ? medicalRecordsSnap.val() : {};
        const vaccinatedPetIds = new Set();
        Object.values(medicalRecordsVal || {}).forEach((petRecords) => {
          if (!petRecords) return;
          Object.values(petRecords).forEach((record) => {
            if (record && typeof record === 'object' && record.recordType === 'vaccination') {
              const vaccineType = record.vaccineType?.toLowerCase() || '';
              if (vaccineType.includes('anti-rabies') || vaccineType.includes('anti rabies')) {
                vaccinatedPetIds.add(record.petId);
              }
            }
          });
        });

        // Calculate users per month
        const usersByMonth = {};
        Object.entries(ownersVal || {}).forEach(([key, owner]) => {
          if (key === '__meta' || !owner) return;
          const createdAt = owner.createdAt;
          if (createdAt) {
            const date = new Date(createdAt);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            usersByMonth[monthKey] = (usersByMonth[monthKey] || 0) + 1;
          }
        });
        const sortedMonths = Object.keys(usersByMonth).sort();
        const usersPerMonthData = sortedMonths.map(month => ({
          month,
          users: usersByMonth[month]
        }));

        // Calculate dogs and cats
        let dogsCount = 0;
        let catsCount = 0;
        Object.values(petsVal || {}).forEach((ownerPets) => {
          if (!ownerPets) return;
          Object.values(ownerPets).forEach((pet) => {
            if (pet && typeof pet === 'object') {
              const species = (pet.species || '').toLowerCase();
              if (species.includes('dog')) {
                dogsCount += 1;
              } else if (species.includes('cat')) {
                catsCount += 1;
              }
            }
          });
        });
        const dogsAndCatsData = [
          { name: 'Dogs', count: dogsCount },
          { name: 'Cats', count: catsCount }
        ];

        // Calculate pets by barangay (based on owner's barangay)
        const barangayCounts = {};
        Object.entries(petsVal || {}).forEach(([ownerId, ownerPets]) => {
          if (!ownerPets) return;
          const owner = ownersVal[ownerId];
          const ownerBarangay = owner?.barangay;
          if (!ownerBarangay) return;
          
          Object.values(ownerPets).forEach((pet) => {
            if (pet && typeof pet === 'object') {
              barangayCounts[ownerBarangay] = (barangayCounts[ownerBarangay] || 0) + 1;
            }
          });
        });
        const petsByBarangayData = Object.entries(barangayCounts).map(([barangay, count]) => ({
          barangay,
          count
        })).sort((a, b) => b.count - a.count);

        setTotalUsers(totalUsers);
        setTotalPets(totalPets);
        setVaccinatedPets(vaccinatedPetIds.size);
        setUnvaccinatedPets(totalPets - vaccinatedPetIds.size);
        setUsersPerMonth(usersPerMonthData);
        setDogsAndCats(dogsAndCatsData);
        setPetsByBarangay(petsByBarangayData);
        setLoading(false);
      } catch (e) {
        setError('Could not load dashboard data. Please try again.');
        setLoading(false);
      }
    };

    loadStats();
  }, [user]);

  return (
    <AdminSidebarLayout title="Dashboard">
      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          {error}
        </div>
      ) : null}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="group relative rounded-xl border border-slate-200 bg-white p-5 shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-1 bg-emerald-500 rounded-l-xl"></div>
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-500 truncate">Total Users</p>
              <p className="mt-2 text-3xl font-bold text-slate-900 tabular-nums">{loading ? '—' : totalUsers.toLocaleString()}</p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-3 shrink-0 group-hover:bg-emerald-100 transition-colors">
              <Users className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="group relative rounded-xl border border-slate-200 bg-white p-5 shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-1 bg-blue-500 rounded-l-xl"></div>
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-500 truncate">Total Pets</p>
              <p className="mt-2 text-3xl font-bold text-slate-900 tabular-nums">{loading ? '—' : totalPets.toLocaleString()}</p>
            </div>
            <div className="rounded-xl bg-blue-50 p-3 shrink-0 group-hover:bg-blue-100 transition-colors">
              <PawPrint className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="group relative rounded-xl border border-slate-200 bg-white p-5 shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-1 bg-violet-500 rounded-l-xl"></div>
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-500 truncate">Vaccinated (Anti-rabies)</p>
              <p className="mt-2 text-3xl font-bold text-slate-900 tabular-nums">{loading ? '—' : vaccinatedPets.toLocaleString()}</p>
            </div>
            <div className="rounded-xl bg-violet-50 p-3 shrink-0 group-hover:bg-violet-100 transition-colors">
              <ShieldCheck className="h-6 w-6 text-violet-600" />
            </div>
          </div>
        </div>

        <div className="group relative rounded-xl border border-slate-200 bg-white p-5 shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-1 bg-amber-500 rounded-l-xl"></div>
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-500 truncate">Unvaccinated (Anti-rabies)</p>
              <p className="mt-2 text-3xl font-bold text-slate-900 tabular-nums">{loading ? '—' : unvaccinatedPets.toLocaleString()}</p>
            </div>
            <div className="rounded-xl bg-amber-50 p-3 shrink-0 group-hover:bg-amber-100 transition-colors">
              <ShieldAlert className="h-6 w-6 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-6">
        <div className="rounded-xl border border-slate-200 bg-white shadow-md overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2.5">
            <div className="rounded-lg bg-emerald-50 p-2">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">Users Per Month</h3>
          </div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={usersPerMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '13px' }} />
                <Legend wrapperStyle={{ paddingTop: '16px', fontSize: '12px' }} />
                <Line type="monotone" dataKey="users" stroke="#10b981" strokeWidth={2.5} dot={{ fill: '#10b981', strokeWidth: 0, r: 4 }} activeDot={{ r: 6, strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-md overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2.5">
            <div className="rounded-lg bg-blue-50 p-2">
              <BarChart3 className="h-4 w-4 text-blue-600" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">Dogs vs Cats</h3>
          </div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dogsAndCats} barSize={48}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '13px' }} cursor={{ fill: 'rgba(16, 185, 129, 0.06)' }} />
                <Legend wrapperStyle={{ paddingTop: '16px', fontSize: '12px' }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-md overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2.5">
            <div className="rounded-lg bg-violet-50 p-2">
              <Activity className="h-4 w-4 text-violet-600" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">Vaccinated vs Unvaccinated (Anti-rabies)</h3>
          </div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[
                { name: 'Vaccinated', count: vaccinatedPets },
                { name: 'Unvaccinated', count: unvaccinatedPets }
              ]} barSize={56}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '13px' }} cursor={{ fill: 'rgba(139, 92, 246, 0.06)' }} />
                <Legend wrapperStyle={{ paddingTop: '16px', fontSize: '12px' }} />
                <Bar dataKey="count" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-md overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2.5">
            <div className="rounded-lg bg-blue-50 p-2">
              <MapPin className="h-4 w-4 text-blue-600" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">Pets by Barangay</h3>
          </div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={petsByBarangay} barSize={36}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="barangay" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} interval={0} angle={-30} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '13px' }} cursor={{ fill: 'rgba(59, 130, 246, 0.06)' }} />
                <Legend wrapperStyle={{ paddingTop: '16px', fontSize: '12px' }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </AdminSidebarLayout>
  );
};

export default AdminDashboard;

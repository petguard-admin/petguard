import React from 'react';

import { getDatabase, get, ref } from 'firebase/database';

import app from '../firebaseConfig';
import AdminSidebarLayout from './AdminSidebarLayout';
import { useAuth } from '../AuthContext';
import { Button } from './ui/Button';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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
        <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="text-sm text-muted-foreground">Total Users</div>
          <div className="mt-2 text-3xl font-bold">{loading ? '—' : totalUsers}</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="text-sm text-muted-foreground">Total Pets</div>
          <div className="mt-2 text-3xl font-bold">{loading ? '—' : totalPets}</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="text-sm text-muted-foreground">Vaccinated (Anti-rabies)</div>
          <div className="mt-2 text-3xl font-bold">{loading ? '—' : vaccinatedPets}</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="text-sm text-muted-foreground">Unvaccinated (Anti-rabies)</div>
          <div className="mt-2 text-3xl font-bold">{loading ? '—' : unvaccinatedPets}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Users Per Month</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={usersPerMonth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="users" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Dogs vs Cats</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dogsAndCats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Vaccinated vs Unvaccinated (Anti-rabies)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[
              { name: 'Vaccinated', count: vaccinatedPets },
              { name: 'Unvaccinated', count: unvaccinatedPets }
            ]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Pets by Barangay</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={petsByBarangay}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="barangay" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </AdminSidebarLayout>
  );
};

export default AdminDashboard;

import React from 'react';

import { getDatabase, get, ref } from 'firebase/database';

import AdminSidebarLayout from './AdminSidebarLayout';
import { Button } from './ui/Button';
import { auth } from '../auth';
import app from '../firebaseConfig';
import { logAuditTrail } from '../utils/auditLogger';

const AdminReports = () => {
  const [vaccinationRecords, setVaccinationRecords] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [exporting, setExporting] = React.useState(false);
  const [selectedYear, setSelectedYear] = React.useState(new Date().getFullYear().toString());
  const [page, setPage] = React.useState(1);
  const pageSize = 10;

  const calcAge = React.useCallback((dateOfBirth) => {
    if (!dateOfBirth) return '—';
    const d = new Date(dateOfBirth);
    if (Number.isNaN(d.getTime())) return '—';
    const now = new Date();
    let years = now.getFullYear() - d.getFullYear();
    const m = now.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) years -= 1;
    if (years < 0) years = 0;
    if (years === 0) {
      const months = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
      if (months < 1) return '< 1 mo.';
      return `${months} mo.`;
    }
    return `${years} yr.`;
  }, []);

  const fetchVaccinationRecords = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Please log in to continue.');

      const db = getDatabase(app);
      const [ownersSnap, petsSnap, medicalSnap] = await Promise.all([
        get(ref(db, 'owners')),
        get(ref(db, 'petsByOwner')),
        get(ref(db, 'medicalRecordsByPet')),
      ]);

      const ownersVal = ownersSnap.exists() ? ownersSnap.val() : {};
      const petsVal = petsSnap.exists() ? petsSnap.val() : {};
      const medicalVal = medicalSnap.exists() ? medicalSnap.val() : {};

      const ownersById = {};
      Object.keys(ownersVal || {})
        .filter((k) => k !== '__meta')
        .forEach((ownerId) => {
          ownersById[ownerId] = ownersVal[ownerId];
        });

      const arr = [];
      Object.keys(medicalVal || {}).forEach((petId) => {
        const petRecords = medicalVal[petId] || {};
        const petInfo = {};
        Object.keys(petsVal || {}).forEach((ownerId) => {
          const ownerPets = petsVal[ownerId] || {};
          if (ownerPets[petId]) {
            petInfo.petName = ownerPets[petId].petName || '';
            petInfo.species = ownerPets[petId].species || '';
            petInfo.sex = ownerPets[petId].sex || '';
            petInfo.dateOfBirth = ownerPets[petId].dateOfBirth || '';
            petInfo.age = calcAge(ownerPets[petId].dateOfBirth);
            petInfo.ownerId = ownerId;
            petInfo.ownerData = ownersById[ownerId] || {};
          }
        });

        Object.keys(petRecords || {}).forEach((recordId) => {
          const record = petRecords[recordId];
          if (record.recordType === 'vaccination') {
            arr.push({
              recordId,
              petId,
              petName: petInfo.petName || '',
              species: petInfo.species || '',
              sex: petInfo.sex || '',
              age: petInfo.age,
              ownerId: petInfo.ownerId || '',
              ownerData: petInfo.ownerData,
              date: record.date || '',
              vaccineType: record.vaccineType || '',
              vaccineSource: record.vaccineSource || '',
              vaccineStock: record.vaccineStock || '',
              vaccinatedBy: record.vaccinatedBy || '',
              reason: record.reason || '',
              hasDisease: record.hasDisease || false,
              disease: record.disease || '',
              notes: record.notes || '',
              createdAt: record.createdAt || 0,
            });
          }
        });
      });

      arr.sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
      setVaccinationRecords(arr);
    } catch (e) {
      setVaccinationRecords([]);
      setError('Could not load vaccination records. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [calcAge]);

  React.useEffect(() => {
    fetchVaccinationRecords();
  }, [fetchVaccinationRecords]);

  const displayRecords = React.useMemo(() => {
    return vaccinationRecords.map((record) => {
      const owner = record.ownerData;
      return {
        reason: record.reason,
        date: record.date,
        barangay: owner?.barangay || '',
        firstName: owner?.firstname || '',
        lastName: owner?.lastname || '',
        gender: owner?.gender || '',
        birthday: owner?.birthday || null,
        contactNo: owner?.phoneNumber || owner?.phone || '',
        species: record.species,
        sex: record.sex,
        age: record.age,
        disease: record.disease,
        vaccineType: record.vaccineType,
        batchLotNo: record.vaccineStock,
        vaccineSource: record.vaccineSource,
        remarks: record.notes,
      };
    });
  }, [vaccinationRecords]);

  React.useEffect(() => {
    setPage(1);
  }, [selectedYear]);

  const totalPages = Math.max(1, Math.ceil(displayRecords.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const pageItems = displayRecords.slice(start, start + pageSize);

  const availableYears = React.useMemo(() => {
    const years = new Set();
    vaccinationRecords.forEach((record) => {
      if (record.date) {
        const d = new Date(record.date);
        if (!Number.isNaN(d.getTime())) {
          years.add(d.getFullYear().toString());
        }
      }
    });
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [vaccinationRecords]);

  const exportToExcel = React.useCallback(async () => {
    setExporting(true);
    try {
      const filteredRecords = displayRecords.filter((record) => {
        if (!record.date || !selectedYear) return false;
        const d = new Date(record.date);
        if (Number.isNaN(d.getTime())) return false;
        return d.getFullYear().toString() === selectedYear;
      });

      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const groupedByMonth = {};
      filteredRecords.forEach((record) => {
        if (!record.date) return;
        const d = new Date(record.date);
        if (Number.isNaN(d.getTime())) return;
        const month = d.getMonth();
        if (!groupedByMonth[month]) {
          groupedByMonth[month] = [];
        }
        groupedByMonth[month].push(record);
      });

      const headers = [
        'Reason',
        'Date',
        'Barangay',
        'First Name',
        'Last Name',
        'Gender',
        'Birthday',
        'Contact No.',
        'Species',
        'Sex',
        'Age',
        'Disease',
        'Vaccine Type',
        'Batch/Lot No.',
        'Vaccine Source',
        'Remarks',
      ];

      let csvContent = '';
      Object.keys(groupedByMonth).sort((a, b) => Number(a) - Number(b)).forEach((month) => {
        const monthName = monthNames[month];
        csvContent += `\n\n${monthName} ${selectedYear}\n`;
        csvContent += headers.join(',') + '\n';
        groupedByMonth[month].forEach((record) => {
          const row = [
            record.reason === 'Routine' ? 'R' : record.reason === 'Mass' ? 'M' : record.reason === 'Outbreak' ? 'O' : record.reason || '—',
            record.date || '—',
            record.barangay || '—',
            record.firstName || '—',
            record.lastName || '—',
            record.gender || '—',
            record.birthday || '—',
            record.contactNo || '—',
            record.species || '—',
            record.sex || '—',
            record.age || '—',
            record.disease || '—',
            record.vaccineType || '—',
            record.batchLotNo || '—',
            record.vaccineSource || '—',
            record.remarks || '—',
          ];
          csvContent += row.map((cell) => `"${cell}"`).join(',') + '\n';
        });
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `vaccination_report_${selectedYear}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      await logAuditTrail('export', selectedYear, 'vaccination_report', null, { year: selectedYear, recordCount: filteredRecords.length });
    } catch (e) {
      setError('Could not export data. Please try again.');
    } finally {
      setExporting(false);
    }
  }, [displayRecords, selectedYear]);

  return (
    <AdminSidebarLayout title="Reports">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h2 className="text-lg font-semibold">Vaccination Report</h2>
          <div className="flex items-center gap-2">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <Button variant="green" onClick={exportToExcel} disabled={exporting || loading || displayRecords.length === 0}>
              {exporting ? 'Exporting...' : 'Save as Excel'}
            </Button>
            <Button variant="outline" onClick={fetchVaccinationRecords} disabled={loading}>
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
        </div>

        {error ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
        ) : null}

        <div className="w-full min-w-0 rounded-xl border border-slate-200 bg-white shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[1000px]">
              <thead className="sticky top-0 z-10">
                <tr className="bg-gradient-to-r from-slate-800 to-slate-700">
                  <th className="py-3.5 px-4 text-left text-xs font-bold uppercase tracking-wider text-slate-100 whitespace-nowrap border-r border-slate-600" rowSpan={2}>Reason</th>
                  <th className="py-3.5 px-4 text-left text-xs font-bold uppercase tracking-wider text-slate-100 whitespace-nowrap border-r border-slate-600" rowSpan={2}>Date</th>
                  <th className="py-3.5 px-4 text-left text-xs font-bold uppercase tracking-wider text-slate-100 whitespace-nowrap border-r border-slate-600" rowSpan={2}>Barangay</th>
                  <th className="py-3.5 px-4 text-center text-xs font-bold uppercase tracking-wider text-white whitespace-nowrap border-r border-slate-600 bg-slate-600/50 hidden xl:table-cell" colSpan={5}>Client Information</th>
                  <th className="py-3.5 px-4 text-center text-xs font-bold uppercase tracking-wider text-white whitespace-nowrap border-r border-slate-600 bg-slate-600/50 hidden lg:table-cell" colSpan={3}>Animal Information</th>
                  <th className="py-3.5 px-4 text-center text-xs font-bold uppercase tracking-wider text-white whitespace-nowrap border-r border-slate-600 bg-slate-600/50" colSpan={4}>Vaccine Information</th>
                  <th className="py-3.5 px-4 text-center text-xs font-bold uppercase tracking-wider text-slate-100 whitespace-nowrap hidden lg:table-cell" rowSpan={2}>Remarks</th>
                </tr>
                <tr className="bg-gradient-to-r from-slate-800 to-slate-700">
                  <th className="py-3 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-200 whitespace-nowrap border-r border-slate-600">First Name</th>
                  <th className="py-3 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-200 whitespace-nowrap border-r border-slate-600">Last Name</th>
                  <th className="py-3 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-200 whitespace-nowrap border-r border-slate-600 hidden xl:table-cell">Gender</th>
                  <th className="py-3 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-200 whitespace-nowrap border-r border-slate-600 hidden xl:table-cell">Birthday</th>
                  <th className="py-3 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-200 whitespace-nowrap border-r border-slate-600 hidden lg:table-cell">Contact No.</th>
                  <th className="py-3 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-200 whitespace-nowrap border-r border-slate-600">Species</th>
                  <th className="py-3 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-200 whitespace-nowrap border-r border-slate-600 hidden md:table-cell">Sex</th>
                  <th className="py-3 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-200 whitespace-nowrap border-r border-slate-600 hidden md:table-cell">Age</th>
                  <th className="py-3 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-200 whitespace-nowrap border-r border-slate-600 hidden xl:table-cell">Disease</th>
                  <th className="py-3 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-200 whitespace-nowrap border-r border-slate-600">Vaccine Type</th>
                  <th className="py-3 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-200 whitespace-nowrap border-r border-slate-600 hidden xl:table-cell">Batch/Lot No.</th>
                  <th className="py-3 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-200 whitespace-nowrap border-r border-slate-600 hidden lg:table-cell">Vaccine Source</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={16} className="py-10 text-center text-slate-400 text-sm">
                      <div className="flex flex-col items-center gap-2">
                        <svg className="animate-spin h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                        <span>Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={16} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-1">
                        <svg className="h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        <span className="text-sm font-medium">No vaccination records found.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  pageItems.map((record, index) => (
                    <tr key={index} className={`border-b border-slate-100 hover:bg-emerald-50/50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                      <td className="py-3 px-4 border-r border-slate-200/80 text-slate-700 font-medium">{record.reason === 'Routine' ? 'R' : record.reason === 'Mass' ? 'M' : record.reason === 'Outbreak' ? 'O' : record.reason || '—'}</td>
                      <td className="py-3 px-4 border-r border-slate-200/80 text-slate-600">{record.date || '—'}</td>
                      <td className="py-3 px-4 border-r border-slate-200/80 text-slate-600">{record.barangay || '—'}</td>
                      <td className="py-3 px-4 border-r border-slate-200/80 text-slate-600">{record.firstName || '—'}</td>
                      <td className="py-3 px-4 border-r border-slate-200/80 text-slate-600">{record.lastName || '—'}</td>
                      <td className="py-3 px-4 border-r border-slate-200/80 text-slate-600 hidden xl:table-cell">{record.gender || '—'}</td>
                      <td className="py-3 px-4 border-r border-slate-200/80 text-slate-600 hidden xl:table-cell">{record.birthday || '—'}</td>
                      <td className="py-3 px-4 border-r border-slate-200/80 text-slate-600 hidden lg:table-cell">{record.contactNo || '—'}</td>
                      <td className="py-3 px-4 border-r border-slate-200/80 text-slate-600">{record.species || '—'}</td>
                      <td className="py-3 px-4 border-r border-slate-200/80 text-slate-600 hidden md:table-cell">{record.sex || '—'}</td>
                      <td className="py-3 px-4 border-r border-slate-200/80 text-slate-600 hidden md:table-cell">{record.age || '—'}</td>
                      <td className="py-3 px-4 border-r border-slate-200/80 text-slate-600 hidden xl:table-cell">{record.disease || '—'}</td>
                      <td className="py-3 px-4 border-r border-slate-200/80 text-slate-600">{record.vaccineType || '—'}</td>
                      <td className="py-3 px-4 border-r border-slate-200/80 text-slate-600 hidden xl:table-cell">{record.batchLotNo || '—'}</td>
                      <td className="py-3 px-4 border-r border-slate-200/80 text-slate-600 hidden lg:table-cell">{record.vaccineSource || '—'}</td>
                      <td className="py-3 px-4 text-slate-600 hidden lg:table-cell">{record.remarks || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            Showing {displayRecords.length === 0 ? 0 : start + 1} - {Math.min(start + pageSize, displayRecords.length)} of{' '}
            {displayRecords.length}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="xs" onClick={() => setPage(1)} disabled={safePage === 1}>
              First
            </Button>
            <Button variant="outline" size="xs" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1}>
              Prev
            </Button>
            <div className="text-sm">
              Page {safePage} / {totalPages}
            </div>
            <Button
              variant="outline"
              size="xs"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
            >
              Next
            </Button>
            <Button variant="outline" size="xs" onClick={() => setPage(totalPages)} disabled={safePage === totalPages}>
              Last
            </Button>
          </div>
        </div>
      </div>
    </AdminSidebarLayout>
  );
};

export default AdminReports;

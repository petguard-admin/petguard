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

  const groupedRecords = React.useMemo(() => {
    const grouped = {};
    vaccinationRecords.forEach((record) => {
      const ownerId = record.ownerId || record.ownerData?.ownerId;
      const date = record.date;
      let monthYear = '';
      if (date) {
        const d = new Date(date);
        if (!Number.isNaN(d.getTime())) {
          monthYear = `${d.getFullYear()}-${d.getMonth()}`;
        }
      }
      const key = `${ownerId}_${monthYear}`;

      if (!grouped[key]) {
        grouped[key] = {
          ownerId,
          ownerData: record.ownerData,
          monthYear,
          pets: [],
          dates: [],
          vaccineTypes: [],
          vaccineStocks: [],
          vaccineSources: [],
          diseases: [],
          reasons: [],
          notes: [],
        };
      }
      grouped[key].pets.push({
        species: record.species,
        sex: record.sex,
        age: record.age,
      });
      if (record.date && !grouped[key].dates.includes(record.date)) {
        grouped[key].dates.push(record.date);
      }
      if (record.vaccineType && !grouped[key].vaccineTypes.includes(record.vaccineType)) {
        grouped[key].vaccineTypes.push(record.vaccineType);
      }
      if (record.vaccineStock && !grouped[key].vaccineStocks.includes(record.vaccineStock)) {
        grouped[key].vaccineStocks.push(record.vaccineStock);
      }
      if (record.vaccineSource && !grouped[key].vaccineSources.includes(record.vaccineSource)) {
        grouped[key].vaccineSources.push(record.vaccineSource);
      }
      if (record.disease && !grouped[key].diseases.includes(record.disease)) {
        grouped[key].diseases.push(record.disease);
      }
      if (record.reason && !grouped[key].reasons.includes(record.reason)) {
        grouped[key].reasons.push(record.reason);
      }
      if (record.notes && !grouped[key].notes.includes(record.notes)) {
        grouped[key].notes.push(record.notes);
      }
    });

    return Object.values(grouped).map((group) => {
      const species = new Set(group.pets.map((p) => p.species).filter(Boolean));
      const speciesList = Array.from(species);
      const speciesDisplay = speciesList.length > 0 ? speciesList.join(', ') : '—';

      const sexList = group.pets.map((p) => p.sex).filter(Boolean);
      const sexDisplay = sexList.length > 0 ? sexList.join('; ') : '—';

      const ageList = group.pets.map((p) => p.age).filter(Boolean);
      const ageDisplay = ageList.length > 0 ? ageList.join(', ') : '—';

      const animalRegistered = 'Yes';
      const noOfHeads = group.pets.length;

      const owner = group.ownerData;
      const firstName = owner?.firstname || '';
      const lastName = owner?.lastname || '';
      const gender = owner?.gender || '';
      const birthday = owner?.birthday || null;
      const contactNo = owner?.phoneNumber || owner?.phone || '';
      const barangay = owner?.barangay || '';

      const dateDisplay = group.dates.length > 0 ? group.dates[0] : '—';
      const reasonDisplay = group.reasons.length > 0 ? group.reasons.join(', ') : '—';
      const vaccineTypeDisplay = group.vaccineTypes.length > 0 ? group.vaccineTypes.join(', ') : '—';
      const vaccineSourceDisplay = group.vaccineSources.length > 0 ? group.vaccineSources.join(', ') : '—';
      const diseaseDisplay = group.diseases.length > 0 ? group.diseases.join(', ') : '—';
      const remarksDisplay = group.notes.length > 0 ? group.notes.join(', ') : '—';

      return {
        reason: reasonDisplay,
        date: dateDisplay,
        barangay,
        firstName,
        lastName,
        gender,
        birthday,
        contactNo,
        species: speciesDisplay,
        sex: sexDisplay,
        age: ageDisplay,
        animalRegistered,
        noOfHeads,
        disease: diseaseDisplay,
        vaccineType: vaccineTypeDisplay,
        batchLotNo: group.vaccineStocks.length > 0 ? group.vaccineStocks.join(', ') : '',
        vaccineSource: vaccineSourceDisplay,
        remarks: remarksDisplay,
      };
    });
  }, [vaccinationRecords]);

  React.useEffect(() => {
    setPage(1);
  }, [selectedYear]);

  const totalPages = Math.max(1, Math.ceil(groupedRecords.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const pageItems = groupedRecords.slice(start, start + pageSize);

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
      const filteredRecords = groupedRecords.filter((record) => {
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
        'Animal Registered',
        'No. of Heads',
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
            record.animalRegistered || '—',
            record.noOfHeads || '—',
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
  }, [groupedRecords, selectedYear]);

  return (
    <AdminSidebarLayout title="Reports">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h2 className="text-lg font-semibold">Vaccination Report</h2>
          <div className="flex items-center gap-2">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <Button variant="green" onClick={exportToExcel} disabled={exporting || loading || groupedRecords.length === 0}>
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

        <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b-2 border-slate-200">
                  <th className="py-3 px-4 text-left font-semibold border-r border-slate-200 whitespace-nowrap" rowSpan={2}>Reason</th>
                  <th className="py-3 px-4 text-left font-semibold border-r border-slate-200 whitespace-nowrap" rowSpan={2}>Date</th>
                  <th className="py-3 px-4 text-left font-semibold border-r border-slate-200 whitespace-nowrap" rowSpan={2}>Barangay</th>
                  <th className="py-3 px-4 text-center font-semibold border-r border-slate-200 whitespace-nowrap bg-slate-100" colSpan={5}>Client Information</th>
                  <th className="py-3 px-4 text-center font-semibold border-r border-slate-200 whitespace-nowrap bg-slate-100" colSpan={3}>Animal Information</th>
                  <th className="py-3 px-4 text-center font-semibold border-r border-slate-200 whitespace-nowrap bg-slate-100" colSpan={6}>Vaccine Information</th>
                  <th className="py-3 px-4 text-center font-semibold whitespace-nowrap" rowSpan={2}>Remarks</th>
                </tr>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="py-3 px-4 text-left font-semibold border-r border-slate-200 whitespace-nowrap">First Name</th>
                  <th className="py-3 px-4 text-left font-semibold border-r border-slate-200 whitespace-nowrap">Last Name</th>
                  <th className="py-3 px-4 text-left font-semibold border-r border-slate-200 whitespace-nowrap">Gender</th>
                  <th className="py-3 px-4 text-left font-semibold border-r border-slate-200 whitespace-nowrap">Birthday</th>
                  <th className="py-3 px-4 text-left font-semibold border-r border-slate-200 whitespace-nowrap">Contact No.</th>
                  <th className="py-3 px-4 text-left font-semibold border-r border-slate-200 whitespace-nowrap">Species</th>
                  <th className="py-3 px-4 text-left font-semibold border-r border-slate-200 whitespace-nowrap">Sex</th>
                  <th className="py-3 px-4 text-left font-semibold border-r border-slate-200 whitespace-nowrap">Age</th>
                  <th className="py-3 px-4 text-left font-semibold border-r border-slate-200 whitespace-nowrap">Animal Registered</th>
                  <th className="py-3 px-4 text-left font-semibold border-r border-slate-200 whitespace-nowrap">No. of Heads</th>
                  <th className="py-3 px-4 text-left font-semibold border-r border-slate-200 whitespace-nowrap">Disease</th>
                  <th className="py-3 px-4 text-left font-semibold border-r border-slate-200 whitespace-nowrap">Vaccine Type</th>
                  <th className="py-3 px-4 text-left font-semibold border-r border-slate-200 whitespace-nowrap">Batch/Lot No.</th>
                  <th className="py-3 px-4 text-left font-semibold border-r border-slate-200 whitespace-nowrap">Vaccine Source</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={17} className="py-8 text-center text-slate-500">
                      Loading...
                    </td>
                  </tr>
                ) : pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={17} className="py-8 text-center text-slate-500">
                      No vaccination records found.
                    </td>
                  </tr>
                ) : (
                  pageItems.map((record, index) => (
                    <tr key={index} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 border-r border-slate-300">{record.reason === 'Routine' ? 'R' : record.reason === 'Mass' ? 'M' : record.reason === 'Outbreak' ? 'O' : record.reason || '—'}</td>
                      <td className="py-3 px-4 border-r border-slate-300">{record.date || '—'}</td>
                      <td className="py-3 px-4 border-r border-slate-300">{record.barangay || '—'}</td>
                      <td className="py-3 px-4 border-r border-slate-300">{record.firstName || '—'}</td>
                      <td className="py-3 px-4 border-r border-slate-300">{record.lastName || '—'}</td>
                      <td className="py-3 px-4 border-r border-slate-300">{record.gender || '—'}</td>
                      <td className="py-3 px-4 border-r border-slate-300">{record.birthday || '—'}</td>
                      <td className="py-3 px-4 border-r border-slate-300">{record.contactNo || '—'}</td>
                      <td className="py-3 px-4 border-r border-slate-300">{record.species || '—'}</td>
                      <td className="py-3 px-4 border-r border-slate-300">{record.sex || '—'}</td>
                      <td className="py-3 px-4 border-r border-slate-300">{record.age || '—'}</td>
                      <td className="py-3 px-4 border-r border-slate-300">{record.animalRegistered || 0}</td>
                      <td className="py-3 px-4 border-r border-slate-300">{record.noOfHeads || 0}</td>
                      <td className="py-3 px-4 border-r border-slate-300">{record.disease || '—'}</td>
                      <td className="py-3 px-4 border-r border-slate-300">{record.vaccineType || '—'}</td>
                      <td className="py-3 px-4 border-r border-slate-300">{record.batchLotNo || '—'}</td>
                      <td className="py-3 px-4 border-r border-slate-300">{record.vaccineSource || '—'}</td>
                      <td className="py-3 px-4">{record.remarks || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            Showing {groupedRecords.length === 0 ? 0 : start + 1} - {Math.min(start + pageSize, groupedRecords.length)} of{' '}
            {groupedRecords.length}
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

export default AdminReports;

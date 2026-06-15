export function exportToCSV(apps, bids) {
  // Applications CSV
  const appHeaders = ['Company', 'Role', 'Status', 'Date Applied', 'Location', 'Job URL', 'Interview Date', 'Notes']
  const appRows = apps.map(a => [
    a.company, a.role, a.status, a.dateApplied || '',
    a.location || '', a.link || '', a.interviewDate || '', (a.notes || '').replace(/\n/g, ' ')
  ])

  // Bids CSV
  const bidHeaders = ['Company', 'Role', 'Offered Salary', 'Status', 'Deadline', 'Notes']
  const bidRows = bids.map(b => [
    b.company, b.role, b.salary || '', b.status,
    b.deadline || '', (b.notes || '').replace(/\n/g, ' ')
  ])

  const escape = (val) => `"${String(val).replace(/"/g, '""')}"`
  const toCSV = (headers, rows) =>
    [headers, ...rows].map(row => row.map(escape).join(',')).join('\n')

  const fullCSV = `APPLICATIONS\n${toCSV(appHeaders, appRows)}\n\nJOB BIDS\n${toCSV(bidHeaders, bidRows)}`
  const blob = new Blob([fullCSV], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `offerbound-export-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

const STATUS_STYLES = {
  Pending: 'warning text-dark',
  Confirmed: 'primary',
  Completed: 'success',
  Cancelled: 'secondary',
};

export default function StatusBadge({ status }) {
  return <span className={`badge bg-${STATUS_STYLES[status] || 'secondary'}`}>{status}</span>;
}

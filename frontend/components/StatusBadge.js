import {
  ClockIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  XCircleIcon,
} from "./Icons";

const STATUS_CONFIG = {
  PENDING: {
    label: "Awaiting Confirmation",
    className: "badge-pending",
    icon: <ClockIcon size={13} />,
  },
  CONFIRMED: {
    label: "Confirmed",
    className: "badge-confirmed",
    icon: <CheckCircleIcon size={13} />,
  },
  REJECTED: {
    label: "Rejected",
    className: "badge-rejected",
    icon: <AlertCircleIcon size={13} />,
  },
  CANCELLED: {
    label: "Cancelled",
    className: "badge-cancelled",
    icon: <XCircleIcon size={13} />,
  },
  COMPLETED: {
    label: "Completed",
    className: "badge-completed",
    icon: <CheckCircleIcon size={13} />,
  },
};

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || {
    label: status,
    className: "badge-gray",
    icon: null,
  };

  return (
    <span className={`badge ${config.className}`}>
      {config.icon}
      <span>{config.label}</span>
    </span>
  );
}

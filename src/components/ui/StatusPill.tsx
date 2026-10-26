import Badge, { type BadgeVariant } from "./Badge";

export type Status =
  | "ACTIVE"
  | "PENDING"
  | "SUSPENDED"
  | "DEACTIVE"
  | "ONGOING"
  | "CLOSED"
  | "OPEN";

interface StatusPillProps {
  status: Status;
}

const statusVariants: Record<Status, BadgeVariant> = {
  ACTIVE: "success",
  PENDING: "warning",
  SUSPENDED: "danger",
  DEACTIVE: "neutral",
  ONGOING: "primary",
  CLOSED: "neutral",
  OPEN: "success",
};

function StatusPill({ status }: StatusPillProps) {
  return (
    <Badge variant={statusVariants[status]}>
      {status}
    </Badge>
  );
}

export default StatusPill;
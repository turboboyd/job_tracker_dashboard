type Props = {
  label: string;
  value: string;
};

export function MetaRow({ label, value }: Props) {
  return (
    <div className="flex items-start justify-between gap-md">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-foreground text-right break-words">{value}</dd>
    </div>
  );
}

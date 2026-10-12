/** A checkbox row with a bold title and a one-line explanation. */
export function Check({ id, checked, onChange, title, hint }: { id: string; checked: boolean; onChange: (v: boolean) => void; title: string; hint: string }) {
  return (
    <label className="pa-check" htmlFor={id}>
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>
        <b>{title}</b>
        <small>{hint}</small>
      </span>
    </label>
  );
}

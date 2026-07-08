export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <div className="loading-state" role="status">
      <span />
      <p>{label}</p>
    </div>
  );
}


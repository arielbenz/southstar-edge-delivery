export default function EnrollmentSkeleton() {
  return (
    <div className="enrollment-flow enrollment-flow--skeleton" aria-busy="true">
      <div className="enrollment-flow__skeleton-rect enrollment-flow__skeleton-rect--title" />
      <div className="enrollment-flow__skeleton-rect enrollment-flow__skeleton-rect--steps" />
      <div className="enrollment-flow__skeleton-rect enrollment-flow__skeleton-rect--body" />
    </div>
  );
}

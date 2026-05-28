export default function EnrollmentError({ message }) {
  return (
    <div className="enrollment-flow enrollment-flow--error" role="alert">
      <div className="enrollment-flow__error-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false">
          <path d="M12 2 1 21h22L12 2Zm0 6.5a1 1 0 0 1 1 1V14a1 1 0 1 1-2 0V9.5a1 1 0 0 1 1-1Zm0 9a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5Z" />
        </svg>
      </div>
      <p className="enrollment-flow__error-message">{message}</p>
    </div>
  );
}

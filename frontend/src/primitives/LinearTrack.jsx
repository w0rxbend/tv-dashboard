/**
 * Thin progress bar used for sensor readings.
 * `value` is a percentage (0–100). `color` drives `currentColor`.
 */
export function LinearTrack(props) {
  const pct = () => `${Math.min(100, Math.max(0, props.value))}%`;

  return (
    <div
      class="linear-track"
      role="progressbar"
      aria-valuemin={props.min ?? 0}
      aria-valuemax={props.max ?? 100}
      aria-valuenow={Math.min(props.max ?? 100, Math.max(props.min ?? 0, props.value))}
      aria-label={props.label ?? 'Reading level'}
      aria-valuetext={props.valueText}
      style={{ color: props.color, 'margin-top': '6px' }}
    >
      <div class="linear-fill" style={{ width: pct() }}/>
    </div>
  );
}

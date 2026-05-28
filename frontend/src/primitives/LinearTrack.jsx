/**
 * Thin progress bar used for sensor readings.
 * `value` is a percentage (0–100). `color` drives `currentColor`.
 */
export function LinearTrack(props) {
  const pct = () => `${Math.min(100, Math.max(0, props.value))}%`;

  return (
    <div class="linear-track" style={{ color: props.color, 'margin-top': '6px' }}>
      <div class="linear-fill" style={{ width: pct() }}/>
    </div>
  );
}

import { mergeProps } from 'solid-js';

/**
 * Material Symbol icon shorthand.
 * Uses Roboto's variable font axes to control fill and optical size.
 */
export function MS(props) {
  const merged = mergeProps({ size: 24, fill: false, weight: 400 }, props);

  return (
    <span
      class={'ms ' + (merged.class || '')}
      style={{
        'font-size': `${merged.size}px`,
        'font-variation-settings': `'FILL' ${merged.fill ? 1 : 0}, 'wght' ${merged.weight}, 'GRAD' 0, 'opsz' ${merged.size}`,
        ...merged.style,
      }}
      aria-hidden="true"
    >
      {merged.name}
    </span>
  );
}

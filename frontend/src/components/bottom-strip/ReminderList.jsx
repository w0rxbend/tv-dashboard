import { For } from 'solid-js';
import { MS } from '../../primitives';

export function ReminderList(props) {
  return (
    <div class="bs-cell">
      <MS name="checklist" class="bs-cell-icon" aria-hidden="true"/>
      <div class="t-label-md muted">NEXT REMINDERS</div>
      <For each={(props.reminders ?? []).slice(0, 3)}>
        {(reminder) => (
          <div class="reminder-row">
            <span classList={{ dot: true, done: reminder.done }} aria-hidden="true"/>
            <span
              class="text"
              style={{
                color: reminder.done ? 'var(--md-on-surface-variant)' : 'inherit',
                'text-decoration': reminder.done ? 'line-through' : 'none',
              }}
            >
              {reminder.text}
            </span>
            <span class="when">{reminder.when}</span>
          </div>
        )}
      </For>
    </div>
  );
}

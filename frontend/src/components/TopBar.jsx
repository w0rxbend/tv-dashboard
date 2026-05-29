import { createMemo, createResource } from 'solid-js';
import { MS } from '../primitives';
import { useNow } from '../data';
import { createPolling } from '../data/createPolling';
import { fetchLocation, fetchDevices, POLL } from '../api';
import AppLogo from './AppLogo';

export default function TopBar(props) {
  const now  = useNow(1000);
  const hh   = createMemo(() => String(now().getHours()).padStart(2, '0'));
  const mm   = createMemo(() => String(now().getMinutes()).padStart(2, '0'));
  const ss   = createMemo(() => String(now().getSeconds()).padStart(2, '0'));
  const day  = createMemo(() => now().toLocaleDateString('en-US', { weekday: 'long' }));
  const date = createMemo(() => now().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));

  const [location] = createResource(fetchLocation);
  const devices    = props.devices ?? createPolling(fetchDevices, { interval: POLL.DEVICES });

  const locationLabel = () => {
    const loc = location();
    if (!loc) return '…';
    return `${loc.city} · ${loc.region}`;
  };

  const meshOnline = () => (devices.latest?.online ?? 0) === (devices.latest?.total ?? -1);
  const meshLabel  = () => {
    const d = devices.latest;
    if (!d) return 'syncing…';
    return `Mesh synced · ${d.online}/${d.total} sensors`;
  };

  return (
    <header class="topbar" role="banner">
      {/* Brand */}
      <div class="topbar-cluster">
        <AppLogo size={44}/>
        <span class="t-headline-md" style={{ 'font-weight': 500, 'letter-spacing': '-0.01em' }}>Aurora</span>
      </div>

      {/* Clock */}
      <div class="topbar-cluster" style={{ gap: '28px' }}>
        <div style={{ display: 'flex', 'align-items': 'baseline', gap: '10px' }}>
          <time class="t-display-sm t-num" style={{ 'font-weight': 300, 'letter-spacing': '-0.04em' }}>
            {hh()}:{mm()}
          </time>
          <span class="t-title-md muted t-mono" style={{ 'font-variation-settings': '"wght" 400' }}>:{ss()}</span>
        </div>
        <div style={{ display: 'flex', 'flex-direction': 'column', gap: '2px' }}>
          <span class="t-title-md">{day()}</span>
          <span class="t-body-sm muted">{date()}</span>
        </div>
      </div>

      {/* Status chips */}
      <div class="topbar-cluster" style={{ gap: '10px' }}>
        <span class="chip chip-outline">
          <MS name="location_on" size={16}/>
          {locationLabel()}
        </span>
        <span class="chip chip-good">
          {meshOnline() && <span class="live-dot" aria-hidden="true"/>}
          {meshLabel()}
        </span>
      </div>
    </header>
  );
}

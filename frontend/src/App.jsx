import { createSignal, onMount, onCleanup } from 'solid-js';
import TopBar      from './components/TopBar';
import AirQualityCard from './components/AirQualityCard';
import WeatherCard from './components/WeatherCard';
import AgendaCard  from './components/AgendaCard';
import TelemetryChartCard from './components/TelemetryChartCard';
import IndoorClimateCard from './components/IndoorClimateCard';
import DashboardBottomStrip from './components/DashboardBottomStrip';
import { createDashboardResources } from './data/dashboardResources';

const DESIGN_W = 1920;
const DESIGN_H = 1080;

function stageScale() {
  if (typeof window === 'undefined') return { x: 1, y: 1 };
  return {
    x: window.innerWidth / DESIGN_W,
    y: window.innerHeight / DESIGN_H,
  };
}

function Background() {
  return (
    <div aria-hidden="true">
      <div class="bg-blob" style={{ width: '700px', height: '700px', top: '-180px', left: '-180px', background: 'radial-gradient(circle, #1F3C73 0%, transparent 70%)' }}/>
      <div class="bg-blob" style={{ width: '600px', height: '600px', bottom: '-160px', right: '-120px', background: 'radial-gradient(circle, #71341B 0%, transparent 70%)', 'animation-delay': '-9s' }}/>
      <div class="bg-blob" style={{ width: '500px', height: '500px', top: '40%', left: '45%', background: 'radial-gradient(circle, #4F378B 0%, transparent 70%)', 'animation-delay': '-15s', opacity: 0.35 }}/>
    </div>
  );
}

export default function App() {
  const resources = createDashboardResources();
  const [scale, setScale] = createSignal(stageScale());

  onMount(() => {
    const fit = () => setScale(stageScale());
    fit();
    window.addEventListener('resize', fit);
    onCleanup(() => window.removeEventListener('resize', fit));
  });

  return (
    <div class="stage-wrap">
      <div class="stage" style={{ transform: `scale(${scale().x}, ${scale().y})` }}>
        <Background/>
        <div class="dash">
          <div class="area-topbar">
            <TopBar
              airQuality={resources.airQuality}
              weather={resources.weather}
              location={resources.location}
              events={resources.events}
              reminders={resources.reminders}
            />
          </div>
          <div class="area-aqi"><AirQualityCard airQuality={resources.airQuality}/></div>
          <div class="area-wx"><WeatherCard weather={resources.weather}/></div>
          <div class="area-agenda">
            <AgendaCard events={resources.events} daylight={resources.daylight}/>
          </div>
          <div class="area-chart">
            <TelemetryChartCard readings={resources.airQualityReadings}/>
          </div>
          <div class="area-indoor">
            <IndoorClimateCard indoorClimate={resources.indoorClimate}/>
          </div>
          <div class="area-bottom">
            <DashboardBottomStrip
              insights={resources.insights}
              weather={resources.weather}
              location={resources.location}
              airQuality={resources.airQuality}
              airQualityReadings={resources.airQualityReadings}
              indoorClimate={resources.indoorClimate}
              daylight={resources.daylight}
              events={resources.events}
              reminders={resources.reminders}
              systemStatus={resources.systemStatus}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

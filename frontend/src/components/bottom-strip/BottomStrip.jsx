import { createSignal, onMount, onCleanup } from 'solid-js';
import { SystemStatusWidget } from './SystemStatusWidget';
import { WindWidget } from './WindWidget';
import { UvIndexWidget } from './UvIndexWidget';
import { InsightTile } from './InsightTile';
import { ReminderList } from './ReminderList';
import { createUvIndexModel, createWindModel } from './outdoorModels';
import { optionalResource } from '../../data/emptyResource';

const ROTATE_MS = 6000;
const EMPTY_INSIGHT = { icon: 'auto_awesome', title: '...', sub: '' };

export default function BottomStrip(props) {
  const [activeInsightIndex, setActiveInsightIndex] = createSignal(0);
  const airQuality = optionalResource(props.airQuality);
  const airQualityReadings = optionalResource(props.airQualityReadings);
  const daylight = optionalResource(props.daylight);
  const events = optionalResource(props.events);
  const indoorClimate = optionalResource(props.indoorClimate);
  const insights = optionalResource(props.insights);
  const location = optionalResource(props.location);
  const remindersResource = optionalResource(props.reminders);
  const systemStatus = optionalResource(props.systemStatus);
  const weather = optionalResource(props.weather);

  const insightList = () => insights.latest?.insights ?? [];
  const currentInsight = () => insightList()[activeInsightIndex()] ?? EMPTY_INSIGHT;
  const reminders = () => remindersResource.latest?.reminders ?? [];
  const currentWeather = () => weather.latest?.current;
  const wind = () => createWindModel(currentWeather());
  const uvIndex = () => createUvIndexModel(currentWeather());

  onMount(() => {
    const intervalId = setInterval(() => setActiveInsightIndex((index) => {
      const length = insightList().length;
      return length ? (index + 1) % length : 0;
    }), ROTATE_MS);
    onCleanup(() => clearInterval(intervalId));
  });

  return (
    <section class="bottom-strip" aria-label="Status strip">
      <InsightTile
        activeIndex={activeInsightIndex()}
        insight={currentInsight()}
        insights={insightList()}
      />

      <ReminderList reminders={reminders()}/>

      <div class="bs-cell status-cell" aria-label="System status">
        <SystemStatusWidget
          airQuality={airQuality}
          airQualityReadings={airQualityReadings}
          daylight={daylight}
          weather={weather}
          indoorClimate={indoorClimate}
          location={location}
          events={events}
          reminders={remindersResource}
          insights={insights}
          systemStatus={systemStatus}
        />
      </div>

      <div class="bs-cell wind-cell" aria-label={wind().ariaLabel}>
        <WindWidget weather={currentWeather()}/>
      </div>

      <div class="bs-cell uv-cell" aria-label={uvIndex().ariaLabel}>
        <UvIndexWidget weather={currentWeather()}/>
      </div>
    </section>
  );
}

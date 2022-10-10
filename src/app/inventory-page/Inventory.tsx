import { DestinyAccount } from 'app/accounts/destiny-account';
import { settingsSelector } from 'app/dim-api/selectors';
import ErrorBoundary from 'app/dim-ui/ErrorBoundary';
import ShowPageLoading from 'app/dim-ui/ShowPageLoading';
import GearPower from 'app/gear-power/GearPower';
import { t } from 'app/i18next-t';
import DragPerformanceFix from 'app/inventory/DragPerformanceFix';
import { storesLoadedSelector } from 'app/inventory/selectors';
import { useLoadStores } from 'app/inventory/store/hooks';
import { MaterialCountsSheet } from 'app/material-counts/MaterialCountsWrappers';
import SpeechRecognitionTranscript from 'app/speech-recognition/SpeechRecognitionTranscript';
import { infoLog } from 'app/utils/log';
import { useSelector } from 'react-redux';
import Stores from './Stores';

export default function Inventory({ account }: { account: DestinyAccount }) {
  infoLog('inventory', 'loaded');
  const storesLoaded = useSelector(storesLoadedSelector);
  useLoadStores(account);

  const settings = useSelector(settingsSelector);

  if (!storesLoaded) {
    return <ShowPageLoading message={t('Loading.Profile')} />;
  }
  return (
    <ErrorBoundary name="Inventory">
      {settings.speechRecognition && (
        <SpeechRecognitionTranscript activationPhrase={settings.activationPhrase} />
      )}
      <Stores />
      <DragPerformanceFix />
      {account.destinyVersion === 2 && <GearPower />}
      {account.destinyVersion === 2 && <MaterialCountsSheet />}
    </ErrorBoundary>
  );
}

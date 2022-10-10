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
import { useDimSpeechRecognition } from 'app/speech-recognition/speech-recognition';
import { useSelector } from 'react-redux';
import Stores from './Stores';

export default function Inventory({ account }: { account: DestinyAccount }) {
  const storesLoaded = useSelector(storesLoadedSelector);
  useLoadStores(account);
  const settings = useSelector(settingsSelector);
  const startListening = useDimSpeechRecognition(settings.activationPhrase);
  if (!storesLoaded) {
    return <ShowPageLoading message={t('Loading.Profile')} />;
  }

  if (settings.speechRecognition) {
    startListening();
  }

  return (
    <ErrorBoundary name="Inventory">
      <Stores />
      <DragPerformanceFix />
      {account.destinyVersion === 2 && <GearPower />}
      {account.destinyVersion === 2 && <MaterialCountsSheet />}
    </ErrorBoundary>
  );
}

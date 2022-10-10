import { settingsSelector } from 'app/dim-api/selectors';
import { t } from 'app/i18next-t';
import Checkbox from 'app/settings/Checkbox';
import { useSetSetting } from 'app/settings/hooks';
import { useSelector } from 'react-redux';

export default function SpeechRecognitionSettings() {
  // const dispatch = useThunkDispatch();
  const settings = useSelector(settingsSelector);

  const setSetting = useSetSetting();

  const onCheckChange = (checked: boolean) => {
    setSetting('speechRecognition', checked);
  };

  const updateActivationPhrase = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSetting('activationPhrase', e.target.value);
  };
  return (
    <section id="speech-recognition">
      <h2>Speech Recognition</h2>
      <div className="setting">
        <Checkbox
          label={t('Settings.SpeechRecognition.Toggle')}
          name="speechRecognition"
          value={settings.speechRecognition}
          onChange={onCheckChange}
        />
        <div className="fineprint">
          {t('Settings.SpeechRecognition.Fineprint')}{' '}
          <b>{t('Settings.SpeechRecognition.OldExtension')}</b>
        </div>
        {settings.speechRecognition && (
          <div>
            <label htmlFor="activation-phrase">Activation Phrase</label>
            <input
              type="text"
              name="activationPhrase"
              className="activation-phrase"
              value={settings.activationPhrase}
              onChange={updateActivationPhrase}
            />
          </div>
        )}
      </div>
    </section>
  );
}

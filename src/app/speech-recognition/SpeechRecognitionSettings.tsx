import { settingsSelector } from 'app/dim-api/selectors';
import { t } from 'app/i18next-t';
import Checkbox from 'app/settings/Checkbox';
import { useSetSetting } from 'app/settings/hooks';
import { fineprintClass, settingClass } from 'app/settings/SettingsPage';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import styles from './SpeechRecognitionTranscript.m.scss';

export default function SpeechRecognitionSettings() {
  // const dispatch = useThunkDispatch();
  const settings = useSelector(settingsSelector);
  const [showError, setShowError] = useState(false);

  const setSetting = useSetSetting();

  useEffect(() => {
    if (settings.alwaysListening && settings.activationPhrase === '') {
      setShowError(true);
    }
  }, []);

  const onCheckChange = (checked: boolean) => {
    setSetting('alwaysListening', checked);
  };

  const updateActivationPhrase = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newActivationPhrase = e.target.value.trim();
    setSetting('activationPhrase', newActivationPhrase);

    setShowError(newActivationPhrase === '' && settings.alwaysListening);
  };
  return (
    <section id="speech-recognition">
      <h2>Speech Recognition</h2>
      <div className={settingClass}>
        <Checkbox
          label={t('SpeechRecognition.Toggle')}
          name="alwaysListening"
          value={settings.alwaysListening}
          onChange={onCheckChange}
        />
        <div className={fineprintClass}>
          {t('SpeechRecognition.Fineprint')} <b>{t('SpeechRecognition.OldExtension')}</b>
        </div>
        {settings.alwaysListening && (
          <div>
            <label htmlFor="activation-phrase">Activation Phrase</label>
            <input
              type="text"
              name="activationPhrase"
              placeholder={"Enter activation phrase like 'okay ghost'"}
              className={styles.text}
              value={settings.activationPhrase}
              onChange={updateActivationPhrase}
            />
            {showError && (
              <span className={styles.error}>
                Must enter activation phrase if using Always Listening
              </span>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

import { defaultSettings, Settings as DimApiSettings } from '@destinyitemmanager/dim-api-types';
import { defaultLanguage, DimLanguage } from 'app/i18n';

export const enum ItemPopupTab {
  Overview,
  Triage,
}

export const enum VaultWeaponGroupingStyle {
  Lines,
  Inline,
}

/**
 * We extend the settings interface so we can try out new settings before committing them to dim-api-types
 */
export interface Settings extends DimApiSettings {
  /** supplements itemSortOrderCustom by allowing each sort to be reversed */
  itemSortReversals: string[];
  alwaysListening: boolean;
  activationPhrase: string;
  /** Select descriptions to display */
  readonly descriptionsToDisplay: 'bungie' | 'community' | 'both';
  language: DimLanguage;
  theme: string;
  sortRecordProgression: boolean;
  vendorsHideSilverItems: boolean;
  vaultWeaponGrouping: string;
  vaultWeaponGroupingStyle: VaultWeaponGroupingStyle;
  itemPopupTab: ItemPopupTab;
}

export const initialSettingsState: Settings = {
  ...defaultSettings,
  language: defaultLanguage(),
  itemSortReversals: [],
  alwaysListening: false,
  activationPhrase: 'okay ghost',
  descriptionsToDisplay: 'both',
  theme: 'default',
  sortRecordProgression: false,
  vendorsHideSilverItems: false,
  vaultWeaponGrouping: '',
  vaultWeaponGroupingStyle: VaultWeaponGroupingStyle.Lines,
  itemPopupTab: ItemPopupTab.Overview,
};

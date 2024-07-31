import 'regenerator-runtime/runtime';

import { startFarming, stopFarming } from 'app/farming/actions';
import { useHotkey } from 'app/hotkeys/useHotkey';
import { getTag } from 'app/inventory/dim-item-info';
import { DimItem } from 'app/inventory/item-types';
import { moveItemTo } from 'app/inventory/move-item';
import { allItemsSelector, itemInfosSelector, sortedStoresSelector } from 'app/inventory/selectors';
import { getCurrentStore } from 'app/inventory/stores-helpers';
import { hideItemPopup } from 'app/item-popup/item-popup';
import { applyLoadout } from 'app/loadout-drawer/loadout-apply';
import { Loadout } from 'app/loadout/loadout-types';
import { loadoutsSelector } from 'app/loadout/loadouts-selector';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { RootState } from 'app/store/types';
import { getItemDamageShortName } from 'app/utils/item-utils';
import { errorLog, infoLog } from 'app/utils/log';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import Fuse, { FuseResult, IFuseOptions } from 'fuse.js';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import SpeechRecognitionNative, { useSpeechRecognition } from 'react-speech-recognition';
import micSvg from '../../images/mic-icon.svg';
import styles from './SpeechRecognitionTranscript.m.scss';

export default function SpeechRecognitionTranscript({
  activationPhrase,
  alwaysListening,
}: {
  activationPhrase: string;
  alwaysListening: boolean;
}) {
  const dispatch = useThunkDispatch();
  const [transcript, setTranscript] = useState('');
  const allItems = useSelector<RootState, DimItem[]>(allItemsSelector);
  const itemInfos = useSelector(itemInfosSelector);

  const stores = useSelector(sortedStoresSelector);
  const allLoadouts = useSelector(loadoutsSelector);
  const dimStore = getCurrentStore(stores)!;

  const triggerPhrase = alwaysListening ? `${activationPhrase} ` : '';

  useHotkey(
    '\\',
    'Activate speech recognition',
    useCallback(() => {
      SpeechRecognitionNative.startListening();
      infoLog('voice', 'Activating transcript via hotkey');
    }, []),
  );

  const loadouts = allLoadouts.filter(
    (loadout) =>
      dimStore?.classType === DestinyClass.Unknown ||
      loadout.classType === DestinyClass.Unknown ||
      loadout.classType === dimStore?.classType,
  );
  infoLog('voice loadouts', loadouts);

  const [operableItems, allPerks] = useMemo(() => {
    let weaponPerks: string[] = [];

    const items = allItems
      .filter((i: DimItem) => i.bucket.inWeapons || i.bucket.inArmor)
      .map((item) => {
        const socketIndexes = item.sockets?.categories
          .filter((cat) => cat.category.hash === 4241085061)
          .flatMap((sc) => sc.socketIndexes);

        const perks = item.sockets?.allSockets
          .filter((s) => socketIndexes?.includes(s.socketIndex))
          .map((p) => p.plugOptions.map((po) => po.plugDef.displayProperties.name));

        if (perks) {
          weaponPerks = weaponPerks.concat(...perks.flat());
        }

        return {
          item: item,
          name: item.name,
          damageType: getItemDamageShortName(item),
          itemInfo: itemInfos[item.id],
          slot: item.type,
          tier: item.tier,
          ammoType: item.ammoType,
          crafted: item.crafted,
          wishlisted: false, // not sure how to do this yet, selector won't work since this is in a callback
          tagged: getTag(item, itemInfos),
          perks: perks?.flat(),
        };
      });
    return [items, [...new Set(weaponPerks)]];
  }, [allItems, itemInfos]);

  infoLog('voice item', { items: operableItems.slice(20, 100) });
  infoLog('voice perks', { items: operableItems, perks: allPerks });
  const moveItemCallback = useCallback(
    (query: string, perks: string | null, equip: boolean) => {
      infoLog('voice', equip ? 'equipping' : 'transferring', { query, perks });
      const currentChar = getCurrentStore(stores)!;
      const item = determineItem(
        query,
        operableItems.filter((i) => i.item.owner !== currentChar.id),
        allPerks,
      );
      if (item) {
        infoLog('voice', 'attempting move of', item);
        dispatch(moveItemTo(item, currentChar, equip, item.maxStackSize));
        hideItemPopup();
      } else {
        infoLog('voice', "Didn't understand weapon name");
      }
    },
    [dispatch, operableItems, stores, allPerks],
  );

  const farmingCallback = useCallback(
    (startStop: 'start' | 'stop') => {
      if (startStop.trim().toLowerCase() === 'start') {
        infoLog('voice', 'starting farming mode on', dimStore.name);
        dispatch(startFarming(dimStore.id));
      } else if (startStop.trim().toLowerCase() === 'stop') {
        infoLog('voice', 'stopping farming mode on', dimStore.name);
        dispatch(stopFarming());
      }
    },
    [dispatch, dimStore?.id, dimStore?.name],
  );

  const loadoutCallback = useCallback(
    (loadoutName: string) => {
      infoLog('voice loadout', 'equipping loadout', loadoutName);
      const loadoutToEquip = determineLoadout(loadoutName, loadouts);

      if (loadoutToEquip) {
        dispatch(applyLoadout(dimStore, loadoutToEquip));
      }
    },
    [dispatch, dimStore, loadouts],
  );

  const commands = [
    {
      command: `${triggerPhrase}transfer *`,
      callback: (item: string, ...args: { resetTranscript: () => void }[]) => {
        infoLog('voice moveItem', { item, args: [...args] });
        let [itemQuery, perkQuery] = item.split(' with ');
        itemQuery = itemQuery.toLowerCase().trim();
        perkQuery = perkQuery.toLowerCase().trim();
        moveItemCallback(itemQuery, perkQuery, false);
        infoLog('voice', { args });
        args[args.length - 1].resetTranscript();
      },
    },
    {
      command: `${triggerPhrase}equip *`,
      callback: (item: string, ...args: { resetTranscript: () => void }[]) => {
        let [itemQuery, perkQuery] = item.split(' with ');
        itemQuery = itemQuery.toLowerCase().trim();
        perkQuery = perkQuery.toLowerCase().trim();
        moveItemCallback(itemQuery, perkQuery, true);
        args[args.length - 1].resetTranscript();
      },
    },
    {
      command: [`${triggerPhrase}loadout *`, `${triggerPhrase}load out *`],
      callback: (loadoutName: string, ...args: { resetTranscript: () => void }[]) => {
        loadoutCallback(loadoutName);
        args[args.length - 1].resetTranscript();
      },
    },
    {
      command: `${triggerPhrase}:startStop farming mode`,
      callback: (startStop: 'start' | 'stop', ...args: { resetTranscript: () => void }[]) => {
        farmingCallback(startStop);
        args[args.length - 1].resetTranscript();
      },
    },
  ];

  const { finalTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition({
    clearTranscriptOnListen: true,
    commands,
  });

  const handleTranscriptChange = useCallback(() => {
    if (finalTranscript.trim() !== '') {
      infoLog('voice transcript', finalTranscript);
      setTranscript(finalTranscript.trim().toUpperCase());
      setTimeout(() => {
        infoLog('voice transcript', 'resetting transcript');
        setTranscript('');
      }, 5000);
    }

    if (!alwaysListening) {
      SpeechRecognitionNative.stopListening();
    }
  }, [alwaysListening, finalTranscript]);

  useEffect(() => {
    handleTranscriptChange();
  }, [handleTranscriptChange]);

  useEffect(() => {
    if (alwaysListening) {
      SpeechRecognitionNative.startListening({ continuous: true });
    }
  }, [alwaysListening]);

  if (!browserSupportsSpeechRecognition) {
    errorLog('voice', 'Speech recognition is not supported by this browser');
  }

  return (
    <div className={styles.speech}>
      <span>{transcript}</span>
      <img src={micSvg} alt="" />
    </div>
  );
}

function determineItem(
  query: string,
  operableItems: { item: DimItem; name: string; perks: string[] | undefined }[],
  allPerks: string[],
): DimItem | undefined {
  const [itemQuery, perkQuery] = query.split(' with ');

  const foundPerks: string[] = [];
  if (perkQuery) {
    const perks = perkQuery.split(' and ');
    for (const perk of perks) {
      const foundPerk = getClosestMatch(perk, allPerks);
      if (foundPerk) {
        foundPerks.push(foundPerk.item);
      }
    }
  }

  const filteredItems =
    foundPerks.length > 0
      ? operableItems.filter((o) => foundPerks.every((p) => o.perks?.includes(p)))
      : operableItems;
  const itemResult = getClosestMatch(itemQuery, filteredItems);

  infoLog('voice fuse', { item: itemResult, perks: foundPerks });

  return itemResult?.item.item;
}

function determineLoadout(loadoutRequested: string, loadouts: Loadout[]): Loadout | undefined {
  const loadoutResult = getClosestMatch(loadoutRequested, loadouts);
  return loadoutResult?.item;
}

function getClosestMatch<T>(query: string, availableItems: T[]): FuseResult<T> | null {
  const options: IFuseOptions<T> = {
    includeScore: true,
    shouldSort: true,
    findAllMatches: true,
    keys: ['name'],
  };
  infoLog('voice fuse', { availableItems });

  const fuse = new Fuse(availableItems, options);

  const results = fuse.search(query);
  if (results.length > 0 && results[0].score && results[0].score < 0.6) {
    return results[0];
  }

  infoLog('voice', "Couldn't find a match on whole query, so we're splitting it by word");
  return results.length > 0 ? results[0] : null;
}

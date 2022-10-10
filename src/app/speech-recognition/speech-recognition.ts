import { createSpeechlySpeechRecognition } from '@speechly/speech-recognition-polyfill';
import { DimItem } from 'app/inventory/item-types';
import { moveItemTo } from 'app/inventory/move-item';
import { allItemsSelector, sortedStoresSelector } from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import { getCurrentStore } from 'app/inventory/stores-helpers';
import { hideItemPopup } from 'app/item-popup/item-popup';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { RootState } from 'app/store/types';
import { errorLog, infoLog } from 'app/utils/log';
import Fuse from 'fuse.js';
import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import SpeechRecognitionNative, { useSpeechRecognition } from 'react-speech-recognition';

const APP_ID = process.env.SPEECHLY_APP_ID;
const SpeechlySpeechRecognition = createSpeechlySpeechRecognition(APP_ID);
SpeechRecognitionNative.applyPolyfill(SpeechlySpeechRecognition);

export function useDimSpeechRecognition(activationPhrase: string) {
  const allItems = useSelector<RootState, DimItem[]>(allItemsSelector);
  const stores = useSelector(sortedStoresSelector);
  const dispatch = useThunkDispatch();

  const filteredItems: DimItem[] = allItems.filter(
    (i: DimItem) => i.bucket.inWeapons || i.bucket.inArmor
  );
  const operableItems = filteredItems.map((item) => {
    const socketIndexes = item.sockets?.categories
      .filter((cat) => cat.category.hash === 4241085061)
      .flatMap((sc) => sc.socketIndexes);

    const perks = item.sockets?.allSockets
      .filter((s) => socketIndexes?.includes(s.socketIndex))
      .map((p) => p.plugOptions.map((po) => po.plugDef.displayProperties.name));

    return {
      item: item,
      name: item.name,
      perks: perks?.flat(),
    };
  });
  const moveItemCallback = useCallback(
    (query: string, perks: string | null, equip: boolean) => {
      infoLog('voice', equip ? 'equipping' : 'transferring', { query, perks });
      const currentChar = getCurrentStore(stores)!;
      const item = determineItem(query, operableItems, currentChar);
      infoLog('voice', { item });
      if (item) {
        infoLog('voice', 'attempting move of', item);
        dispatch(moveItemTo(item, currentChar, equip, item.maxStackSize));
        hideItemPopup();
      } else {
        infoLog('voice', "Didn't understand weapon name");
      }
    },
    [dispatch, operableItems, stores]
  );

  const commands = [
    {
      command: `${activationPhrase} transfer *`,
      callback: (item: string, ...args: { command: string; resetTranscript: () => void }[]) => {
        moveItemCallback(item.toLowerCase().trim(), null, false);
        infoLog('voice', { args });
        args[args.length - 1].resetTranscript();
      },
    },
    {
      command: `${activationPhrase} transfer * with *`,
      callback: (item: string, perks: string) =>
        moveItemCallback(item.toLowerCase().trim(), perks, false),
    },
    {
      command: `${activationPhrase} equip * with *`,
      callback: (item: string, perks: string) =>
        moveItemCallback(item.toLowerCase().trim(), perks, true),
    },
  ];

  const { finalTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition({
    clearTranscriptOnListen: true,
    commands,
  });

  infoLog('voice', { operableItems });

  infoLog('voice', { finalTranscript });

  // useEffect(() => {
  //   if (finalTranscript.toLocaleLowerCase().includes(' transfer ')) {
  //     moveItemCallback(finalTranscript.toLocaleLowerCase().replace('transfer', '').trim(), false);
  //     resetTranscript();
  //   } else if (finalTranscript.toLocaleLowerCase().includes(' equip ')) {
  //     moveItemCallback(finalTranscript.toLocaleLowerCase().replace('equip', '').trim(), true);
  //     resetTranscript();
  //   }
  // }, [finalTranscript, resetTranscript, moveItemCallback]);
  const startListening = () => {
    infoLog('voice', 'listening');
    SpeechRecognitionNative.startListening({ continuous: true });
  };

  if (!browserSupportsSpeechRecognition) {
    errorLog('voice', 'Speech recognition is not supported by this browser');
  }
  return () => startListening();
}

function determineItem(
  query: string,
  operableItems: { item: DimItem; name: string; perks: string[] | undefined }[],
  currentChar: DimStore
): DimItem | undefined {
  const splitQuery = query.split(' with ');
  const result = getClosestMatch(
    splitQuery[0],
    operableItems.filter((o) => o.item.owner !== currentChar.id).map((i) => i.item)
  );
  infoLog('voice fuse', result);

  return result?.item;
}

// function determineItemName(
//   query: string,
//   operableItems: { item: DimItem; name: string; perks: string[] }[]
// ): string {
//   return '';
// }

function getClosestMatch(
  query: string,
  availableItems: DimItem[]
): Fuse.FuseResult<DimItem> | null {
  const options: Fuse.IFuseOptions<DimItem> = {
    includeScore: true,
    shouldSort: true,
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

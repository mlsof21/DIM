import { DimItem } from 'app/inventory/item-types';
import { AppIcon, faClock, shapedIcon } from 'app/shell/icons';
import { DestinyItemTooltipNotification } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import styles from './DestinyTooltipText.m.scss';
import RichDestinyText from './destiny-symbols/RichDestinyText';

export function DestinyTooltipText({ item }: { item: DimItem }) {
  if (!item.tooltipNotifications) {
    return null;
  }
  return (
    <>
      {!isDeepsightTooltip &&
        item.tooltipNotifications.map((tip) => (
          <div
            key={tip.displayString}
            className={clsx('quest-expiration item-details', {
              [styles.seasonalExpiration]: isExpirationTooltip(tip),
            })}
          >
            {isExpirationTooltip(tip) && <AppIcon icon={faClock} />}
            {isPatternTooltip(tip) && <AppIcon className={styles.shapedIcon} icon={shapedIcon} />}
            <RichDestinyText text={tip.displayString} ownerId={item.owner} />
          </div>
        ))}
    </>
  );
}

function isExpirationTooltip(tip: DestinyItemTooltipNotification) {
  return tip.displayStyle.endsWith('_expiration') || tip.displayStyle.endsWith('_seasonal');
}

function isPatternTooltip(tip: DestinyItemTooltipNotification) {
  return tip.displayStyle === 'ui_display_style_deepsight';
}

function isDeepsightTooltip(tip: DestinyItemTooltipNotification) {
  return tip.displayStyle === 'ui_display_style_info';
}

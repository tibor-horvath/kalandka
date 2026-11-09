import { Seed } from './art';
import { SeedSack } from './kiskert';
import { CountIn } from '../../components/CountIn';

/**
 * Counting seeds out: one hole per seed the thing costs, in rows of five like a ten-frame. Each tap (on the
 * tray or the sack) drops the next seed into the next hole, Csepi says its number and the sack's count goes
 * down by one. Nothing is spent until the last hole fills; leaving before that keeps every seed.
 */
export function SeedCount({
  cost,
  balance,
  label,
  onCount,
  onDone
}: {
  cost: number;
  /** Seeds in the sack before counting. */
  balance: number;
  /** What the seeds are for, read out by screen readers: "Körtefa". */
  label: string;
  /** Each seed counted, 1 … cost, for the guide's line. */
  onCount?: (n: number) => void;
  onDone: () => void;
}) {
  return (
    <CountIn
      cost={cost}
      balance={balance}
      label={label}
      unit="mag"
      unitObj="magot"
      token={(size) => <Seed size={size} />}
      store={<SeedSack />}
      onCount={onCount}
      onDone={onDone}
    />
  );
}

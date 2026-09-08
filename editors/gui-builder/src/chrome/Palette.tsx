import { Button } from '@heroui/react'
import { PALETTE, type Kind } from '../model/types.ts'

const LABEL: Partial<Record<Kind, string>> = {
  screen: 'Screen',
  row: 'Row',
  column: 'Column',
  slot: 'Slot',
  progress: 'Progress',
  energy: 'Energy',
  tank: 'Tank',
  search: 'Search',
  player: 'Player inv',
}

export function Palette(props: {
  disabledPlayer: boolean
  onAdd: (kind: Kind) => void
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {PALETTE.filter(kind => LABEL[kind]).map((kind) => (
        <Button
          key={kind}
          size="sm"
          variant="secondary"
          isDisabled={kind === 'player' && props.disabledPlayer}
          onPress={() => props.onAdd(kind)}
        >
          {LABEL[kind]}
        </Button>
      ))}
    </div>
  )
}

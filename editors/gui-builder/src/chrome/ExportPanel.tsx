import { Button, Label, TextArea, TextField } from '@heroui/react'
import type { GameUiSpecJson } from '../model/types.ts'

export function ExportPanel(props: { spec: GameUiSpecJson; template: string }) {
  const json = JSON.stringify(props.spec, null, 2)
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" onPress={() => copy(json)}>Copy spec</Button>
        <Button size="sm" variant="secondary" onPress={() => copy(props.template)}>Copy .butter</Button>
      </div>
      <TextField fullWidth name="template" value={props.template} isReadOnly>
        <Label>.butter template</Label>
        <TextArea rows={8} className="font-mono text-xs" />
      </TextField>
      <TextField fullWidth name="spec" value={json} isReadOnly>
        <Label>GameUiSpec</Label>
        <TextArea rows={10} className="font-mono text-xs" />
      </TextField>
    </div>
  )
}

function copy(text: string): void {
  void navigator.clipboard.writeText(text)
}

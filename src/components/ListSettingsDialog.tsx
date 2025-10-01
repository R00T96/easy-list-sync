import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePinPreferences, ListType } from '@/context/PinPreferencesContext';

export const ListSettingsDialog = () => {
  const { listType, updateListType, isLoading } = usePinPreferences();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" aria-label="List settings">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>List Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">List Type</label>
            <Select
              value={listType}
              onValueChange={(value) => updateListType(value as ListType)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="shopping">Shopping List (with quantity)</SelectItem>
                <SelectItem value="todo">Todo List (simple checklist)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {listType === 'shopping' 
                ? 'Items show quantity controls (+/- buttons)'
                : 'Items show as simple checkboxes without quantity'}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

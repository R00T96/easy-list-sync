import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Settings, Download, Upload, Lock, Unlock } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePinPreferences, ListType } from '@/context/PinPreferencesContext';
import { useQuantumKey } from '@/hooks/useQuantumKey';
import { usePin } from '@/hooks/usePin';
import { useRef } from 'react';

export const ListSettingsDialog = () => {
  const { listType, updateListType, isLoading, isProtected } = usePinPreferences();
  const { pin } = usePin();
  const {
    hasQuantumKey,
    isGenerating,
    generateQuantumKey,
    removeQuantumKey,
    downloadQuantumKey,
    restoreQuantumKey,
  } = useQuantumKey(pin);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

          <div className="space-y-2 border-t pt-4">
            <label className="text-sm font-medium flex items-center gap-2">
              {isProtected ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
              Quantum Key Protection
            </label>
            
            {isProtected && !hasQuantumKey && (
              <div className="rounded-md bg-amber-50 dark:bg-amber-950 p-3 text-sm">
                🔒 This list is protected. You need the key to edit it.
              </div>
            )}

            {isProtected && hasQuantumKey && (
              <div className="rounded-md bg-green-50 dark:bg-green-950 p-3 text-sm">
                ✅ You have access to edit this protected list.
              </div>
            )}

            {!isProtected && (
              <p className="text-xs text-muted-foreground">
                Lock this list to your device with quantum-random encryption.
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              {!isProtected && (
                <Button
                  onClick={generateQuantumKey}
                  disabled={isGenerating}
                  size="sm"
                  variant="default"
                >
                  {isGenerating ? 'Generating...' : '🔐 Generate Key'}
                </Button>
              )}

              {isProtected && hasQuantumKey && (
                <>
                  <Button
                    onClick={downloadQuantumKey}
                    size="sm"
                    variant="outline"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Backup Key
                  </Button>
                  <Button
                    onClick={removeQuantumKey}
                    size="sm"
                    variant="destructive"
                  >
                    Remove Protection
                  </Button>
                </>
              )}

              {isProtected && !hasQuantumKey && (
                <>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    size="sm"
                    variant="default"
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    Restore Key
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) restoreQuantumKey(file);
                    }}
                  />
                </>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              Protected lists can only be edited on devices with the quantum key.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

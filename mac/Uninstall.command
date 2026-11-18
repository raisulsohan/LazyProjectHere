#!/bin/bash
# LazyProjectHere for macOS (beta) - double-click to remove the two Quick
# Actions and ~/Library/Application Support/LazyProjectHere.
# Projects made with it stay. So does the log, ~/Library/Logs/LazyProjectHere.log,
# and Premiere's prefs backup "Adobe Premiere Pro Prefs.premierehere.bak".

for wf in "New After Effects project here" "New Premiere Pro project here"; do
    if [ -d "$HOME/Library/Services/$wf.workflow" ]; then
        rm -rf "$HOME/Library/Services/$wf.workflow"
        echo "Removed Quick Action: $wf"
    fi
done
/System/Library/CoreServices/pbs -update 2>/dev/null || true

TARGET="$HOME/Library/Application Support/LazyProjectHere"
if [ -d "$TARGET" ]; then
    rm -rf "$TARGET"
    echo "Removed folder: $TARGET"
fi
echo
echo "You can close this window."

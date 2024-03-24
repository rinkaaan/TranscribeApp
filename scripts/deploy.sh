source ~/startup.sh
WORKPLACE="$HOME/workplace/Transcribe"

WORKSPACE="$WORKPLACE/TranscribeApp"
(
  cd "$WORKSPACE"
  rsync-project Transcribe
  ssh root@hetzner "cd ~/workplace/Transcribe/TranscribeApp && npm run build"
)

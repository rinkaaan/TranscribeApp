WORKPLACE="$HOME/workplace/Transcribe"

WORKSPACE="$WORKPLACE/TranscribeApi"

(
  cd "$WORKSPACE"
  ./scripts/gen.sh
)

WORKSPACE="$WORKPLACE/TranscribeApp"
SCHEMA_PATH="$WORKPLACE/TranscribeApi/api/openapi.yaml"

(
  cd "$WORKSPACE"
  rm -rf openapi-client
  npx openapi -i "$SCHEMA_PATH" -o openapi-client
)

import { UnifiedEnv } from 'unified-env'

export const environment = new UnifiedEnv({
    APP_DOCUMENT_PATH: { required: true, defaultValue: './docs'},
    APP_VECTORDB_FILE: { required: true, defaultValue: './db/vectordb'},
    APP_VECTORDB_TABLE: { required: true, defaultValue: 'ollama'}
  })
    .env() // parse `process.env`
    .argv() // parse `process.argv`
    .file({ filePath: './.env' }) // parse an `.env` file (relative path)
    .generate(); // generate the environment object
  
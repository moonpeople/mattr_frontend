declare module 'monaco-languages-jq' {
  import type { languages } from 'monaco-editor'

  export const JQLanguageDefinition: languages.IMonarchLanguage &
    languages.LanguageConfiguration
}

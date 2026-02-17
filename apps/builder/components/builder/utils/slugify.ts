const CYRILLIC_TRANSLIT: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ё: 'e',
  ж: 'zh',
  з: 'z',
  и: 'i',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'kh',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'shch',
  ъ: '',
  ы: 'y',
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya',
  і: 'i',
  ї: 'yi',
  є: 'ye',
  ґ: 'g',
}

export const transliterateCyrillic = (value: string) =>
  value
    .split('')
    .map((char) => {
      const lower = char.toLowerCase()
      return CYRILLIC_TRANSLIT[lower] ?? char
    })
    .join('')

export const slugifyInput = (value: string) => {
  const normalized = transliterateCyrillic(value)
  const trimmed = normalized.trim()
  if (!trimmed) {
    return ''
  }
  return (
    trimmed
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || ''
  )
}

export const slugifyWithFallback = (value: string, fallback: string) => {
  const normalized = slugifyInput(value)
  return normalized || fallback
}

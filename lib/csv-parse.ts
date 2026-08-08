// Lightweight RFC-4180-ish CSV parser + registration-row normalization for the
// admin CSV import feature. Handles the export format written by lib/csv.ts:
//   - UTF-8 BOM prefix
//   - quoted fields with escaped "" quotes and embedded commas/newlines
//   - Excel text-formula cells like ="0912345678" (keeps the leading "0" of
//     phone numbers, which Excel otherwise strips as numbers)
//   - extra columns (e.g. "Registered Date") are ignored
//   - CRLF / LF / CR line endings

export type CsvImportRow = {
  // Logical record number in the file (1-based, header excluded) — used to
  // report which rows failed validation back to the admin.
  row: number
  name: string
  email: string
  age: string
  phone: string
  address: string
}

export type CsvParseResult = {
  rows: CsvImportRow[]
  errors: { row: number; error: string }[]
}

const REQUIRED_HEADERS = ['name', 'email', 'age', 'phone', 'address']

function parseCsv(text: string): string[][] {
  const content = text.replace(/^\uFEFF/, '')
  const records: string[][] = []
  let field = ''
  let record: string[] = []
  let inQuotes = false

  for (let i = 0; i < content.length; i++) {
    const ch = content[i]

    if (inQuotes) {
      if (ch === '"') {
        if (content[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      record.push(field)
      field = ''
    } else if (ch === '\n') {
      record.push(field)
      field = ''
      records.push(record)
      record = []
    } else if (ch === '\r') {
      // CRLF: let the following \n close the record. Standalone CR (old Mac)
      // also closes the record.
      if (content[i + 1] === '\n') continue
      record.push(field)
      field = ''
      records.push(record)
      record = []
    } else {
      field += ch
    }
  }

  if (field.length > 0 || record.length > 0) {
    record.push(field)
    records.push(record)
  }

  return records
}

// Strip the Excel text-formula wrapper (="value") and unescape doubled quotes.
function normalizeField(value: string): string {
  let v = value.trim()
  const match = v.match(/^="([\s\S]*)"$/)
  if (match) v = match[1].replace(/""/g, '"')
  return v.trim()
}

export function parseRegistrationsCsv(text: string): CsvParseResult {
  const records = parseCsv(text).filter((record) => record.some((cell) => cell.trim() !== ''))

  if (records.length === 0) {
    return { rows: [], errors: [{ row: 1, error: 'CSV ဖိုင်ထဲတွင် Data မရှိပါ။' }] }
  }

  const headers = records[0].map((h) => normalizeField(h).toLowerCase())
  const index: Record<string, number> = {}
  headers.forEach((h, i) => {
    if (!(h in index)) index[h] = i
  })

  const missing = REQUIRED_HEADERS.filter((h) => !(h in index))
  if (missing.length > 0) {
    return {
      rows: [],
      errors: [{ row: 1, error: `လိုအပ်သော ကော်လံများ မပါဝင်ပါ: ${missing.join(', ')}` }],
    }
  }

  const rows: CsvImportRow[] = []
  for (let i = 1; i < records.length; i++) {
    const rec = records[i]
    const at = (name: string) => normalizeField(rec[index[name]] ?? '')
    rows.push({
      row: i + 1,
      name: at('name'),
      email: at('email'),
      age: at('age'),
      phone: at('phone'),
      address: at('address'),
    })
  }

  return { rows, errors: [] }
}

export function createCsvFile(contents: string, fileName = 'cards-import.csv'): File {
  return new File([contents], fileName, { type: 'text/csv' });
}
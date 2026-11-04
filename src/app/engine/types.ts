export type Address = string; 

export interface CellPos {
  row: number; 
  col: number; 
}

export type CellError = "#CYCLE!" | "#REF!" | "#DIV/0!" | "#ERROR!";

export type CellValue = number | string | CellError | null;

export interface Change {
  sheetId: string;
  address: Address;
  before: string; // user ne jo raw text type kiya tha
  after: string;
}
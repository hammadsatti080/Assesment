
'use client';

import { useMemo } from 'react';
import { keyOf } from '../lib/constants';
import type { SheetState } from '../lib/types';

interface SummaryDashboardProps {
  sheet: SheetState;
  rowCount: number;
}

export default function SummaryDashboard({
  sheet,
  rowCount
}: SummaryDashboardProps) {

  const summary = useMemo(() => {
    let totalRows = 0;
    let totalItems = 0;
    let totalPrice = 0;

    for (let r = 1; r < rowCount; r++) {
      const category = sheet.data[keyOf(r, 0)] ?? '';
      const item = sheet.data[keyOf(r, 1)] ?? '';
      const price = sheet.data[keyOf(r, 2)] ?? '';

      if (
        String(category).trim() ||
        String(item).trim() ||
        String(price).trim()
      ) totalRows++;

      if (String(item).trim()) totalItems++;

      const num = Number(
        String(price).replace(/,/g, '').trim()
      );

      if (String(price).trim() && Number.isFinite(num)) {
        totalPrice += num;
      }
    }

    return { totalRows, totalItems, totalPrice };
  }, [sheet.data, rowCount]);

  return (
    <div className="mx-3 my-2 px-3 py-2
      bg-slate-50 border border-slate-200
      rounded-lg flex flex-wrap items-center
      justify-between gap-2">

      <span style={{display:"flex" ,  flexDirection : "row"  , gap : "50px" ,  marginLeft : "60px" , color : "Red"}}>
        Sheet Summary
      </span>

      <div style={{display:"flex" ,  flexDirection : "row"  , gap : "50px" ,  marginLeft : "60px"}}>

        <div className="bg-blue-100 px-3 py-1 rounded-md">
          <span  style={{color:"red"}}>
            Rows:
          </span>
          <strong className="ml-1 text-sm text-blue-800">
            {summary.totalRows}
          </strong>
        </div>

        <div className="bg-emerald-100 px-3 py-1 rounded-md">
          <span  style={{color:"red"}}>
            Items:
          </span>
          <strong className="ml-1 text-sm text-emerald-800">
            {summary.totalItems}
          </strong>
        </div>

       

      </div>
    </div>
  );
}

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FileText, Download, Calendar, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

interface ExportCenterProps {
  onExportPDF: (startDate: Date, endDate: Date) => void
  onExportCSV: (startDate: Date, endDate: Date) => void
}

export function ExportCenter({ onExportPDF, onExportCSV }: ExportCenterProps) {
  const [startDate, setStartDate] = useState<Date>(
    new Date(new Date().setDate(new Date().getDate() - 7))
  )
  const [endDate, setEndDate] = useState<Date>(new Date())
  const [isExportingPDF, setIsExportingPDF] = useState(false)
  const [isExportingCSV, setIsExportingCSV] = useState(false)

  const handlePDFExport = async () => {
    setIsExportingPDF(true)
    await onExportPDF(startDate, endDate)
    setTimeout(() => setIsExportingPDF(false), 2000)
  }

  const handleCSVExport = async () => {
    setIsExportingCSV(true)
    await onExportCSV(startDate, endDate)
    setTimeout(() => setIsExportingCSV(false), 1500)
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Calendar className="h-5 w-5 text-slate-600" />
        <h3 className="text-sm font-semibold text-slate-900">Centre d&apos;Export</h3>
      </div>

      {/* Date Range Picker */}
      <div className="mb-6 space-y-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-600">
            Date de début
          </label>
          <input
            type="date"
            value={format(startDate, "yyyy-MM-dd")}
            onChange={(e) => setStartDate(new Date(e.target.value))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-[#064e3b] focus:outline-none focus:ring-1 focus:ring-[#064e3b]"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-600">
            Date de fin
          </label>
          <input
            type="date"
            value={format(endDate, "yyyy-MM-dd")}
            onChange={(e) => setEndDate(new Date(e.target.value))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-[#064e3b] focus:outline-none focus:ring-1 focus:ring-[#064e3b]"
          />
        </div>
      </div>

      {/* Export Buttons */}
      <div className="space-y-2">
        <Button
          onClick={handlePDFExport}
          disabled={isExportingPDF}
          className="w-full bg-[#0F172A] text-white hover:bg-[#1E293B] shadow-md disabled:opacity-50"
        >
          {isExportingPDF ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Génération...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Générer Rapport de Maintenance (PDF)
            </>
          )}
        </Button>
        <Button
          onClick={handleCSVExport}
          disabled={isExportingCSV}
          variant="outline"
          className="w-full border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          {isExportingCSV ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Export en cours...
            </>
          ) : (
            <>
              <FileText className="mr-2 h-4 w-4" />
              Export CSV
            </>
          )}
        </Button>
      </div>

      {/* Date Range Display */}
      <p className="mt-4 text-xs text-slate-500">
        {format(startDate, "d MMM yyyy", { locale: fr })} - {format(endDate, "d MMM yyyy", { locale: fr })}
      </p>
    </div>
  )
}

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FileText, Download, Calendar } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

interface ReportingPanelProps {
  onExportPDF: (startDate: Date, endDate: Date) => void
  onExportCSV: (startDate: Date, endDate: Date) => void
}

export function ReportingPanel({ onExportPDF, onExportCSV }: ReportingPanelProps) {
  const [startDate, setStartDate] = useState<Date>(new Date(new Date().setDate(new Date().getDate() - 7)))
  const [endDate, setEndDate] = useState<Date>(new Date())

  const handlePDFExport = () => {
    onExportPDF(startDate, endDate)
  }

  const handleCSVExport = () => {
    onExportCSV(startDate, endDate)
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Calendar className="h-5 w-5 text-slate-600" />
        <h3 className="text-lg font-semibold text-slate-900">Reporting</h3>
      </div>

      {/* Date Range Picker */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
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
          <label className="mb-1 block text-xs font-medium text-slate-600">
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
          className="w-full bg-slate-900 text-white hover:bg-slate-800"
        >
          <FileText className="mr-2 h-4 w-4" />
          Générer Rapport PDF
        </Button>
        <Button
          onClick={handleCSVExport}
          variant="outline"
          className="w-full border-slate-300 text-slate-700 hover:bg-slate-50"
        >
          <Download className="mr-2 h-4 w-4" />
          Export CSV Complet
        </Button>
      </div>

      {/* Date Range Display */}
      <p className="mt-4 text-xs text-slate-500">
        Période sélectionnée : {format(startDate, "d MMM yyyy", { locale: fr })} - {format(endDate, "d MMM yyyy", { locale: fr })}
      </p>
    </div>
  )
}


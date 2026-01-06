import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

const clubId = "00000000-0000-0000-0000-000000000001"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      startDate,
      endDate,
      courseId,
      includeOpen,
      includeResolved,
      urgentOnly,
      includePhotos,
      includeNotes,
      clubName,
      reportType = "detailed",
    } = body

    const supabase = await createClient()

    // Récupérer les incidents
    let query = supabase
      .from("incidents")
      .select("*, courses(name)")
      .eq("club_id", clubId)
      .gte("created_at", startDate)
      .lte("created_at", endDate)
      .order("created_at", { ascending: false })

    // Gérer le multi-parcours
    if (courseId && courseId !== "all") {
      const courseIds = courseId.includes(",") ? courseId.split(",") : [courseId]
      if (courseIds.length === 1) {
        query = query.eq("course_id", courseIds[0])
      } else {
        query = query.in("course_id", courseIds)
      }
    }

    const { data: incidents, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Filtrer selon les critères
    let filteredIncidents = incidents || []
    
    if (urgentOnly) {
      filteredIncidents = filteredIncidents.filter(
        (inc: any) => inc.priority === "Critical" || inc.priority === "High"
      )
    } else {
      const statusFilter: string[] = []
      if (includeOpen) statusFilter.push("Open", "In_Progress")
      if (includeResolved) statusFilter.push("Resolved")
      
      if (statusFilter.length > 0) {
        filteredIncidents = filteredIncidents.filter((inc: any) =>
          statusFilter.includes(inc.status)
        )
      }
    }

    // Créer le PDF
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()

    // Page de garde
    doc.setFillColor(6, 78, 59) // #064e3b
    doc.rect(0, 0, pageWidth, 60, "F")
    
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(28)
    doc.setFont("helvetica", "bold")
    doc.text("Rapport d'Activité Terrain", pageWidth / 2, 30, { align: "center" })
    
    doc.setFontSize(18)
    doc.setFont("helvetica", "normal")
    doc.text(clubName || "TerrainSync", pageWidth / 2, 45, { align: "center" })

    doc.setTextColor(0, 0, 0)
    doc.setFontSize(12)
    doc.setFont("helvetica", "normal")
    const dateRange = `${new Date(startDate).toLocaleDateString("fr-FR")} - ${new Date(endDate).toLocaleDateString("fr-FR")}`
    doc.text(`Période: ${dateRange}`, pageWidth / 2, 80, { align: "center" })
    doc.text(`Généré le ${new Date().toLocaleDateString("fr-FR")}`, pageWidth / 2, 90, { align: "center" })

    // Tableau récapitulatif
    doc.setFontSize(16)
    doc.setFont("helvetica", "bold")
    doc.text("Synthèse", 20, 110)

    const summaryData = [
      ["Total d'incidents", filteredIncidents.length.toString()],
      ["Incidents ouverts", filteredIncidents.filter((inc: any) => inc.status === "Open" || inc.status === "In_Progress").length.toString()],
      ["Incidents résolus", filteredIncidents.filter((inc: any) => inc.status === "Resolved").length.toString()],
      ["Urgences", filteredIncidents.filter((inc: any) => inc.priority === "Critical" || inc.priority === "High").length.toString()],
    ]

    autoTable(doc, {
      startY: 115,
      head: [["Métrique", "Valeur"]],
      body: summaryData,
      theme: "striped",
      headStyles: { fillColor: [6, 78, 59] },
    })

    // Grouper par parcours si multi-parcours
    const courseIds = courseId && courseId !== "all" && courseId.includes(",") 
      ? courseId.split(",") 
      : courseId && courseId !== "all" 
        ? [courseId] 
        : null
    
    if (reportType === "detailed") {
      // Tableau détaillé des incidents
      let startY = (doc as any).lastAutoTable.finalY + 20

      // Si multi-parcours, créer une section par parcours
      if (courseIds && courseIds.length > 1) {
        const coursesMap = new Map<string, any[]>()
        filteredIncidents.forEach((inc: any) => {
          const courseName = inc.courses?.name || "N/A"
          if (!coursesMap.has(courseName)) {
            coursesMap.set(courseName, [])
          }
          coursesMap.get(courseName)!.push(inc)
        })

        coursesMap.forEach((incidents, courseName) => {
          if (startY > pageHeight - 50) {
            doc.addPage()
            startY = 20
          }

          doc.setFontSize(16)
          doc.setFont("helvetica", "bold")
          doc.text(`Parcours: ${courseName}`, 20, startY)
          startY += 10

          const tableData = incidents.map((inc: any) => [
            new Date(inc.created_at).toLocaleDateString("fr-FR"),
            `Trou ${inc.hole_number}`,
            inc.category,
            inc.priority,
            inc.status,
            inc.description?.substring(0, 50) || "",
          ])

          autoTable(doc, {
            startY: startY + 5,
            head: [["Date", "Trou", "Catégorie", "Priorité", "Statut", "Description"]],
            body: tableData,
            theme: "striped",
            headStyles: { fillColor: [6, 78, 59] },
            styles: { fontSize: 8 },
            columnStyles: {
              5: { cellWidth: 60 },
            },
          })

          startY = (doc as any).lastAutoTable.finalY + 20
        })
      } else {
        // Un seul parcours ou tous
        if (startY > pageHeight - 50) {
          doc.addPage()
          startY = 20
        }

        doc.setFontSize(16)
        doc.setFont("helvetica", "bold")
        doc.text("Détail des Incidents", 20, startY)

        const tableData = filteredIncidents.map((inc: any) => [
          new Date(inc.created_at).toLocaleDateString("fr-FR"),
          inc.courses?.name || "N/A",
          `Trou ${inc.hole_number}`,
          inc.category,
          inc.priority,
          inc.status,
          inc.description?.substring(0, 50) || "",
        ])

        autoTable(doc, {
          startY: startY + 5,
          head: [["Date", "Parcours", "Trou", "Catégorie", "Priorité", "Statut", "Description"]],
          body: tableData,
          theme: "striped",
          headStyles: { fillColor: [6, 78, 59] },
          styles: { fontSize: 8 },
          columnStyles: {
            6: { cellWidth: 60 },
          },
        })
      }
    }

    // Ajouter les notes internes si demandé (détaillé uniquement)
    if (reportType === "detailed" && includeNotes) {
      const notesIncidents = filteredIncidents.filter((inc: any) => inc.internal_note)
      if (notesIncidents.length > 0) {
        let notesY = (doc as any).lastAutoTable.finalY + 20
        
        if (notesY > pageHeight - 50) {
          doc.addPage()
          notesY = 20
        }

        doc.setFontSize(16)
        doc.setFont("helvetica", "bold")
        doc.text("Notes Internes", 20, notesY)

        notesIncidents.forEach((inc: any, index: number) => {
          if (notesY > pageHeight - 50) {
            doc.addPage()
            notesY = 20
          }

          doc.setFontSize(10)
          doc.setFont("helvetica", "bold")
          doc.text(`Trou ${inc.hole_number} - ${new Date(inc.created_at).toLocaleDateString("fr-FR")}`, 20, notesY + 10)
          
          doc.setFontSize(9)
          doc.setFont("helvetica", "normal")
          const splitNote = doc.splitTextToSize(inc.internal_note || "", pageWidth - 40)
          doc.text(splitNote, 20, notesY + 18)
          
          notesY += 10 + splitNote.length * 5
        })
      }
    }

    // Générer le buffer
    const pdfBuffer = Buffer.from(doc.output("arraybuffer"))

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Rapport_TerrainSync_${new Date().toISOString().split("T")[0]}.pdf"`,
      },
    })
  } catch (error: any) {
    console.error("Erreur lors de la génération du PDF:", error)
    return NextResponse.json({ error: error.message || "Erreur lors de la génération du PDF" }, { status: 500 })
  }
}


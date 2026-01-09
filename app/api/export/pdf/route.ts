import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import sharp from "sharp"

const clubId = "00000000-0000-0000-0000-000000000001"

// Traductions des priorités
const priorityLabels: Record<string, string> = {
  high: "Haute",
  medium: "Moyenne",
  low: "Basse",
  critical: "Critique",
  High: "Haute",
  Medium: "Moyenne",
  Low: "Basse",
  Critical: "Critique",
}

// Traductions des statuts (Résolu / Non résolu uniquement)
const statusLabels: Record<string, string> = {
  Open: "Non résolu",
  In_Progress: "Non résolu",
  Resolved: "Résolu",
  NEW: "Non résolu",
  IN_PROGRESS: "Non résolu",
  RESOLVED: "Résolu",
}

// Couleurs des priorités (RVB pour jsPDF)
const priorityColors: Record<string, [number, number, number]> = {
  high: [220, 38, 38], // Rouge pour Haute
  medium: [249, 115, 22], // Orange pour Moyenne
  low: [107, 114, 128], // Gris pour Basse
  critical: [220, 38, 38], // Rouge pour Critique
  High: [220, 38, 38],
  Medium: [249, 115, 22],
  Low: [107, 114, 128],
  Critical: [220, 38, 38],
}

// Fonction pour traduire la priorité
function translatePriority(priority: string): string {
  return priorityLabels[priority] || priority
}

// Fonction pour traduire le statut (simplification : Résolu / Non résolu)
function translateStatus(status: string): string {
  // Simplification : soit Résolu, soit Non résolu
  if (status === "Resolved" || status === "RESOLVED") {
    return "Résolu"
  }
  return "Non résolu"
}

// Fonction pour obtenir la couleur de la priorité
function getPriorityColor(priority: string): [number, number, number] {
  return priorityColors[priority] || [107, 114, 128] // Gris par défaut
}

// Fonction pour obtenir la couleur du badge de statut
function getStatusColor(status: string): [number, number, number] {
  if (status === "Resolved" || status === "RESOLVED") {
    return [16, 185, 129] // Vert pour résolu
  }
  return [220, 38, 38] // Rouge pour non résolu
}

// Fonction pour ajouter le header sur chaque page
function addHeader(doc: jsPDF, clubName: string, pageWidth: number) {
  // Header avec fond
  doc.setFillColor(6, 78, 59) // Vert golf foncé
  doc.rect(0, 0, pageWidth, 25, "F")
  
  // Logo à gauche (simulé par du texte pour l'instant)
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.text("TerrainSync", 20, 16)
  
  // Nom du Golf au centre
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text(clubName || "Golf Club", pageWidth / 2, 16, { align: "center" })
  
  // RAPPORT D'INTERVENTION à droite
  doc.setFontSize(9)
  doc.setFont("helvetica", "bold")
  doc.text("RAPPORT D'INTERVENTION", pageWidth - 20, 16, { align: "right" })
}

// Fonction pour ajouter le footer sur chaque page
function addFooter(doc: jsPDF, pageWidth: number, pageHeight: number, currentPage: number, totalPages: number) {
  const footerY = pageHeight - 15
  
  // Ligne de séparation
  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.3)
  doc.line(20, footerY - 5, pageWidth - 20, footerY - 5)
  
  // Numérotation des pages
  doc.setTextColor(100, 100, 100)
  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  doc.text(`Page ${currentPage} sur ${totalPages}`, pageWidth / 2, footerY, { align: "center" })
  
  // Date d'exportation
  const exportDate = new Date().toLocaleDateString("fr-FR", { 
    day: "2-digit", 
    month: "long", 
    year: "numeric" 
  })
  doc.text(`Exporté le ${exportDate}`, pageWidth - 20, footerY, { align: "right" })
}

// Fonction pour dessiner un badge de couleur
function drawBadge(
  doc: jsPDF, 
  x: number, 
  y: number, 
  text: string, 
  color: [number, number, number], 
  width: number = 40,
  height: number = 8
) {
  // Fond du badge avec coins arrondis (approximation)
  doc.setFillColor(color[0], color[1], color[2])
  doc.setDrawColor(color[0], color[1], color[2])
  doc.roundedRect(x, y, width, height, 2, 2, "F")
  
  // Texte blanc au centre
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(7)
  doc.setFont("helvetica", "bold")
  const textWidth = doc.getTextWidth(text)
  doc.text(text, x + width / 2, y + height / 2 + 2, { align: "center" })
  
  return { width, height }
}

// Fonction pour charger et convertir une image en Base64 redimensionnée
async function loadAndResizeImage(url: string): Promise<string> {
  try {
    // Télécharger l'image
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Redimensionner à 300x300px en gardant les proportions (fit inside)
    const resizedBuffer = await sharp(buffer)
      .resize(300, 300, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 85 })
      .toBuffer()

    // Convertir en Base64
    const base64 = resizedBuffer.toString('base64')
    return `data:image/jpeg;base64,${base64}`
  } catch (error) {
    console.error(`Error loading image ${url}:`, error)
    // Retourner une image placeholder si l'image ne peut pas être chargée
    return ""
  }
}

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
      // Inclure tous les statuts non résolus dans "Open"
      if (includeOpen) statusFilter.push("Open", "In_Progress", "NEW", "IN_PROGRESS")
      if (includeResolved) statusFilter.push("Resolved")
      
      if (statusFilter.length > 0) {
        filteredIncidents = filteredIncidents.filter((inc: any) =>
          statusFilter.includes(inc.status)
        )
      }
    }

    // Charger toutes les images en Base64 avant de générer le PDF
    const imagesMap = new Map<string, string>()
    if (includePhotos && reportType === "detailed") {
      const incidentsWithPhotos = filteredIncidents.filter((inc: any) => inc.photo_url)
      
      // Charger toutes les images en parallèle
      await Promise.all(
        incidentsWithPhotos.map(async (inc: any) => {
          try {
            const base64Image = await loadAndResizeImage(inc.photo_url)
            if (base64Image) {
              imagesMap.set(inc.id, base64Image)
            }
          } catch (error) {
            console.error(`Failed to load image for incident ${inc.id}:`, error)
          }
        })
      )
    }

    // Créer le PDF
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()

    // Récupérer les parcours pour les graphiques
    const { data: coursesData } = await supabase
      .from("courses")
      .select("id, name")
      .eq("club_id", clubId)

    // Compter les pages totales (approximation)
    let totalPages = 3 // Page de garde + Synthèse + au moins 1 page incidents
    const incidentsPerPage = 2 // Environ 2 incidents par page avec photos
    if (reportType === "detailed") {
      totalPages += Math.ceil(filteredIncidents.length / incidentsPerPage)
    }

    // ========== PAGE 1: PAGE DE GARDE AVEC GRAPHIQUES EN GRAND FORMAT ==========
    // Header
    addHeader(doc, clubName || "Golf Club", pageWidth)
    
    // Titre principal
    doc.setFillColor(248, 250, 252)
    doc.rect(0, 25, pageWidth, 50, "F")
    
    doc.setTextColor(6, 78, 59)
    doc.setFontSize(28)
    doc.setFont("helvetica", "bold")
    doc.text("Rapport d'Intervention", pageWidth / 2, 45, { align: "center" })
    
    doc.setFontSize(12)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(100, 100, 100)
    const dateRange = `${new Date(startDate).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })} - ${new Date(endDate).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}`
    doc.text(`Période: ${dateRange}`, pageWidth / 2, 58, { align: "center" })

    let graphY = 85

    // 1. Répartition par Type - GRAND FORMAT
    doc.setFontSize(16)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(30, 41, 59)
    doc.text("Répartition par Type d'Incident", pageWidth / 2, graphY, { align: "center" })
    graphY += 10

    const categoryCounts: Record<string, number> = {}
    filteredIncidents.forEach((inc: any) => {
      categoryCounts[inc.category] = (categoryCounts[inc.category] || 0) + 1
    })
    
    const totalCategory = Object.values(categoryCounts).reduce((a, b) => a + b, 0)
    const categoryTableData = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => [
        name,
        count.toString(),
        `${((count / totalCategory) * 100).toFixed(1)}%`
      ])

    autoTable(doc, {
      startY: graphY,
      head: [["Type d'incident", "Nombre", "Pourcentage"]],
      body: categoryTableData,
      theme: "striped",
      headStyles: { 
        fillColor: [6, 78, 59],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      styles: {
        fontSize: 12,
      },
      columnStyles: {
        0: { cellWidth: pageWidth * 0.4 },
        1: { cellWidth: pageWidth * 0.25, halign: "center" },
        2: { cellWidth: pageWidth * 0.25, halign: "center" },
      },
    })

    graphY = (doc as any).lastAutoTable.finalY + 20

    // 2. Charge par Parcours - GRAND FORMAT
    doc.setFontSize(16)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(30, 41, 59)
    doc.text("Charge par Parcours", pageWidth / 2, graphY, { align: "center" })
    graphY += 10

    const courseCounts: Record<string, number> = {}
    filteredIncidents.forEach((inc: any) => {
      const courseName = inc.courses?.name || "Inconnu"
      courseCounts[courseName] = (courseCounts[courseName] || 0) + 1
    })

    const courseTableData = Object.entries(courseCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => [name, count.toString()])

    autoTable(doc, {
      startY: graphY,
      head: [["Parcours", "Nombre d'incidents"]],
      body: courseTableData,
      theme: "striped",
      headStyles: { 
        fillColor: [6, 78, 59],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      styles: {
        fontSize: 12,
      },
      columnStyles: {
        0: { cellWidth: pageWidth * 0.5 },
        1: { cellWidth: pageWidth * 0.4, halign: "center" },
      },
    })

    graphY = (doc as any).lastAutoTable.finalY + 20

    // 3. Activité sur 30 derniers jours - GRAND FORMAT
    doc.setFontSize(16)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(30, 41, 59)
    doc.text("Activité des 30 derniers jours", pageWidth / 2, graphY, { align: "center" })
    graphY += 10

    const today = new Date()
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(today.getDate() - 30)
    
    const activityCounts: Record<string, number> = {}
    filteredIncidents.forEach((inc: any) => {
      const incDate = new Date(inc.created_at).toISOString().split("T")[0]
      if (incDate >= thirtyDaysAgo.toISOString().split("T")[0]) {
        activityCounts[incDate] = (activityCounts[incDate] || 0) + 1
      }
    })

    // Grouper par semaine pour plus de lisibilité
    const weeklyData: Record<string, number> = {}
    Object.entries(activityCounts).forEach(([date, count]) => {
      const d = new Date(date)
      const weekStart = new Date(d)
      weekStart.setDate(d.getDate() - d.getDay())
      const weekKey = `Semaine du ${weekStart.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}`
      weeklyData[weekKey] = (weeklyData[weekKey] || 0) + count
    })

    const activityTableData = Object.entries(weeklyData)
      .sort((a, b) => {
        const dateA = new Date(a[0].replace("Semaine du ", "").split("/").reverse().join("-"))
        const dateB = new Date(b[0].replace("Semaine du ", "").split("/").reverse().join("-"))
        return dateA.getTime() - dateB.getTime()
      })
      .map(([week, count]) => [week, count.toString()])

    if (activityTableData.length > 0) {
      autoTable(doc, {
        startY: graphY,
        head: [["Période", "Nombre de signalements"]],
        body: activityTableData,
        theme: "striped",
        headStyles: { 
          fillColor: [6, 78, 59],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        styles: {
          fontSize: 12,
        },
        columnStyles: {
          0: { cellWidth: pageWidth * 0.5 },
          1: { cellWidth: pageWidth * 0.4, halign: "center" },
        },
      })
    }

    // Footer page 1
    addFooter(doc, pageWidth, pageHeight, 1, totalPages)

    // Grouper par parcours si multi-parcours
    const courseIds = courseId && courseId !== "all" && courseId.includes(",") 
      ? courseId.split(",") 
      : courseId && courseId !== "all" 
        ? [courseId] 
        : null
    
    // ========== PAGE 2+: FICHES INCIDENTS PROFESSIONNELLES ==========
    if (reportType === "detailed") {
      let currentPage = 2
      
      // Fonction pour dessiner une fiche incident
      const drawIncidentCard = (inc: any, y: number): number => {
        const cardHeight = 80 // Hauteur de chaque carte
        const imageWidth = 60 // Largeur de l'image (format 4:3)
        const imageHeight = 45 // Hauteur de l'image
        const infoX = 85 // Position X des infos (après l'image + marge)
        
        // Fond de la carte avec bordure subtile
        doc.setDrawColor(220, 220, 220)
        doc.setFillColor(255, 255, 255)
        doc.setLineWidth(0.3)
        doc.roundedRect(20, y, pageWidth - 40, cardHeight, 2, 2, "FD")

        // Image à gauche (format 4:3 avec coins arrondis)
        const imageBase64 = imagesMap.get(inc.id)
        if (imageBase64 && includePhotos) {
          try {
            // Cadre pour l'image avec coins arrondis (approximation)
            doc.setFillColor(248, 250, 252)
            doc.roundedRect(25, y + 5, imageWidth, imageHeight, 3, 3, "F")
            
            // Image (ratio 4:3)
            doc.addImage(imageBase64, 'JPEG', 27, y + 7, imageWidth - 4, imageHeight - 4)
          } catch (error) {
            // Placeholder si erreur
            doc.setFillColor(240, 240, 240)
            doc.roundedRect(25, y + 5, imageWidth, imageHeight, 3, 3, "F")
            doc.setTextColor(150, 150, 150)
            doc.setFontSize(8)
            doc.text("Photo", 25 + imageWidth / 2, y + 5 + imageHeight / 2, { align: "center" })
          }
        } else if (includePhotos) {
          // Cadre vide
          doc.setFillColor(248, 250, 252)
          doc.roundedRect(25, y + 5, imageWidth, imageHeight, 3, 3, "F")
          doc.setDrawColor(200, 200, 200)
          doc.setLineWidth(0.5)
          doc.roundedRect(25, y + 5, imageWidth, imageHeight, 3, 3, "D")
          doc.setTextColor(180, 180, 180)
          doc.setFontSize(8)
          doc.text("Aucune photo", 25 + imageWidth / 2, y + 5 + imageHeight / 2, { align: "center" })
        }

        // Informations à droite
        let infoY = y + 8

        // Parcours
        doc.setTextColor(100, 100, 100)
        doc.setFontSize(7)
        doc.setFont("helvetica", "normal")
        doc.text("Parcours:", infoX, infoY)
        doc.setTextColor(30, 41, 59)
        doc.setFontSize(9)
        doc.setFont("helvetica", "bold")
        doc.text(inc.courses?.name || "N/A", infoX + 25, infoY)
        infoY += 7

        // Numéro de trou
        doc.setTextColor(100, 100, 100)
        doc.setFontSize(7)
        doc.setFont("helvetica", "normal")
        doc.text("Trou:", infoX, infoY)
        doc.setTextColor(30, 41, 59)
        doc.setFontSize(11)
        doc.setFont("helvetica", "bold")
        doc.text(`${inc.hole_number}`, infoX + 25, infoY)
        infoY += 7

        // Type d'incident
        doc.setTextColor(100, 100, 100)
        doc.setFontSize(7)
        doc.setFont("helvetica", "normal")
        doc.text("Type:", infoX, infoY)
        doc.setTextColor(30, 41, 59)
        doc.setFontSize(9)
        doc.setFont("helvetica", "normal")
        doc.text(inc.category, infoX + 25, infoY)
        infoY += 7

        // Badges Priorité et Statut
        const priorityColor = getPriorityColor(inc.priority)
        const priorityText = translatePriority(inc.priority)
        drawBadge(doc, infoX, infoY, priorityText, priorityColor, 40, 6)
        
        const statusColor = getStatusColor(inc.status)
        const statusText = translateStatus(inc.status)
        drawBadge(doc, infoX + 45, infoY, statusText, statusColor, 40, 6)
        infoY += 10

        // Date/Heure
        doc.setTextColor(100, 100, 100)
        doc.setFontSize(7)
        doc.setFont("helvetica", "normal")
        const dateTime = new Date(inc.created_at)
        const dateStr = dateTime.toLocaleDateString("fr-FR", { 
          day: "2-digit", 
          month: "2-digit", 
          year: "numeric" 
        })
        const timeStr = dateTime.toLocaleTimeString("fr-FR", { 
          hour: "2-digit", 
          minute: "2-digit" 
        })
        doc.text(`${dateStr} à ${timeStr}`, infoX, infoY)
        infoY += 6

        // Description (tronquée si trop longue)
        if (inc.description) {
          doc.setTextColor(100, 100, 100)
          doc.setFontSize(7)
          doc.setFont("helvetica", "normal")
          doc.text("Description:", infoX, infoY)
          
          const maxDescWidth = pageWidth - infoX - 25
          const descText = doc.splitTextToSize(inc.description, maxDescWidth)
          const displayedDesc = descText.slice(0, 2) // Max 2 lignes
          doc.setTextColor(30, 41, 59)
          doc.setFontSize(8)
          doc.text(displayedDesc, infoX, infoY + 4)
        }

        // Ligne de séparation subtile en bas
        doc.setDrawColor(230, 230, 230)
        doc.setLineWidth(0.2)
        doc.line(20, y + cardHeight - 1, pageWidth - 20, y + cardHeight - 1)

        return cardHeight + 5 // Retourner la hauteur utilisée + espacement
      }

      // Nouvelle page pour les fiches incidents
      doc.addPage()
      addHeader(doc, clubName || "Golf Club", pageWidth)
      
      doc.setFontSize(18)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(30, 41, 59)
      doc.text("Fiches d'Intervention", pageWidth / 2, 45, { align: "center" })
      
      let startY = 55
      currentPage++

      // Dessiner chaque incident comme une fiche professionnelle
      filteredIncidents.forEach((inc: any, index: number) => {
        // Vérifier si on a besoin d'une nouvelle page
        if (startY > pageHeight - 100) {
          // Footer de la page actuelle
          addFooter(doc, pageWidth, pageHeight, currentPage, totalPages)
          
          // Nouvelle page
          doc.addPage()
          currentPage++
          addHeader(doc, clubName || "Golf Club", pageWidth)
          startY = 55
        }

        // Dessiner la fiche incident
        const cardHeight = drawIncidentCard(inc, startY)
        startY += cardHeight
      })

      // Footer de la dernière page
      addFooter(doc, pageWidth, pageHeight, currentPage, totalPages)
    }

    // Recalculer le nombre total de pages réel
    totalPages = doc.getNumberOfPages()
    
    // Mettre à jour les numéros de page sur toutes les pages
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      const footerY = pageHeight - 15
      
      // Effacer l'ancien footer
      doc.setFillColor(255, 255, 255)
      doc.rect(0, footerY - 10, pageWidth, 15, "F")
      
      // Redessiner le footer avec le bon numéro
      addFooter(doc, pageWidth, pageHeight, i, totalPages)
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


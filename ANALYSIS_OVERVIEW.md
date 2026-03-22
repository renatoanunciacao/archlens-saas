# ArchLens Analysis Pages & Components Overview

## 1. FILE STRUCTURE & ROUTES

### Analysis Pages
```
app/dashboard/analyses/
├── page.tsx                          # Analysis List Page
├── [id]/
│   └── page.tsx                      # Analysis Detail Page
└── html/
    └── [id]/
        └── page.tsx                  # HTML Report Viewer Page
```

### API Routes
```
app/api/analyses/
├── route.ts                          # POST - Create/Save analysis
├── run/
│   └── route.ts                      # POST - Execute analysis on repository
├── import/
│   └── route.ts                      # POST - Import JSON report files
└── html/
    └── route.ts                      # GET - Generate & serve HTML report
```

### Related Components
```
app/components/
├── run-analysis-button.tsx           # Trigger analysis execution
├── html-report-frame.tsx             # Iframe wrapper for HTML reports
├── html-report-download.tsx          # Download button for HTML reports
├── import-json-form.tsx              # Form to import JSON analyses
├── project-page-client.tsx           # Project page client wrapper
├── modals/
│   └── analysis-modal.tsx            # Modal to start analysis
└── charts/
    └── health-trend-chart.tsx        # Health score trend visualization
```

---

## 2. DATABASE SCHEMA (Analyses Table)

### Table: `analyses`
```typescript
{
  id: UUID (primary key)
  projectId: UUID (foreign key to projects)
  structuralHealthScore: INTEGER (0-100)       // Main health score
  structuralHealthGrade: TEXT                  // Grade: "A", "B", "C", etc
  architectureFitScore: INTEGER (nullable)     // Optional architecture fit
  architectureFitStatus: TEXT (nullable)       // Optional fit status
  reportJson: JSONB                            // Complete report data
  createdAt: TIMESTAMP (with timezone)         // Analysis creation date
}
```

### Report JSON Structure (reportJson field)
```typescript
{
  // Core Metrics
  arch_health_score: number                    // 0-100
  arch_health_status: string                   // Grade ("A", "B", "C", etc)
  architecture_fit_score?: number              // Optional
  architecture_fit_status?: string             // Optional
  
  // Analysis Details
  files_analyzed?: number                      // Total files analyzed
  edges?: number                               // Total dependencies
  cycles_count?: number                        // Number of circular dependencies
  recommended_profile?: string                 // Recommended architecture pattern
  
  // Dependency Analysis
  top_fan_in?: Array<{                         // Critical modules (many depend on them)
    module: string
    count: number
  }>
  
  top_fan_out?: Array<{                        // Unstable modules (depend on many)
    module: string
    count: number
  }>
  
  danger_hotspots?: Array<{                    // High coupling areas
    module: string
    in: number                                 // Number of incoming dependencies
    out: number                                // Number of outgoing dependencies
  }>
}
```

---

## 3. ANALYSIS LIST PAGE

**File:** [app/dashboard/analyses/page.tsx](app/dashboard/analyses/page.tsx)

### Features
- **Authentication:** Server-side session check, redirects to `/login` if not authenticated
- **Data Fetch:** Retrieves user's projects and their 5 latest analyses
- **Display:** Grid of analysis cards (3 columns on lg screens)

### UI Components
```
Header Section
├── Back button → /dashboard
├── Title: "📊 Análises"
└── Description text

Latest Analyses Section
├── Latest 5 analyses in grid
└── Each Card Shows:
    ├── Project ID (first 8 chars)
    ├── Analysis date (pt-BR format)
    ├── Health score (large, color-coded)
    ├── Health grade
    ├── Files analyzed
    └── Cycles count (red if > 0, else green)

Top Problems Section (from first latest analysis)
├── 🔄 Circular Dependencies card
│   └── Cycles count + warning message
└── 🔥 Coupling Hotspots card
    └── Top 3 hotspots with in/out arrows

Import JSON Section
└── ImportJsonForm component
```

### Color Coding
```typescript
const getHealthColor = (score: number) => {
  if (score >= 80) return "text-green-400"     // Excellent
  if (score >= 60) return "text-yellow-400"    // Good
  return "text-red-400"                        // Needs work
}
```

---

## 4. ANALYSIS DETAIL PAGE

**File:** [app/dashboard/analyses/[id]/page.tsx](app/dashboard/analyses/[id]/page.tsx)

### Features
- **Authentication:** Server-side session check
- **Authorization:** Verifies project belongs to current user
- **Data Fetch:** Retrieves single analysis with associated project data
- **Error Handling:** Shows error card if analysis/project not found

### UI Layout (3-column grid on lg screens)

```
Header
├── Back button → /dashboard/analyses
├── Project name (h1)
├── Analysis date (pt-BR)
└── Action buttons:
    ├── "📄 Ver HTML" button → /dashboard/analyses/html/[id]
    └── Large health score display

Left Column (1 col)
├── 📈 Architecture Health Card
│   ├── Score (e.g., "82/100")
│   ├── Progress bar (color-coded)
│   ├── Status
│   ├── Files Analyzed
│   ├── Dependencies (edges)
│   └── Recommended Profile

Right Section (2 cols) - Multiple Cards
├── 🔄 Cycles Detected
│   └── Count + advisory message
├── 🔥 Coupling Hotspots
│   └── Count of critical modules
├── ↙ Top Fan-In (Modules Critically Needed)
│   └── List: Module name + count
├── ↗ Top Fan-Out (Unstable Modules)
│   └── List: Module name + count
└── 🚨 Hotspots Críticos (if any)
    └── Module + in↙/out↗ indicators
```

### Data Display Logic
- Uses `getHealthColor()` and `getHealthBgColor()` for theming
- Conditional rendering based on available report data
- Score-based visual feedback (green ≥80, yellow ≥60, red <60)

---

## 5. HTML REPORT VIEWER PAGE

**File:** [app/dashboard/analyses/html/[id]/page.tsx](app/dashboard/analyses/html/[id]/page.tsx)

### Layout
```
Header Bar
├── Back button → /dashboard/analyses
├── Title: "📊 Relatório HTML"
└── Download button (HtmlReportDownload component)

Main Content Area
└── Full-height iframe
    └── HtmlReportFrame component
```

### Components Used

#### HtmlReportFrame
```typescript
// "use client"
export function HtmlReportFrame({ analysisId }: { analysisId: string }) {
  return (
    <iframe
      src={`/api/analyses/html?id=${analysisId}`}
      className="w-full h-full border-none"
      title="ArchLens HTML Report"
      sandbox="allow-same-origin allow-scripts"
    />
  );
}
```

#### HtmlReportDownload
```typescript
// "use client"
// On click:
// 1. Fetches HTML from /api/analyses/html?id={analysisId}
// 2. Creates blob with type "text/html"
// 3. Triggers download: archlens-report-{id-first-8-chars}.html
```

---

## 6. API ROUTES ANALYSIS

### POST /api/analyses/route.ts
**Purpose:** Save analysis to database (called by run or import endpoints)

```typescript
Body: {
  projectId: string (required)
  structuralHealthScore: number (required)
  structuralHealthGrade: string (required)
  architectureFitScore?: number
  architectureFitStatus?: string
  reportJson: object (required)
}

Response: { analysis: AnalysisRecord, status: 201 }
```

### POST /api/analyses/run/route.ts
**Purpose:** Execute ArchLens on a repository and save results

**Flow:**
1. Session validation (user must be authenticated)
2. Project verification (must belong to user)
3. Usage limit check (ongoing month analyses)
4. Create temporary directory
5. Git clone repository (2-minute timeout)
6. Execute ArchLens CLI on the repo
7. Parse JSON output and save to DB
8. Cleanup temp files
9. Return analysis ID

**Key Variables:**
- `tempRepoPath`: Temporary directory for cloned repo
- `archLensOutput`: JSON output from ArchLens command
- Timeout: Clone (120s), Analysis (depends on project size)

### POST /api/analyses/import/route.ts
**Purpose:** Import pre-generated JSON analysis report

**Flow:**
1. Session validation
2. Extract file and projectId from FormData
3. Verify project ownership
4. Parse JSON file
5. Extract fields:
   - `arch_health_score` → structuralHealthScore
   - `arch_health_status` → structuralHealthGrade
   - `architecture_fit_score` → architectureFitScore
   - `architecture_fit_status` → architectureFitStatus
6. Save to database

**Error Handling:** Returns 400 for invalid JSON, 404 for project not found

### GET /api/analyses/html/route.ts
**Purpose:** Generate and serve styled HTML report

**Flow:**
1. Get analysis ID from query params
2. Verify user authorization (project belongs to user)
3. Execute ArchLens to generate HTML: `archlens report html --json "{reportJson}"`
4. Wrap output with premium styling 
5. Return as content-type text/html

**Styling Features:**
- Gradient header: blue → cyan → sky blue
- Dark/light mode support
- Modern CSS with backdrop blur
- Responsive layout
- Animated background elements

---

## 7. RELATED COMPONENTS

### RunAnalysisButton.tsx
```typescript
// Triggers /api/analyses/run
// Loading state: "🔄 Analizando..."
// On success: redirects to /dashboard/analyses/html/{analysisId}
// On error: displays error message
```

### AnalysisModal.tsx
```typescript
// Modal triggered from project page
// Displays project name
// Submits to /api/analyses/run
// On success: closes modal, redirects to analyses list
```

### ProjectPageClient.tsx
```typescript
// Wraps analysis modal trigger
// "📊 Analisar Arquitetura" button
// On success: refreshes page, redirects to /dashboard/analyses
```

### ImportJsonForm.tsx
```typescript
// Form for importing JSON
// Selector for target project
// File input for JSON file
// POST to /api/analyses/import
// Success/error feedback
// Instructions: archlens analyze . --format json --output report.json
```

### HealthTrendChart.tsx
```typescript
// Recharts line chart
// Shows score evolution over time
// Statistics: latest, best score
// Requires data: Array<{ date, score, grade }>
```

---

## 8. DATA FLOW ARCHITECTURE

### Analysis Execution Flow
```
User clicks "📊 Analisar Arquitetura"
    ↓
AnalysisModal opens
    ↓
User confirms
    ↓
POST /api/analyses/run
    ├─ Clone repo
    ├─ Run ArchLens CLI
    ├─ Parse JSON output
    └─ Save to database
    ↓
Redirect to /dashboard/analyses/html/[id]
    ↓
HtmlReportFrame renders iframe
    ↓
iframe src="/api/analyses/html?id=[id]"
    ├─ Generate HTML from report
    ├─ Apply premium styling
    └─ Display in browser
```

### Analysis Import Flow
```
User on /dashboard/analyses
    ↓
ImportJsonForm: Select Project + Choose JSON File
    ↓
POST /api/analyses/import
    ├─ Parse JSON
    ├─ Extract metrics
    └─ Save to database
    ↓
Success message
    ↓
Redirect to /dashboard/analyses
```

### Analysis View Flow
```
/dashboard/analyses (List)
    ↓ Click card
/dashboard/analyses/[id] (Detail)
    ↓ Click "📄 Ver HTML"
/dashboard/analyses/html/[id] (HTML Report)
```

---

## 9. KEY CONCEPTS & PATTERNS

### Health Score Calculation
- **Score:** 0-100 numeric value
- **Grade:** Letter grade (A, B, C, etc) based on score
- **Visual:** Color-coded (green ≥80, yellow ≥60, red <60)

### Dependency Metrics
- **Fan-In:** Modules that depend on a given module (critical)
- **Fan-Out:** Dependencies a module has (stability concern)
- **Cycles:** Circular dependencies (should be 0)
- **Hotspots:** Modules with high coupling (in + out)

### Architecture Fit
- Optional second-tier analysis
- Examines how well code matches recommended pattern
- Shows both score and status

### Report Structure
- **Lightweight:** Only essential metrics stored
- **Extensible:** reportJson as JSONB allows new fields
- **Queryable:** Can analyze report data in SQL if needed

---

## 10. CURRENT UI APPROACH

### Design System
- **Framework:** Next.js + Tailwind CSS
- **Theme:** Dark-first with light mode support
- **Colors:** Blue/cyan gradients, semantic status colors
- **Typography:** Inter system font stack

### Components Pattern
- **Server Components:** Pages, data fetching
- **Client Components:** Forms, modals, interactive elements
- **Hybrid:** Modal triggers on server components

### Responsive Design
- **Mobile:** Single column, full width
- **Tablet (md):** 2 columns
- **Desktop (lg):** 3 columns
- **Grid-based:** Consistent spacing and alignment

### Accessibility
- Semantic HTML
- Color-blind friendly alerts (icons + text)
- Alt text in emojis (descriptive)
- Keyboard navigation in modals

### Loading States
- Button disabled state during requests
- Text changes (e.g., "🔄 Analizando...")
- Error messages displayed inline

---

## 11. NOTABLE FEATURES

### Security
- ✅ Server-side session validation on all pages
- ✅ Authorization checks (project ownership)
- ✅ No sensitive data in client components

### Performance
- ✅ Server-side rendering for lists/details
- ✅ Efficient database queries
- ✅ Lazy loading with modals

### User Experience
- ✅ Color-coded health scores
- ✅ Instant feedback on actions
- ✅ Multiple analysis access methods (detail, HTML, import)
- ✅ Dark mode support throughout

### Error Handling
- ✅ User-friendly error messages
- ✅ Graceful fallbacks (show error card, not crash)
- ✅ Form validation before submission


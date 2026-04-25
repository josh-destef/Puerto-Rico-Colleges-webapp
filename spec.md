# Specification: Puerto Rico Higher Education 3D Dashboard

## Project Purpose
An interactive 3D geospatial dashboard visualizing the higher education landscape of Puerto Rico. [cite_start]The application uses CesiumJS and Google Photorealistic 3D Tiles to provide a high-fidelity, data-driven exploration of campus locations, institutional health (active vs. closed), and academic offerings[cite: 1, 43, 63].

---

## Data Architecture
[cite_start]The application is powered by a single GeoJSON file: `pr_colleges_v4_final.geojson`[cite: 1, 237].

### Data Structure
Each feature in the collection represents a campus with the following key property groups:
* [cite_start]**Identification**: `name`, `city`, `zip`, `website`, and IPEDS `id`[cite: 2, 7, 19, 25].
* [cite_start]**Classification**: `ownership` (Public, Private Non-Profit, Private For-Profit), `level` (2-year or 4-year), and `accreditor`[cite: 2, 8, 20, 25].
* [cite_start]**Status**: `active` (boolean) and `enrollment` (integer)[cite: 3, 8, 20, 26].
* [cite_start]**Relationship**: `is_main_campus` (boolean) and `parent_id` (used to link branches to main campuses)[cite: 2, 30, 100, 109].
* [cite_start]**Academic Flags**: A `flags` object containing booleans for `has_nursing`, `has_engineering`, `has_humanities`, `has_business`, and `has_grad`[cite: 4, 16, 22, 28].
* [cite_start]**Program Details**: A `majors` object containing descriptive strings for various disciplines (Nursing, Engineering, Humanities, Social Sciences, Bench Sciences, Business, Pre-Law, Miscellaneous, and Grad Programs)[cite: 3, 9, 21, 26].
* [cite_start]**Performance Metrics**: `admission_rate`, `completion_rate`, `tuition_in_state`, `avg_net_price`, `median_debt`, and `median_earnings_10yr`[cite: 6, 17, 47, 61].

---

## Map & Visual Encoding

### 3D Environment
* [cite_start]**Engine**: CesiumJS with `Cesium.createGooglePhotorealistic3DTileset()` for the base layer[cite: 1].
* [cite_start]**Default View**: On initialization, the camera flies to Puerto Rico: `{ longitude: -66.5, latitude: 18.22, height: 120000 }` with a -35° pitch[cite: 1].
* [cite_start]**Atmosphere**: Enable terrain, global lighting, and atmosphere effects to enhance the 3D depth of Google's building meshes[cite: 1].

### Campus Marker Logic
Campuses are rendered using the Cesium Entity API (Billboards and Points) with dynamic styling based on GeoJSON properties:
* **Color (Ownership)**:
    * [cite_start]Public: `#3B82F6` (Blue)[cite: 1, 25].
    * [cite_start]Private Non-Profit: `#10B981` (Green)[cite: 1, 2, 7, 19].
    * [cite_start]Private For-Profit: `#F59E0B` (Amber)[cite: 1, 30, 43].
    * [cite_start]Inactive/Closed: `#6B7280` (Gray) at 50% opacity[cite: 1, 3].
* **Scale (Enrollment)**:
    * [cite_start]< 1,000 students: 14px[cite: 1, 20].
    * [cite_start]1,000–3,000: 20px[cite: 1, 8, 26, 30].
    * [cite_start]3,000–7,000: 28px[cite: 1, 64, 137, 162].
    * [cite_start]7,000–15,000: 36px[cite: 1, 90, 149, 253].
    * [cite_start]> 15,000: 44px[cite: 1].
* **Network Visualization**: 
    * [cite_start]Branch campuses (where `is_branch: true`) are rendered with a dashed ring outline[cite: 1, 108, 118, 173].
    * Dynamic polylines connect branch campuses to their parent campus based on matching `parent_id` to a parent's `id`. [cite_start]Lines are white, 1.5px width, and 30% opacity[cite: 1, 100, 109, 131, 148].

---

## UI Components

### Left Sidebar (Filters & Systems)
* **Active Count**: A live-updating badge showing visible institutions.
* [cite_start]**Filter Group 1 (Category)**: Checkboxes for Ownership and Toggles for Academic Programs (Nursing, Engineering, etc.)[cite: 1].
* [cite_start]**Filter Group 2 (Logic)**: Toggle for "Active Only" (hides closed schools like AUPR) and "Main Campuses Only"[cite: 1, 3].
* **System Navigator**: Collapsible list of university systems (UPR, Inter, UAGM, PUCPR). [cite_start]Clicking a system title executes a `flyTo` command to a bounding sphere containing all campuses in that system[cite: 1, 90, 100, 137, 219].

### Bottom Bar (Global Aggregates)
* [cite_start]Displays live-calculated averages and totals for the currently filtered set: Total Enrollment, Average In-State Tuition, Average Net Price, and Average 10-Year Earnings[cite: 1].

### Right Info Panel (Institutional Detail)
Triggered by clicking a marker.
* [cite_start]**Primary Info**: Name, Website Link, Ownership type, and Accreditor[cite: 2, 8, 20].
* [cite_start]**Program Badges**: Colored pill-style icons representing each boolean flag set to `true`[cite: 4, 16, 22].
* [cite_start]**Stats Grid**: 2-column layout showing enrollment, tuition, debt, and earnings[cite: 17, 47, 61, 79].
* **Majors Scrollable Area**: A dedicated vertical scroll container displaying the full text for each field in the `majors` object. [cite_start]If a field is null, it is hidden; if present, it shows the category (e.g., "Engineering") and the full descriptive string[cite: 4, 9, 26, 31].

---

## Technical Stack & Architecture

### Core Stack
* **Framework**: React + TypeScript + Vite.
* **Cesium Config**: Use `vite-plugin-cesium` for automatic asset handling.
* **Data Management**: `@tanstack/react-query` for the initial GeoJSON fetch and caching.
* **State Management**: `zustand` for managing filter state, the "selected" campus ID, and current map view mode.
* **Styling**: Standard CSS with a dark-mode theme: Deep Navy (`#0f172a`) and Slate (`#1e293b`).

### Project Structure
    /src
      /assets          (Images, PR outline SVG)
      /components
        /globe         (Cesium Viewer initialization and Entity logic)
        /ui            (Sidebar, BottomBar, InfoPanel)
      /hooks           (useInstitutions - filters and aggregates logic)
      /store           (Zustand state for filters/selection)
      /types           (TypeScript interfaces for the GeoJSON schema)
      App.tsx          (Main layout)
      main.tsx         (React Query Provider setup)

### Implementation Constraints
* **No React.StrictMode**: Cesium cannot handle the double-initialization.
* **Entity Management**: Store a reference to the Cesium `Viewer`. Use a `useEffect` to iterate through entities and set `.show` based on the filter state stored in Zustand.
* **Ion Token**: Loaded from `import.meta.env.VITE_CESIUM_ION_TOKEN`.
import { SourceFunctionalCompetency, SourceCompetencyLevel } from '../types/competency';

export const TEKLA_SOURCE_FUNCTIONAL_COMPETENCIES: SourceFunctionalCompetency[] = [
  // =========================================================================
  // 1-20: Currently Configured in V1.0 Framework
  // =========================================================================
  {
    id: 'src-func-01',
    code: 'FUNC-01',
    name: 'Primary Structural Member Modeling',
    description: '3D modeling of structural columns, beams, girders, trusses, portal frames, grids, elevation control, and member work points.',
    sourceDocument: 'Tekla - Functional Competencies Behaviour Indicators (Ref: SEC-MOD-01)',
    isConfiguredInApp: true,
    appCode: 'FUNC-01',
    sourceCategory: 'Core Modeling',
    levels: [
      { level: 1, levelName: 'Novice', behaviorDescription: 'Models standard orthogonal columns and beams with correct profile names, material grades, and grid alignments under guidance.' },
      { level: 2, levelName: 'Developing', behaviorDescription: 'Independently models sloping beams, cranked members, stepped columns, and standard trusses adhering to project coordinates.' },
      { level: 3, levelName: 'Proficient', behaviorDescription: 'Expertly models complex 3D curved geometry, complex industrial trusses, heavy transfer girders, and multi-tier portal frameworks.' },
      { level: 4, levelName: 'Expert', behaviorDescription: 'Establishes global project coordinate systems, multi-model shared coordinates, complex stadium/industrial structures, and audits global geometry.' }
    ]
  },
  {
    id: 'src-func-02',
    code: 'FUNC-02',
    name: 'Connection Modeling & Parameter Control',
    description: 'Application and parametric tuning of shear tabs, clip angles, moment connections, base plates, splice joints, and custom joints.',
    sourceDocument: 'Tekla - Functional Competencies Behaviour Indicators (Ref: SEC-MOD-02)',
    isConfiguredInApp: true,
    appCode: 'FUNC-02',
    sourceCategory: 'Connections & Framing',
    levels: [
      { level: 1, levelName: 'Novice', behaviorDescription: 'Applies standard Tekla system components (e.g. 144, 142, 1042) for simple orthogonal connections with supervisor verification.' },
      { level: 2, levelName: 'Developing', behaviorDescription: 'Adjusts connection parameters, plate sizes, edge distances, weld sizes, and bolt patterns to match design connection tables accurately.' },
      { level: 3, levelName: 'Proficient', behaviorDescription: 'Models heavy moment connections, complex multi-planar skewed joints, braced frame gusset plates, and heavy column splices independently.' },
      { level: 4, levelName: 'Expert', behaviorDescription: 'Standardizes connection selection logic across projects; develops intelligent parametric custom connection components with automatic formulas.' }
    ]
  },
  {
    id: 'src-func-03',
    code: 'FUNC-03',
    name: 'Secondary & Miscellaneous Steel Modeling',
    description: 'Modeling industrial/architectural stairs, handrails, vertical ladders, roof/wall bracings, sag rods, purlins, girts, and grating.',
    sourceDocument: 'Tekla - Functional Competencies Behaviour Indicators (Ref: SEC-MOD-03)',
    isConfiguredInApp: true,
    appCode: 'FUNC-03',
    sourceCategory: 'Specialized & Industrial Detailing',
    levels: [
      { level: 1, levelName: 'Novice', behaviorDescription: 'Models simple wall girts, roof purlins, and standard rod bracings following detail guidelines.' },
      { level: 2, levelName: 'Developing', behaviorDescription: 'Models straight flight stairs, standard caged ladders, pipe handrails, and checker plate platforms with accurate landings.' },
      { level: 3, levelName: 'Proficient', behaviorDescription: 'Models multi-flight switchback stairs, spiral staircases, complex monorails, crane walkways, and intricate architectural railings.' },
      { level: 4, levelName: 'Expert', behaviorDescription: 'Designs proprietary miscellaneous detailing component libraries; ensures full OSHA and building code egress compliance on complex layouts.' }
    ]
  },
  {
    id: 'src-func-04',
    code: 'FUNC-04',
    name: 'Model Accuracy & Drawing Development',
    description: 'Generating erection plans (E-sheets), assembly drawings, single-part drawings, and 3D isometric general arrangements.',
    sourceDocument: 'Tekla - Functional Competencies Behaviour Indicators (Ref: SEC-DRW-01)',
    isConfiguredInApp: true,
    appCode: 'FUNC-04',
    sourceCategory: 'Drawings & Quality',
    levels: [
      { level: 1, levelName: 'Novice', behaviorDescription: 'Generates single part and basic assembly drawings using standard drawing properties; cleans up overlapping text under direction.' },
      { level: 2, levelName: 'Developing', behaviorDescription: 'Creates clear erection plans, anchor bolt layouts, and complex assembly drawings with accurate sections, views, and bill of materials.' },
      { level: 3, levelName: 'Proficient', behaviorDescription: 'Delivers comprehensive, publication-ready drawing packages with optimal view placement, dimension chains, and special erection notes.' },
      { level: 4, levelName: 'Expert', behaviorDescription: 'Configures Master Drawing Catalog, automatic cloning templates, and drawing rule sets to achieve 50%+ drawing generation automation.' }
    ]
  },
  {
    id: 'src-func-05',
    code: 'FUNC-05',
    name: 'Clash Detection & Constructability Resolution',
    description: 'Executing Tekla Clash Check manager, verifying bolt clearance, erection access, weld access, and physical clearance for site fit-up.',
    sourceDocument: 'Tekla - Functional Competencies Behaviour Indicators (Ref: SEC-DRW-02)',
    isConfiguredInApp: true,
    appCode: 'FUNC-05',
    sourceCategory: 'Fabrication & Erection',
    levels: [
      { level: 1, levelName: 'Novice', behaviorDescription: 'Runs Tekla Clash Check tool on allotted model area; identifies direct physical collisions between steel parts.' },
      { level: 2, levelName: 'Developing', behaviorDescription: 'Checks bolt tightening clearances, wrench access, and part insertion paths; adjusts connection cuts to resolve clashes.' },
      { level: 3, levelName: 'Proficient', behaviorDescription: 'Conducts federated model clash detection (IFC / Navisworks) against MEP, concrete, and equipment; proposes constructability enhancements.' },
      { level: 4, levelName: 'Expert', behaviorDescription: 'Leads project constructability and erection staging reviews; prevents multi-million dollar field erection clashes before fabrication.' }
    ]
  },
  {
    id: 'src-func-06',
    code: 'FUNC-06',
    name: 'Drawing Presentation, Annotation & Dimensioning',
    description: 'Professional layout, dimension hierarchies, weld symbols (AWS D1.1), surface finish symbols, section cuts, and detail callouts.',
    sourceDocument: 'Tekla - Functional Competencies Behaviour Indicators (Ref: SEC-DRW-03)',
    isConfiguredInApp: true,
    appCode: 'FUNC-06',
    sourceCategory: 'Drawings & Quality',
    levels: [
      { level: 1, levelName: 'Novice', behaviorDescription: 'Applies standard dimensions, part marks, and basic weld symbols according to drawing guidelines without excessive clutter.' },
      { level: 2, levelName: 'Developing', behaviorDescription: 'Arranges comprehensive dimension strings (running vs incremental), bevel symbols, hole callouts, and clean section references.' },
      { level: 3, levelName: 'Proficient', behaviorDescription: 'Produces highly polished, clear shop drawings with zero ambiguity for shop fabricators; formats complex skewed section cuts seamlessly.' },
      { level: 4, levelName: 'Expert', behaviorDescription: 'Defines company graphical standards, font templates, dimension style libraries, and annotation rules across all drawing categories.' }
    ]
  },
  {
    id: 'src-func-07',
    code: 'FUNC-07',
    name: 'Standards & Code Compliance (AISC / NISD / OSHA / EN)',
    description: 'Adherence to AISC Steel Construction Manual, NISD detailing practices, OSHA erection safety rules, and project fabricator standards.',
    sourceDocument: 'Tekla - Functional Competencies Behaviour Indicators (Ref: SEC-ENG-01)',
    isConfiguredInApp: true,
    appCode: 'FUNC-07',
    sourceCategory: 'Core Modeling',
    levels: [
      { level: 1, levelName: 'Novice', behaviorDescription: 'Recognizes standard AISC profile designations, standard hole sizes, minimum bolt edge distances, and gauge dimensions.' },
      { level: 2, levelName: 'Developing', behaviorDescription: 'Applies NISD standard detailing conventions, column splice OSHA rules (4 bolts min), and fabricator-specific weld/bolt standards.' },
      { level: 3, levelName: 'Proficient', behaviorDescription: 'Demonstrates thorough mastery of AISC 360, AISC 341 (seismic provisions), RCSC bolt specifications, and galvanized coating vent hole rules.' },
      { level: 4, levelName: 'Expert', behaviorDescription: 'Interprets conflicting international codes (AISC vs Eurocode vs BS); audits compliance on critical infrastructure projects.' }
    ]
  },
  {
    id: 'src-func-08',
    code: 'FUNC-08',
    name: 'Productivity, Accuracy & Output Control',
    description: 'Meeting tonnage and sheet output benchmarks, zero rework, rapid revision turnaround, and high production efficiency.',
    sourceDocument: 'Tekla - Functional Competencies Behaviour Indicators (Ref: SEC-PRD-01)',
    isConfiguredInApp: true,
    appCode: 'FUNC-08',
    sourceCategory: 'Drawings & Quality',
    levels: [
      { level: 1, levelName: 'Novice', behaviorDescription: 'Maintains steady progress on standard modeling tasks (10-15 tons/day simple steel) with acceptable first-pass accuracy.' },
      { level: 2, levelName: 'Developing', behaviorDescription: 'Consistently meets target productivity (25-35 tons/day medium complexity) with <5% checker markup rate.' },
      { level: 3, levelName: 'Proficient', behaviorDescription: 'Delivers high-volume output (50+ tons/day or complex misc steel packages) with near-zero error rates and rapid cycle times.' },
      { level: 4, levelName: 'Expert', behaviorDescription: 'Sets industry-leading productivity benchmarks; establishes workflow accelerators that multiply overall team throughput.' }
    ]
  },
  {
    id: 'src-func-09',
    code: 'FUNC-09',
    name: 'NC / DXF File Generation & Fabrication Data Export',
    description: 'Exporting CNC DSTV files, plate DXF contours, KISS / FabTrol / FabSuite data, bolt summaries, and shipping lists.',
    sourceDocument: 'Tekla - Functional Competencies Behaviour Indicators (Ref: SEC-FAB-01)',
    isConfiguredInApp: true,
    appCode: 'FUNC-09',
    sourceCategory: 'Fabrication & Erection',
    levels: [
      { level: 1, levelName: 'Novice', behaviorDescription: 'Generates standard NC files and plate DXFs from Tekla model under supervision.' },
      { level: 2, levelName: 'Developing', behaviorDescription: 'Verifies NC file header data, plate orientation, inner radius contouring, and exports KISS/MIS data packages accurately.' },
      { level: 3, levelName: 'Proficient', behaviorDescription: 'Troubleshoots complex robotic welding NC data, CNC drill/saw machine compatibility, bevel cuts, and scribe marking lines.' },
      { level: 4, levelName: 'Expert', behaviorDescription: 'Integrates automated data exchange pipelines between Tekla, ERP systems (STRUMIS, FabSuite), and automated fabrication machinery.' }
    ]
  },
  {
    id: 'src-func-10',
    code: 'FUNC-10',
    name: 'RFI Generation & Engineering Clarification Handling',
    description: 'Identifying contract drawing ambiguities, formulating technical Requests for Information (RFIs) with proposed solutions and sketches.',
    sourceDocument: 'Tekla - Functional Competencies Behaviour Indicators (Ref: SEC-ENG-02)',
    isConfiguredInApp: true,
    appCode: 'FUNC-10',
    sourceCategory: 'Connections & Framing',
    levels: [
      { level: 1, levelName: 'Novice', behaviorDescription: 'Identifies clear drawing discrepancies and brings them to team lead with sheet and grid references.' },
      { level: 2, levelName: 'Developing', behaviorDescription: 'Drafts comprehensive RFI questionnaires complete with 3D Tekla snapshots, proposed framing alternatives, and affected sheet lists.' },
      { level: 3, levelName: 'Proficient', behaviorDescription: 'Communicates directly with Engineer of Record (EOR) to resolve critical connection ambiguities; tracks RFI status to prevent schedule delays.' },
      { level: 4, levelName: 'Expert', behaviorDescription: 'Defines RFI escalation management protocols; conducts pre-detailing design reviews that preemptively identify 80%+ of engineering gaps.' }
    ]
  },
  {
    id: 'src-func-11',
    code: 'FUNC-11',
    name: 'Checking & Verification Methodology',
    description: 'Performing comprehensive structural model checks, drawing markups, bill of materials audit, connection verification, and back-checking.',
    sourceDocument: 'Tekla - Functional Competencies Behaviour Indicators (Ref: SEC-CHK-01)',
    isConfiguredInApp: true,
    appCode: 'FUNC-11',
    sourceCategory: 'Drawings & Quality',
    levels: [
      { level: 1, levelName: 'Novice', behaviorDescription: 'Performs self-checking using standard checklist; verifies part numbers, material grades, and overall lengths.' },
      { level: 2, levelName: 'Developing', behaviorDescription: 'Conducts thorough model checking for simple framing; checks bolt edge distances, weld symbols, and clear clearances systematically.' },
      { level: 3, levelName: 'Proficient', behaviorDescription: 'Checks complex multi-story structures, heavy industrial framing, skewed trusses, and shop drawings with near-zero missed markups.' },
      { level: 4, levelName: 'Expert', behaviorDescription: 'Serves as Principal Checker / Chief Inspector; establishes company checking workflows, audit guidelines, and quality rating scorecards.' }
    ]
  },
  {
    id: 'src-func-12',
    code: 'FUNC-12',
    name: 'Structural Framing Interpretation & Contract Drawings',
    description: 'Reading and comprehending architectural, structural, MEP, and connection design drawings, general notes, and specifications.',
    sourceDocument: 'Tekla - Functional Competencies Behaviour Indicators (Ref: SEC-ENG-03)',
    isConfiguredInApp: true,
    appCode: 'FUNC-12',
    sourceCategory: 'Core Modeling',
    levels: [
      { level: 1, levelName: 'Novice', behaviorDescription: 'Understands basic structural plans, column schedules, beam sizes, grid layouts, and typical detail callouts.' },
      { level: 2, levelName: 'Developing', behaviorDescription: 'Correlates structural framing plans with architectural elevations, section cuts, roof slopes, and general structural notes accurately.' },
      { level: 3, levelName: 'Proficient', behaviorDescription: 'Deciphers complex engineering intent across conflicting disciplines (structural vs architectural vs MEP); anticipates constructability requirements.' },
      { level: 4, levelName: 'Expert', behaviorDescription: 'Acts as technical authority on contract drawing interpretation; leads design coordination meetings with EOR and architects.' }
    ]
  },
  {
    id: 'src-func-13',
    code: 'FUNC-13',
    name: 'Revision Management & Delta Control',
    description: 'Tracking design drawing revisions (Addenda, Bulletins, ASIs), model changes, drawing clouding, and revision history documentation.',
    sourceDocument: 'Tekla - Functional Competencies Behaviour Indicators (Ref: SEC-REV-01)',
    isConfiguredInApp: true,
    appCode: 'FUNC-13',
    sourceCategory: 'Drawings & Quality',
    levels: [
      { level: 1, levelName: 'Novice', behaviorDescription: 'Applies revision marks, clouds, and descriptions to drawing titles according to markups.' },
      { level: 2, levelName: 'Developing', behaviorDescription: 'Compares revision design drawings with model, identifies modified/added members, updates model, and generates revision delta BOMs.' },
      { level: 3, levelName: 'Proficient', behaviorDescription: 'Executes complex revision rollouts across hundreds of active shop drawings, ensuring fabrication hold marks and delta releases are tracked flawlessly.' },
      { level: 4, levelName: 'Expert', behaviorDescription: 'Manages major scope revisions and change orders; provides comprehensive impact analysis and fabrication delta costing reports.' }
    ]
  },
  {
    id: 'src-func-14',
    code: 'FUNC-14',
    name: 'Custom Components & Parametric Detailing',
    description: 'Developing parametric custom connections, custom parts, seam components, and detail components with binding variables and equations.',
    sourceDocument: 'Tekla - Functional Competencies Behaviour Indicators (Ref: SEC-AUT-01)',
    isConfiguredInApp: true,
    appCode: 'FUNC-14',
    sourceCategory: 'Automation & Integration',
    levels: [
      { level: 1, levelName: 'Novice', behaviorDescription: 'Explodes and modifies simple custom components; applies existing catalog custom components accurately.' },
      { level: 2, levelName: 'Developing', behaviorDescription: 'Creates non-parametric custom parts and simple connections for repetitive detailing conditions.' },
      { level: 3, levelName: 'Proficient', behaviorDescription: 'Builds fully parametric custom components using distance variables, parameter equations, and automatic profile selection logic.' },
      { level: 4, levelName: 'Expert', behaviorDescription: 'Architects enterprise-grade custom component suites with dialog box definition (.inp files) and automated calculation formulas.' }
    ]
  },
  {
    id: 'src-func-15',
    code: 'FUNC-15',
    name: 'Project Setup & Environment Customization',
    description: 'Configuring project firm folders, numbering setup, drawing classifiers, title block attributes, role settings, and template editors.',
    sourceDocument: 'Tekla - Functional Competencies Behaviour Indicators (Ref: SEC-SYS-01)',
    isConfiguredInApp: true,
    appCode: 'FUNC-15',
    sourceCategory: 'Automation & Integration',
    levels: [
      { level: 1, levelName: 'Novice', behaviorDescription: 'Opens models with correct environment and role configurations; understands project folder structures.' },
      { level: 2, levelName: 'Developing', behaviorDescription: 'Sets up project numbering series, phase/lot settings, and standard drawing title block attributes.' },
      { level: 3, levelName: 'Proficient', behaviorDescription: 'Configures complete firm folders, custom report templates in Template Editor (.tpl), and custom drawing layout rules.' },
      { level: 4, levelName: 'Expert', behaviorDescription: 'Deploys customized enterprise Tekla environments, multi-user server administration, and cross-office standardization protocols.' }
    ]
  },
  {
    id: 'src-func-16',
    code: 'FUNC-16',
    name: 'Advanced Tekla Open API & Scripting / Macros',
    description: 'Developing custom C# .NET plugins, Tekla Open API automated tools, macro scripts, and batch processing utilities.',
    sourceDocument: 'Tekla - Functional Competencies Behaviour Indicators (Ref: SEC-AUT-02)',
    isConfiguredInApp: true,
    appCode: 'FUNC-16',
    sourceCategory: 'Automation & Integration',
    levels: [
      { level: 1, levelName: 'Novice', behaviorDescription: 'Executes recorded macros and pre-installed Open API plugins effectively within the Tekla interface.' },
      { level: 2, levelName: 'Developing', behaviorDescription: 'Records and customizes simple Tekla keystroke macros (.cs / .mac) to automate repetitive modeling sequences.' },
      { level: 3, levelName: 'Proficient', behaviorDescription: 'Develops standalone C# Tekla Open API applications to automate drawing exports, clash filtering, and custom attribute injection.' },
      { level: 4, levelName: 'Expert', behaviorDescription: 'Architects enterprise Tekla Open API extensions and AI-assisted automation toolsets used across global operations.' }
    ]
  },
  {
    id: 'src-func-17',
    code: 'FUNC-17',
    name: 'Anchor Bolt Layout & Foundation Interface Detailing',
    description: 'Anchor rod plans, embed plates, setting templates, grouting allowances, foundation coordinate verification, and edge distance checks.',
    sourceDocument: 'Tekla - Functional Competencies Behaviour Indicators (Ref: SEC-MOD-04)',
    isConfiguredInApp: true,
    appCode: 'FUNC-17',
    sourceCategory: 'Core Modeling',
    levels: [
      { level: 1, levelName: 'Novice', behaviorDescription: 'Models standard anchor rods and base plates according to structural schedules with supervisor review.' },
      { level: 2, levelName: 'Developing', behaviorDescription: 'Creates clear Anchor Bolt Layout (AB) erection plans with grout thickness notes, bolt projection callouts, and template details.' },
      { level: 3, levelName: 'Proficient', behaviorDescription: 'Coordinates complex embedment angles, shear keys, heavy equipment foundation embed plates, and foundation step details.' },
      { level: 4, levelName: 'Expert', behaviorDescription: 'Audits global anchor bolt and civil foundation interfaces; eliminates costly foundation field modifications before concrete pour.' }
    ]
  },
  {
    id: 'src-func-18',
    code: 'FUNC-18',
    name: 'Complex Stair, Handrail & Industrial Egress Detailing',
    description: 'Stringer geometry, pan treads, checker plate landings, pipe/tube handrail turns, safety gates, toe plates, and IBC/OSHA egress compliance.',
    sourceDocument: 'Tekla - Functional Competencies Behaviour Indicators (Ref: SEC-MOD-05)',
    isConfiguredInApp: true,
    appCode: 'FUNC-18',
    sourceCategory: 'Specialized & Industrial Detailing',
    levels: [
      { level: 1, levelName: 'Novice', behaviorDescription: 'Models straight industrial stair stringers and basic infill pan steps using standard component 1039.' },
      { level: 2, levelName: 'Developing', behaviorDescription: 'Details multi-flight switchback stairs with intermediate support posts, continuous pipe handrails, and smooth corner transitions.' },
      { level: 3, levelName: 'Proficient', behaviorDescription: 'Designs intricate monumental architectural stairs, helical/spiral stair configurations, glass railing supports, and industrial cage ladders.' },
      { level: 4, levelName: 'Expert', behaviorDescription: 'Establishes department-wide egress detailing standards complying 100% with IBC, NFPA, and OSHA regulations across varied jurisdictions.' }
    ]
  },
  {
    id: 'src-func-19',
    code: 'FUNC-19',
    name: 'Heavy Industrial & Plate Girder / Truss Detailing',
    description: 'Built-up box columns, plate girders with intermediate stiffeners, crane runway girders, surge trusses, and heavy industrial duct supports.',
    sourceDocument: 'Tekla - Functional Competencies Behaviour Indicators (Ref: SEC-MOD-06)',
    isConfiguredInApp: true,
    appCode: 'FUNC-19',
    sourceCategory: 'Specialized & Industrial Detailing',
    levels: [
      { level: 1, levelName: 'Novice', behaviorDescription: 'Understands built-up profile modeling tools; models simple web/flange plate assemblies with fillet welds.' },
      { level: 2, levelName: 'Developing', behaviorDescription: 'Models plate girders with bearing and transverse stiffeners, bottom flange tension flange restrictions, and splice plates.' },
      { level: 3, levelName: 'Proficient', behaviorDescription: 'Details heavy industrial crane runways, complex box girders with internal diaphragm stiffeners, and camber curves.' },
      { level: 4, levelName: 'Expert', behaviorDescription: 'Leads detailing on mega-industrial plants (refineries, power plants, smelters); standardizes weld distortion control detailing.' }
    ]
  },
  {
    id: 'src-func-20',
    code: 'FUNC-20',
    name: 'BIM Coordination, IFC & Multi-Discipline Interoperability',
    description: 'IFC export property sets, Trimble Connect live collaboration, Navisworks clash federation, point cloud overlays, and Revit integration.',
    sourceDocument: 'Tekla - Functional Competencies Behaviour Indicators (Ref: SEC-BIM-01)',
    isConfiguredInApp: true,
    appCode: 'FUNC-20',
    sourceCategory: 'Automation & Integration',
    levels: [
      { level: 1, levelName: 'Novice', behaviorDescription: 'Imports reference models (IFC, DWG) into Tekla and aligns coordinate origin points properly.' },
      { level: 2, levelName: 'Developing', behaviorDescription: 'Exports accurate IFC models with user-defined property sets (UDAs) for client BIM coordination meetings.' },
      { level: 3, levelName: 'Proficient', behaviorDescription: 'Manages multi-discipline BIM federation in Trimble Connect / Navisworks; aligns 3D point cloud scans against detailing geometry.' },
      { level: 4, levelName: 'Expert', behaviorDescription: 'Leads global BIM execution planning (BEP); integrates full LOD 400 fabrication models into digital twin platforms.' }
    ]
  },

  // =========================================================================
  // 21-35: Additional Source Document Competencies (Catalogue Extension)
  // These represent candidate competencies in the full source catalogue.
  // =========================================================================
  {
    id: 'src-func-21',
    code: 'SRC-FUNC-21',
    name: 'Weld Design, Joint Preparation & Weld Mapping',
    description: 'Complete Joint Penetration (CJP), Partial Joint Penetration (PJP), backing bars, weld access holes (rat holes), and AWS D1.1/CWB welding symbol mapping.',
    sourceDocument: 'Tekla - Functional Competencies Behaviour Indicators (Ref: SEC-WLD-01)',
    isConfiguredInApp: false,
    sourceCategory: 'Connections & Framing',
    levels: [
      { level: 1, levelName: 'Novice', behaviorDescription: 'Applies basic fillet weld symbols and tail notations to simple shear connections following drawing standards.' },
      { level: 2, levelName: 'Developing', behaviorDescription: 'Details bevel preparations (single/double V-grooves), root openings, land dimensions, and backing bar extensions correctly.' },
      { level: 3, levelName: 'Proficient', behaviorDescription: 'Maps complex seismic CJP weld details, weld access hole geometry per AISC 360 Chapter J, and non-destructive testing (NDT) symbols.' },
      { level: 4, levelName: 'Expert', behaviorDescription: 'Develops fabricator-specific weld optimization guidelines; minimizes weld deposit volume and mitigates thermal distortion on heavy steel.' }
    ]
  },
  {
    id: 'src-func-22',
    code: 'SRC-FUNC-22',
    name: 'Cold-Formed & Light-Gauge Steel Detailing',
    description: 'Detailing cold-formed C/Z purlins, roof/wall bridging clips, sag angles, eave struts, and light-gauge framing systems conforming to AISI standards.',
    sourceDocument: 'Tekla - Functional Competencies Behaviour Indicators (Ref: SEC-LGS-01)',
    isConfiguredInApp: false,
    sourceCategory: 'Specialized & Industrial Detailing',
    levels: [
      { level: 1, levelName: 'Novice', behaviorDescription: 'Models standard C/Z sections for roof and wall envelope support under team lead guidance.' },
      { level: 2, levelName: 'Developing', behaviorDescription: 'Details purlin overlap laps, anti-sag rods, bridging channels, and fastener patterns according to manufacturer catalogs.' },
      { level: 3, levelName: 'Proficient', behaviorDescription: 'Designs complex cold-formed framed openings, parapet framing, expansion joints, and customized clip assemblies.' },
      { level: 4, levelName: 'Expert', behaviorDescription: 'Standardizes PEMB light-gauge component macros and automatic purlin layout tools for maximum erection speed.' }
    ]
  },
  {
    id: 'src-func-23',
    code: 'SRC-FUNC-23',
    name: 'Plate Nesting & Material Optimization',
    description: 'Integration with plate nesting software, linear profile nesting optimization, drop management, grain direction control, and scrap reduction.',
    sourceDocument: 'Tekla - Functional Competencies Behaviour Indicators (Ref: SEC-OPT-01)',
    isConfiguredInApp: false,
    sourceCategory: 'Fabrication & Erection',
    levels: [
      { level: 1, levelName: 'Novice', behaviorDescription: 'Understands standard plate stock sizes and raw mill length constraints when creating part geometry.' },
      { level: 2, levelName: 'Developing', behaviorDescription: 'Exports clean plate DXF boundaries with designated grain constraints and lead-in clearance lines for CNC plasma cutters.' },
      { level: 3, levelName: 'Proficient', behaviorDescription: 'Executes high-yield 1D bar nesting and 2D plate nesting workflows; tracks remnant drops to reduce raw steel scrap below 4%.' },
      { level: 4, levelName: 'Expert', behaviorDescription: 'Integrates automated nesting engines directly into procurement workflows, generating real-time mill order optimization tables.' }
    ]
  },
  {
    id: 'src-func-24',
    code: 'SRC-FUNC-24',
    name: 'Joist & Deck Coordination & Detailing',
    description: 'Steel Joist Institute (SJI) standard seat depths, bridging lines, deck layout, closure plates, cellular deck, and pour stop detailing.',
    sourceDocument: 'Tekla - Functional Competencies Behaviour Indicators (Ref: SEC-JST-01)',
    isConfiguredInApp: false,
    sourceCategory: 'Connections & Framing',
    levels: [
      { level: 1, levelName: 'Novice', behaviorDescription: 'Models joist bearing seats and basic pour stops according to structural drawings and joist manufacturer schedules.' },
      { level: 2, levelName: 'Developing', behaviorDescription: 'Details horizontal and diagonal bridging lines, joist bottom chord extensions, and roof sump pan framing.' },
      { level: 3, levelName: 'Proficient', behaviorDescription: 'Coordinates complex joist girder uplift connections, axial drag transfer details, and deck opening reinforcement frames.' },
      { level: 4, levelName: 'Expert', behaviorDescription: 'Standardizes joist manufacturer data exchanges and automated deck layout generation across large commercial warehouse projects.' }
    ]
  },
  {
    id: 'src-func-25',
    code: 'SRC-FUNC-25',
    name: 'Pre-Cast Concrete & Embedment Detailing',
    description: 'Coordinating structural steel embeds, weld plates, headed shear studs, bearing pads, and erection tolerances with precast panels.',
    sourceDocument: 'Tekla - Functional Competencies Behaviour Indicators (Ref: SEC-EMB-01)',
    isConfiguredInApp: false,
    sourceCategory: 'Core Modeling',
    levels: [
      { level: 1, levelName: 'Novice', behaviorDescription: 'Models standard embed plates and headed shear studs from precast engineer schedule.' },
      { level: 2, levelName: 'Developing', behaviorDescription: 'Details slotted connection brackets accommodating ±1" precast thermal and erection tolerances.' },
      { level: 3, levelName: 'Proficient', behaviorDescription: 'Resolves complex multi-panel pocket embeds, shear keys, and heavy corbel connections against structural steel frames.' },
      { level: 4, levelName: 'Expert', behaviorDescription: 'Establishes unified BIM coordination protocols between steel detailers and precast concrete fabricators.' }
    ]
  },
  {
    id: 'src-func-26',
    code: 'SRC-FUNC-26',
    name: 'Timber / Heavy Wood Connection Detailing',
    description: 'Glulam beam hangers, flitch plates, heavy timber truss brackets, and Simpson/custom concealed wood-to-steel connector detailing.',
    sourceDocument: 'Tekla - Functional Competencies Behaviour Indicators (Ref: SEC-TMB-01)',
    isConfiguredInApp: false,
    sourceCategory: 'Specialized & Industrial Detailing',
    levels: [
      { level: 1, levelName: 'Novice', behaviorDescription: 'Models standard catalog beam hangers and top-flange saddle brackets onto steel columns.' },
      { level: 2, levelName: 'Developing', behaviorDescription: 'Details concealed knife plate connections, countersunk dowels, and through-bolt patterns for mass timber members.' },
      { level: 3, levelName: 'Proficient', behaviorDescription: 'Engineers custom architectural timber truss hub connections, moment-resisting timber splices, and cross-laminated timber (CLT) hold-downs.' },
      { level: 4, levelName: 'Expert', behaviorDescription: 'Develops hybrid mass-timber and structural steel parametric component libraries for sustainable construction projects.' }
    ]
  },
  {
    id: 'src-func-27',
    code: 'SRC-FUNC-27',
    name: 'Temporary Erection Bracing & Shoring Detailing',
    description: 'Lifting lugs, crane pick points, center of gravity calculation, temporary guy wire connections, and erection shoring drawings.',
    sourceDocument: 'Tekla - Functional Competencies Behaviour Indicators (Ref: SEC-ERC-01)',
    isConfiguredInApp: false,
    sourceCategory: 'Fabrication & Erection',
    levels: [
      { level: 1, levelName: 'Novice', behaviorDescription: 'Identifies member center-of-gravity and places standard certified lifting lugs under direction.' },
      { level: 2, levelName: 'Developing', behaviorDescription: 'Calculates rigging sling angles, shackle capacities, and details temporary erection column splices and stabilizer tabs.' },
      { level: 3, levelName: 'Proficient', behaviorDescription: 'Designs complex modular truss lifting frames, crane pick plans, and multi-tier erection staging sequences.' },
      { level: 4, levelName: 'Expert', behaviorDescription: 'Leads erection engineering reviews with field superintendents, establishing zero-accident site erection methodologies.' }
    ]
  },
  {
    id: 'src-func-28',
    code: 'SRC-FUNC-28',
    name: 'Point Cloud Survey & As-Built Verification',
    description: '3D laser scanning point cloud registration, as-built deviation analysis, and clash checking existing site conditions against proposed steel model.',
    sourceDocument: 'Tekla - Functional Competencies Behaviour Indicators (Ref: SEC-SCN-01)',
    isConfiguredInApp: false,
    sourceCategory: 'Automation & Integration',
    levels: [
      { level: 1, levelName: 'Novice', behaviorDescription: 'Imports point cloud files (.e57, .las, .rcp) into Tekla model and verifies datum elevation benchmarks.' },
      { level: 2, levelName: 'Developing', behaviorDescription: 'Performs sectional slicing through point clouds to measure out-of-plumb column deviations and existing bolt locations.' },
      { level: 3, levelName: 'Proficient', behaviorDescription: 'Modifies proposed retrofit steel geometry to perfectly match irregular surveyed conditions, avoiding expensive site re-drilling.' },
      { level: 4, levelName: 'Expert', behaviorDescription: 'Standardizes reality capture QA workflows and automated point-cloud-to-mesh modeling tools for brownfield plant expansions.' }
    ]
  },
  {
    id: 'src-func-29',
    code: 'SRC-FUNC-29',
    name: 'Galvanizing & Coating System Detailing',
    description: 'Vent and drain hole placement for hot-dip galvanizing (ASTM A123), masked faying surfaces, and specialized architectural/intumescent paint allowances.',
    sourceDocument: 'Tekla - Functional Competencies Behaviour Indicators (Ref: SEC-COA-01)',
    isConfiguredInApp: false,
    sourceCategory: 'Drawings & Quality',
    levels: [
      { level: 1, levelName: 'Novice', behaviorDescription: 'Adds standard note callouts for shop primer and galvanized coating thicknesses per contract specifications.' },
      { level: 2, levelName: 'Developing', behaviorDescription: 'Places required vent and drain holes in tubular assemblies and enclosed box members according to AGA standards.' },
      { level: 3, levelName: 'Proficient', behaviorDescription: 'Details slip-critical connection masked surfaces, intumescent fireproofing clearance offsets, and zinc entrapment prevention.' },
      { level: 4, levelName: 'Expert', behaviorDescription: 'Audits complex industrial coating systems, marine epoxy specifications, and standardizes automated galvanizing vent hole macros.' }
    ]
  },
  {
    id: 'src-func-30',
    code: 'SRC-FUNC-30',
    name: 'Cast-In-Place Anchor Bolt & Rebar Conflict Detailing',
    description: '3D rebar cage clash resolution with anchor bolt clusters, sleeves, and post-tensioning tendons in concrete pier foundations.',
    sourceDocument: 'Tekla - Functional Competencies Behaviour Indicators (Ref: SEC-CIV-01)',
    isConfiguredInApp: false,
    sourceCategory: 'Core Modeling',
    levels: [
      { level: 1, levelName: 'Novice', behaviorDescription: 'Checks anchor bolt group dimensions against foundation schedule.' },
      { level: 2, levelName: 'Developing', behaviorDescription: 'Coordinates pipe sleeve diameters and anchor bolt hook orientations to avoid main vertical rebar bars.' },
      { level: 3, levelName: 'Proficient', behaviorDescription: 'Models federated 3D rebar models with anchor bolt clusters to resolve heavy shear lug conflicts in turbine foundation blocks.' },
      { level: 4, levelName: 'Expert', behaviorDescription: 'Establishes joint steel-concrete coordination standards on major industrial foundations and civil bridge abutments.' }
    ]
  },
  {
    id: 'src-func-31',
    code: 'SRC-FUNC-31',
    name: 'Structural Glazing & Façade Embed Interface',
    description: 'Curtain wall steel brackets, spider fittings, slotted thermal expansion joints, and façade dead load / wind load clips.',
    sourceDocument: 'Tekla - Functional Competencies Behaviour Indicators (Ref: SEC-FAC-01)',
    isConfiguredInApp: false,
    sourceCategory: 'Specialized & Industrial Detailing',
    levels: [
      { level: 1, levelName: 'Novice', behaviorDescription: 'Models simple perimeter angle kickers and edge-of-slab angles following architectural drawings.' },
      { level: 2, levelName: 'Developing', behaviorDescription: 'Details multi-directional slotted holes with serrated washers accommodating slab live-load deflection and thermal expansion.' },
      { level: 3, levelName: 'Proficient', behaviorDescription: 'Coordinates monumental structural glass fin brackets, spider arm fittings, and 3D architectural façade support trusses.' },
      { level: 4, levelName: 'Expert', behaviorDescription: 'Directs complex building envelope interface detailing, ensuring flawless thermal break integration and weatherproofing.' }
    ]
  },
  {
    id: 'src-func-32',
    code: 'SRC-FUNC-32',
    name: 'Offshore & Marine Structural Steel Detailing',
    description: 'Heavy tubular node modeling, can joints, API/DNV offshore specifications, heavy weld buttering, and marine load out seafastening.',
    sourceDocument: 'Tekla - Functional Competencies Behaviour Indicators (Ref: SEC-OFF-01)',
    isConfiguredInApp: false,
    sourceCategory: 'Specialized & Industrial Detailing',
    levels: [
      { level: 1, levelName: 'Novice', behaviorDescription: 'Models standard tubular braces and pipe cuts with manual notch preparation under supervision.' },
      { level: 2, levelName: 'Developing', behaviorDescription: 'Details complex multi-branch tubular joints (K, T, Y nodes) with variable bevel angles complying with API RP 2A.' },
      { level: 3, levelName: 'Proficient', behaviorDescription: 'Models heavy offshore topside modules, flare booms, helideck trusses, and barge seafastening grillage assemblies.' },
      { level: 4, levelName: 'Expert', behaviorDescription: 'Acts as Principal Offshore Detailing Consultant; standardizes 5-axis CNC pipe cutting data exports and fatigue-critical weld details.' }
    ]
  },
  {
    id: 'src-func-33',
    code: 'SRC-FUNC-33',
    name: 'Bridge Detailing & Camber Curve Geometry',
    description: 'Curved plate girder bridges, tub girders, AASHTO / AREMA railway code detailing, vertical curve camber, and bearing sole plates.',
    sourceDocument: 'Tekla - Functional Competencies Behaviour Indicators (Ref: SEC-BRG-01)',
    isConfiguredInApp: false,
    sourceCategory: 'Specialized & Industrial Detailing',
    levels: [
      { level: 1, levelName: 'Novice', behaviorDescription: 'Understands bridge stationing, cross-slope superelevation, and straight plate girder geometry.' },
      { level: 2, levelName: 'Developing', behaviorDescription: 'Applies parabolic dead load camber curves and details intermediate K-frame cross-bracings accurately.' },
      { level: 3, levelName: 'Proficient', behaviorDescription: 'Models horizontally curved tub girders, skewed bridge expansion joints, pot bearings, and elastomeric sole plates.' },
      { level: 4, levelName: 'Expert', behaviorDescription: 'Oversees Department of Transportation (DOT) bridge submittals and complex multi-span continuous steel bridge projects.' }
    ]
  },
  {
    id: 'src-func-34',
    code: 'SRC-FUNC-34',
    name: 'Crane Runway Systems & Monorail Detailing',
    description: 'Crane rail clips, surge girders, bumper stops, bridge crane clearances, CMAA compliance, and fatigue weld details.',
    sourceDocument: 'Tekla - Functional Competencies Behaviour Indicators (Ref: SEC-CRN-01)',
    isConfiguredInApp: false,
    sourceCategory: 'Specialized & Industrial Detailing',
    levels: [
      { level: 1, levelName: 'Novice', behaviorDescription: 'Models simple underhung monorail beams with standard splice plates and end stops.' },
      { level: 2, levelName: 'Developing', behaviorDescription: 'Details top-running crane runway girders with adjustable Gantrex rail clips, tieback channels, and surge truss plates.' },
      { level: 3, levelName: 'Proficient', behaviorDescription: 'Verifies CMAA heavy-duty crane runway clearances, wheel load eccentricities, fatigue stress categories, and runway rail splices.' },
      { level: 4, levelName: 'Expert', behaviorDescription: 'Standardizes heavy mill-duty (Class E/F) crane runway detailing rules, eliminating long-term structural fatigue failures.' }
    ]
  },
  {
    id: 'src-func-35',
    code: 'SRC-FUNC-35',
    name: 'Industrial Ductwork, Chutes & Hopper Detailing',
    description: 'Transition chutes, hopper plates, liner plate detailing, stiffener ring spacing, expansion joint connections, and abrasion-resistant steel.',
    sourceDocument: 'Tekla - Functional Competencies Behaviour Indicators (Ref: SEC-IND-01)',
    isConfiguredInApp: false,
    sourceCategory: 'Specialized & Industrial Detailing',
    levels: [
      { level: 1, levelName: 'Novice', behaviorDescription: 'Models rectangular duct sections and simple conical transition pieces with specified plate thickness.' },
      { level: 2, levelName: 'Developing', behaviorDescription: 'Details hopper corner knuckle joints, angle stiffener rings, access doors, and bolted flange connections.' },
      { level: 3, levelName: 'Proficient', behaviorDescription: 'Develops flat pattern plate layouts for complex skewed square-to-round chutes with Hardox / AR400 wear liners.' },
      { level: 4, levelName: 'Expert', behaviorDescription: 'Standardizes material handling and thermal expansion duct detailing across mining, cement, and power generation plants.' }
    ]
  }
];

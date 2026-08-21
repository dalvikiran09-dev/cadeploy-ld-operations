import { 
  TrainingDepartment, 
  TrainingFrameworkVersion, 
  TrainingCompetency, 
  TrainingRole, 
  TrainingRoleCompetency 
} from '../types/competency';

export const SEED_DEPARTMENTS: TrainingDepartment[] = [
  {
    id: 'dept-tekla',
    departmentName: 'Tekla',
    code: 'TKL',
    status: 'Active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'dept-estimation',
    departmentName: 'Estimation',
    code: 'EST',
    status: 'Active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'dept-hr',
    departmentName: 'HR',
    code: 'HR',
    status: 'Active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'dept-pm',
    departmentName: 'Project Management',
    code: 'PMO',
    status: 'Active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'dept-pemb',
    departmentName: 'PEMB',
    code: 'PEMB',
    status: 'Active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'dept-qa',
    departmentName: 'QA',
    code: 'QA',
    status: 'Active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'dept-rebar',
    departmentName: 'Rebar',
    code: 'RBR',
    status: 'Active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'dept-sds2',
    departmentName: 'SDS/2',
    code: 'SDS2',
    status: 'Active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const SEED_FRAMEWORK_VERSIONS: TrainingFrameworkVersion[] = [
  {
    id: 'fwv-tekla-v1',
    departmentId: 'dept-tekla',
    version: 'V1.0',
    status: 'Draft',
    authorizationDate: 'TBD',
    effectiveDate: new Date().toISOString().split('T')[0],
    notes: 'Official V1.0 competency framework for Tekla Structural Steel Detailing operations. Features 10 Core, 20 Functional, and 10 Leadership competencies across 10 distinct job roles.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const SEED_TEKLA_COMPETENCIES: TrainingCompetency[] = [
  // =========================================================================
  // CORE COMPETENCIES (10 Competencies - 4 Levels Each)
  // Exact source from: Tekla - Competency Framework Definitions & Behavioral Indicators
  // =========================================================================
  {
    id: 'comp-tekla-core-01',
    departmentId: 'dept-tekla',
    code: 'CORE-01',
    name: 'Integrity & Ethics',
    description: 'Adheres to moral and ethical principles, engineering ethics, IP protection, accurate reporting, honesty in detailing, and compliance with company policies.',
    tier: 'Core',
    status: 'Active',
    frameworkVersion: 'V1.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    levels: [
      { id: 'lvl-core01-1', competencyId: 'comp-tekla-core-01', level: 1, levelName: 'Novice', behaviorDescription: 'Adheres to company confidentiality policies; reports errors transparently without attempting to conceal modeling defects.', frameworkVersion: 'V1.0' },
      { id: 'lvl-core01-2', competencyId: 'comp-tekla-core-01', level: 2, levelName: 'Developing', behaviorDescription: 'Consistently demonstrates honesty in status reporting and time tracking; respects client proprietary drawing assets and IP.', frameworkVersion: 'V1.0' },
      { id: 'lvl-core01-3', competencyId: 'comp-tekla-core-01', level: 3, levelName: 'Proficient', behaviorDescription: 'Upholds professional standards in engineering calculations, weld specifications, and compliance sign-offs with zero compromise.', frameworkVersion: 'V1.0' },
      { id: 'lvl-core01-4', competencyId: 'comp-tekla-core-01', level: 4, levelName: 'Expert', behaviorDescription: 'Serves as an exemplar of professional integrity; institutes ethical auditing and quality compliance standards across the enterprise.', frameworkVersion: 'V1.0' }
    ]
  },
  {
    id: 'comp-tekla-core-02',
    departmentId: 'dept-tekla',
    code: 'CORE-02',
    name: 'Customer Focus',
    description: 'Understands fabricator, erector, and general contractor requirements, custom drawing preferences, title block standards, and satisfaction drivers.',
    tier: 'Core',
    status: 'Active',
    frameworkVersion: 'V1.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    levels: [
      { id: 'lvl-core02-1', competencyId: 'comp-tekla-core-02', level: 1, levelName: 'Novice', behaviorDescription: 'Follows client-specific drawing notes, custom border attributes, and standard fabricator mark prefixes conscientiously.', frameworkVersion: 'V1.0' },
      { id: 'lvl-core02-2', competencyId: 'comp-tekla-core-02', level: 2, levelName: 'Developing', behaviorDescription: 'Anticipates fabricator shop preferences (e.g. shop welded vs bolted fittings); ensures drawing formats match client expectations.', frameworkVersion: 'V1.0' },
      { id: 'lvl-core02-3', competencyId: 'comp-tekla-core-02', level: 3, levelName: 'Proficient', behaviorDescription: 'Maintains proactive alignment with client project managers; resolves drawing markups swiftly and exceeds deliverable quality standards.', frameworkVersion: 'V1.0' },
      { id: 'lvl-core02-4', competencyId: 'comp-tekla-core-02', level: 4, levelName: 'Expert', behaviorDescription: 'Builds enduring client partnerships; tailors department detailing strategies to maximize fabricator throughput and secure repeat accounts.', frameworkVersion: 'V1.0' }
    ]
  },
  {
    id: 'comp-tekla-core-03',
    departmentId: 'dept-tekla',
    code: 'CORE-03',
    name: 'Collaboration & Teamwork',
    description: 'Collaborates constructively with peers, supports multi-user modeling synchronization, shares workload flexibly, and fosters team success.',
    tier: 'Core',
    status: 'Active',
    frameworkVersion: 'V1.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    levels: [
      { id: 'lvl-core03-1', competencyId: 'comp-tekla-core-03', level: 1, levelName: 'Novice', behaviorDescription: 'Cooperates well with modelers in shared environments; adheres to check-in/check-out guidelines and project lock rules.', frameworkVersion: 'V1.0' },
      { id: 'lvl-core03-2', competencyId: 'comp-tekla-core-03', level: 2, levelName: 'Developing', behaviorDescription: 'Assists colleagues during high-volume drawing releases; shares workload flexibly and resolves interface overlaps amicably.', frameworkVersion: 'V1.0' },
      { id: 'lvl-core03-3', competencyId: 'comp-tekla-core-03', level: 3, levelName: 'Proficient', behaviorDescription: 'Coordinates smooth multi-user detailing workflows across disparate shifts and locations; promotes collaborative knowledge sharing.', frameworkVersion: 'V1.0' },
      { id: 'lvl-core03-4', competencyId: 'comp-tekla-core-03', level: 4, levelName: 'Expert', behaviorDescription: 'Builds cohesive, high-morale detailing teams; resolves interpersonal friction constructively and models organizational values.', frameworkVersion: 'V1.0' }
    ]
  },
  {
    id: 'comp-tekla-core-04',
    departmentId: 'dept-tekla',
    code: 'CORE-04',
    name: 'Clear Communication',
    description: 'Effectively communicates structural detailing queries, writes precise RFIs, and conveys technical information clearly to engineers and clients.',
    tier: 'Core',
    status: 'Active',
    frameworkVersion: 'V1.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    levels: [
      { id: 'lvl-core04-1', competencyId: 'comp-tekla-core-04', level: 1, levelName: 'Novice', behaviorDescription: 'Communicates basic task progress to team lead; formulates clear questions when encountering ambiguous design drawings under guidance.', frameworkVersion: 'V1.0' },
      { id: 'lvl-core04-2', competencyId: 'comp-tekla-core-04', level: 2, levelName: 'Developing', behaviorDescription: 'Drafts clear technical questions and internal RFIs with reference sketches; participates actively in team coordination and model handoff meetings.', frameworkVersion: 'V1.0' },
      { id: 'lvl-core04-3', competencyId: 'comp-tekla-core-04', level: 3, levelName: 'Proficient', behaviorDescription: 'Directly articulates complex connection and geometry issues to clients/EOR; coordinates multi-modeler environments with zero clash overlap.', frameworkVersion: 'V1.0' },
      { id: 'lvl-core04-4', competencyId: 'comp-tekla-core-04', level: 4, levelName: 'Expert', behaviorDescription: 'Commands technical discussions with client engineering leads; resolves cross-discipline structural conflicts (HVAC, piping, architecture); facilitates smooth project sign-offs.', frameworkVersion: 'V1.0' }
    ]
  },
  {
    id: 'comp-tekla-core-05',
    departmentId: 'dept-tekla',
    code: 'CORE-05',
    name: 'Accountability & Ownership',
    description: 'Takes personal responsibility for assigned drawing packages, production schedules, quality standards, and committed deliverable dates.',
    tier: 'Core',
    status: 'Active',
    frameworkVersion: 'V1.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    levels: [
      { id: 'lvl-core05-1', competencyId: 'comp-tekla-core-05', level: 1, levelName: 'Novice', behaviorDescription: 'Completes assigned detailing sub-tasks within estimated timeframes; promptly flags potential delays or roadblocks to the team lead.', frameworkVersion: 'V1.0' },
      { id: 'lvl-core05-2', competencyId: 'comp-tekla-core-05', level: 2, levelName: 'Developing', behaviorDescription: 'Manages individual task queue reliably across multi-drawing releases; meets agreed milestone targets with minimal supervision.', frameworkVersion: 'V1.0' },
      { id: 'lvl-core05-3', competencyId: 'comp-tekla-core-05', level: 3, levelName: 'Proficient', behaviorDescription: 'Takes end-to-end ownership of major building zones / sequences; balances productivity and quality under tight project delivery deadlines.', frameworkVersion: 'V1.0' },
      { id: 'lvl-core05-4', competencyId: 'comp-tekla-core-05', level: 4, levelName: 'Expert', behaviorDescription: 'Drives overall project milestone accountability; proactively manages scope creep, resource re-allocation, and delivery risk mitigation.', frameworkVersion: 'V1.0' }
    ]
  },
  {
    id: 'comp-tekla-core-06',
    departmentId: 'dept-tekla',
    code: 'CORE-06',
    name: 'Continuous Improvement',
    description: 'Actively identifies workflow bottlenecks, embraces new detailing methodologies, seeks efficiency gains, and elevates skills.',
    tier: 'Core',
    status: 'Active',
    frameworkVersion: 'V1.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    levels: [
      { id: 'lvl-core06-1', competencyId: 'comp-tekla-core-06', level: 1, levelName: 'Novice', behaviorDescription: 'Demonstrates enthusiasm for learning Tekla shortcut keys, environment tools, and company standard component catalogs.', frameworkVersion: 'V1.0' },
      { id: 'lvl-core06-2', competencyId: 'comp-tekla-core-06', level: 2, levelName: 'Developing', behaviorDescription: 'Applies new Tekla features, warehouse extensions, and custom templates into daily workflows to increase modeling efficiency.', frameworkVersion: 'V1.0' },
      { id: 'lvl-core06-3', competencyId: 'comp-tekla-core-06', level: 3, levelName: 'Proficient', behaviorDescription: 'Masterfully navigates advanced Tekla configuration settings, advanced options (XS_ variables), and shares technical tips across the team.', frameworkVersion: 'V1.0' },
      { id: 'lvl-core06-4', competencyId: 'comp-tekla-core-06', level: 4, levelName: 'Expert', behaviorDescription: 'Champions technological innovation; tests beta versions, evaluates Open API automations, and standardizes best practices company-wide.', frameworkVersion: 'V1.0' }
    ]
  },
  {
    id: 'comp-tekla-core-07',
    departmentId: 'dept-tekla',
    code: 'CORE-07',
    name: 'Problem Solving & Decision Quality',
    description: 'Diagnoses structural discrepancies, resolves geometric interferences, and develops practical connection solutions within AISC/NISD codes.',
    tier: 'Core',
    status: 'Active',
    frameworkVersion: 'V1.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    levels: [
      { id: 'lvl-core07-1', competencyId: 'comp-tekla-core-07', level: 1, levelName: 'Novice', behaviorDescription: 'Recognizes geometric inconsistencies between architectural and structural drawings; escalates issues with exact coordinate/grid references.', frameworkVersion: 'V1.0' },
      { id: 'lvl-core07-2', competencyId: 'comp-tekla-core-07', level: 2, levelName: 'Developing', behaviorDescription: 'Analyzes connection geometry to find workable bolt/weld configurations; evaluates alternative member orientations to eliminate clashes.', frameworkVersion: 'V1.0' },
      { id: 'lvl-core07-3', competencyId: 'comp-tekla-core-07', level: 3, levelName: 'Proficient', behaviorDescription: 'Independently solves complex multi-member skew/slope connection geometry; formulates value-engineering alternatives to simplify fabrication and erection.', frameworkVersion: 'V1.0' },
      { id: 'lvl-core07-4', competencyId: 'comp-tekla-core-07', level: 4, levelName: 'Expert', behaviorDescription: 'Serves as technical escalation authority for intricate connection engineering challenges; standardizes parametric solution libraries across the department.', frameworkVersion: 'V1.0' }
    ]
  },
  {
    id: 'comp-tekla-core-08',
    departmentId: 'dept-tekla',
    code: 'CORE-08',
    name: 'Respect & Inclusion',
    description: 'Promotes an inclusive, respectful, and supportive workplace culture, valuing diverse perspectives and fair collaboration.',
    tier: 'Core',
    status: 'Active',
    frameworkVersion: 'V1.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    levels: [
      { id: 'lvl-core08-1', competencyId: 'comp-tekla-core-08', level: 1, levelName: 'Novice', behaviorDescription: 'Treats all team members, peers, and clients with dignity, courtesy, and professional respect at all times.', frameworkVersion: 'V1.0' },
      { id: 'lvl-core08-2', competencyId: 'comp-tekla-core-08', level: 2, levelName: 'Developing', behaviorDescription: 'Actively listens to diverse viewpoints; supports new team members and trainees in adapting to the team culture.', frameworkVersion: 'V1.0' },
      { id: 'lvl-core08-3', competencyId: 'comp-tekla-core-08', level: 3, levelName: 'Proficient', behaviorDescription: 'Fosters an inclusive team climate where all members feel valued and encouraged to contribute innovative detailing ideas.', frameworkVersion: 'V1.0' },
      { id: 'lvl-core08-4', competencyId: 'comp-tekla-core-08', level: 4, levelName: 'Expert', behaviorDescription: 'Champions organizational inclusion initiatives; mentors talent from diverse backgrounds and builds an equitable environment.', frameworkVersion: 'V1.0' }
    ]
  },
  {
    id: 'comp-tekla-core-09',
    departmentId: 'dept-tekla',
    code: 'CORE-09',
    name: 'Quality & Compliance',
    description: 'Demonstrates precision, systematic verification, zero-tolerance for geometry clashes, and strict adherence to drawing standards and codes.',
    tier: 'Core',
    status: 'Active',
    frameworkVersion: 'V1.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    levels: [
      { id: 'lvl-core09-1', competencyId: 'comp-tekla-core-09', level: 1, levelName: 'Novice', behaviorDescription: 'Understands basic checking concepts; identifies obvious visual discrepancies with supervision; uses checklists to verify member marks and dimensions.', frameworkVersion: 'V1.0' },
      { id: 'lvl-core09-2', competencyId: 'comp-tekla-core-09', level: 2, levelName: 'Developing', behaviorDescription: 'Independently conducts self-checks on routine models and drawings; detects common connection clashes; adheres to established layer and annotation standards.', frameworkVersion: 'V1.0' },
      { id: 'lvl-core09-3', competencyId: 'comp-tekla-core-09', level: 3, levelName: 'Proficient', behaviorDescription: 'Consistently delivers error-free models and drawings; proactively anticipates fabrication clearances, erection tolerances, and weld fit-up challenges.', frameworkVersion: 'V1.0' },
      { id: 'lvl-core09-4', competencyId: 'comp-tekla-core-09', level: 4, levelName: 'Expert', behaviorDescription: 'Establishes project-wide QA/QC protocols; leads root cause analysis for detailing errors; coaches teams on zero-defect modeling methodologies.', frameworkVersion: 'V1.0' }
    ]
  },
  {
    id: 'comp-tekla-core-10',
    departmentId: 'dept-tekla',
    code: 'CORE-10',
    name: 'Digital & Data Fluency',
    description: 'Leverages digital detailing tools, BIM platforms, database reports, CNC exports, and data-driven project tracking systems.',
    tier: 'Core',
    status: 'Active',
    frameworkVersion: 'V1.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    levels: [
      { id: 'lvl-core10-1', competencyId: 'comp-tekla-core-10', level: 1, levelName: 'Novice', behaviorDescription: 'Proficiently operates standard digital tools, Tekla model viewers, cloud folder structures, and digital tracking spreadsheets.', frameworkVersion: 'V1.0' },
      { id: 'lvl-core10-2', competencyId: 'comp-tekla-core-10', level: 2, levelName: 'Developing', behaviorDescription: 'Utilizes Trimble Connect, model change tracking tools, and automated report generators to verify detailing data accuracy.', frameworkVersion: 'V1.0' },
      { id: 'lvl-core10-3', competencyId: 'comp-tekla-core-10', level: 3, levelName: 'Proficient', behaviorDescription: 'Integrates multi-source BIM models, extracts custom SQL/ODBC reporting tables from Tekla databases, and optimizes data exchanges.', frameworkVersion: 'V1.0' },
      { id: 'lvl-core10-4', competencyId: 'comp-tekla-core-10', level: 4, levelName: 'Expert', behaviorDescription: 'Architects enterprise data pipelines connecting 3D models with ERP, automated nesting, and digital twin delivery systems.', frameworkVersion: 'V1.0' }
    ]
  },

  // =========================================================================
  // FUNCTIONAL TECHNICAL COMPETENCIES (20 Competencies - 4 Levels Each)
  // Exact source from: Tekla - Functional Competencies Behaviour Indicators
  // =========================================================================
  {
    id: 'comp-tekla-func-01',
    departmentId: 'dept-tekla',
    code: 'FUNC-01',
    name: 'Primary Structural Member Modeling',
    description: '3D modeling of structural columns, beams, girders, trusses, portal frames, grids, elevation control, and member work points.',
    tier: 'Functional',
    status: 'Active',
    frameworkVersion: 'V1.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    levels: [
      { id: 'lvl-func01-1', competencyId: 'comp-tekla-func-01', level: 1, levelName: 'Novice', behaviorDescription: 'Models standard orthogonal columns and beams with correct profile names, material grades, and grid alignments under guidance.', frameworkVersion: 'V1.0' },
      { id: 'lvl-func01-2', competencyId: 'comp-tekla-func-01', level: 2, levelName: 'Developing', behaviorDescription: 'Independently models sloping beams, cranked members, stepped columns, and standard trusses adhering to project coordinates.', frameworkVersion: 'V1.0' },
      { id: 'lvl-func01-3', competencyId: 'comp-tekla-func-01', level: 3, levelName: 'Proficient', behaviorDescription: 'Expertly models complex 3D curved geometry, complex industrial trusses, heavy transfer girders, and multi-tier portal frameworks.', frameworkVersion: 'V1.0' },
      { id: 'lvl-func01-4', competencyId: 'comp-tekla-func-01', level: 4, levelName: 'Expert', behaviorDescription: 'Establishes global project coordinate systems, multi-model shared coordinates, complex stadium/industrial structures, and audits global geometry.', frameworkVersion: 'V1.0' }
    ]
  },
  {
    id: 'comp-tekla-func-02',
    departmentId: 'dept-tekla',
    code: 'FUNC-02',
    name: 'Connection Modeling & Parameter Control',
    description: 'Application and parametric tuning of shear tabs, clip angles, moment connections, base plates, splice joints, and custom joints.',
    tier: 'Functional',
    status: 'Active',
    frameworkVersion: 'V1.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    levels: [
      { id: 'lvl-func02-1', competencyId: 'comp-tekla-func-02', level: 1, levelName: 'Novice', behaviorDescription: 'Applies standard Tekla system components (e.g. 144, 142, 1042) for simple orthogonal connections with supervisor verification.', frameworkVersion: 'V1.0' },
      { id: 'lvl-func02-2', competencyId: 'comp-tekla-func-02', level: 2, levelName: 'Developing', behaviorDescription: 'Adjusts connection parameters, plate sizes, edge distances, weld sizes, and bolt patterns to match design connection tables accurately.', frameworkVersion: 'V1.0' },
      { id: 'lvl-func02-3', competencyId: 'comp-tekla-func-02', level: 3, levelName: 'Proficient', behaviorDescription: 'Models heavy moment connections, complex multi-planar skewed joints, braced frame gusset plates, and heavy column splices independently.', frameworkVersion: 'V1.0' },
      { id: 'lvl-func02-4', competencyId: 'comp-tekla-func-02', level: 4, levelName: 'Expert', behaviorDescription: 'Standardizes connection selection logic across projects; develops intelligent parametric custom connection components with automatic formulas.', frameworkVersion: 'V1.0' }
    ]
  },
  {
    id: 'comp-tekla-func-03',
    departmentId: 'dept-tekla',
    code: 'FUNC-03',
    name: 'Secondary & Miscellaneous Steel Modeling',
    description: 'Modeling industrial/architectural stairs, handrails, vertical ladders, roof/wall bracings, sag rods, purlins, girts, and grating.',
    tier: 'Functional',
    status: 'Active',
    frameworkVersion: 'V1.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    levels: [
      { id: 'lvl-func03-1', competencyId: 'comp-tekla-func-03', level: 1, levelName: 'Novice', behaviorDescription: 'Models simple wall girts, roof purlins, and standard rod bracings following detail guidelines.', frameworkVersion: 'V1.0' },
      { id: 'lvl-func03-2', competencyId: 'comp-tekla-func-03', level: 2, levelName: 'Developing', behaviorDescription: 'Models straight flight stairs, standard caged ladders, pipe handrails, and checker plate platforms with accurate landings.', frameworkVersion: 'V1.0' },
      { id: 'lvl-func03-3', competencyId: 'comp-tekla-func-03', level: 3, levelName: 'Proficient', behaviorDescription: 'Models multi-flight switchback stairs, spiral staircases, complex monorails, crane walkways, and intricate architectural railings.', frameworkVersion: 'V1.0' },
      { id: 'lvl-func03-4', competencyId: 'comp-tekla-func-03', level: 4, levelName: 'Expert', behaviorDescription: 'Designs proprietary miscellaneous detailing component libraries; ensures full OSHA and building code egress compliance on complex layouts.', frameworkVersion: 'V1.0' }
    ]
  },
  {
    id: 'comp-tekla-func-04',
    departmentId: 'dept-tekla',
    code: 'FUNC-04',
    name: 'Model Accuracy & Drawing Development',
    description: 'Generating erection plans (E-sheets), assembly drawings, single-part drawings, and 3D isometric general arrangements.',
    tier: 'Functional',
    status: 'Active',
    frameworkVersion: 'V1.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    levels: [
      { id: 'lvl-func04-1', competencyId: 'comp-tekla-func-04', level: 1, levelName: 'Novice', behaviorDescription: 'Generates single part and basic assembly drawings using standard drawing properties; cleans up overlapping text under direction.', frameworkVersion: 'V1.0' },
      { id: 'lvl-func04-2', competencyId: 'comp-tekla-func-04', level: 2, levelName: 'Developing', behaviorDescription: 'Creates clear erection plans, anchor bolt layouts, and complex assembly drawings with accurate sections, views, and bill of materials.', frameworkVersion: 'V1.0' },
      { id: 'lvl-func04-3', competencyId: 'comp-tekla-func-04', level: 3, levelName: 'Proficient', behaviorDescription: 'Delivers comprehensive, publication-ready drawing packages with optimal view placement, dimension chains, and special erection notes.', frameworkVersion: 'V1.0' },
      { id: 'lvl-func04-4', competencyId: 'comp-tekla-func-04', level: 4, levelName: 'Expert', behaviorDescription: 'Configures Master Drawing Catalog, automatic cloning templates, and drawing rule sets to achieve 50%+ drawing generation automation.', frameworkVersion: 'V1.0' }
    ]
  },
  {
    id: 'comp-tekla-func-05',
    departmentId: 'dept-tekla',
    code: 'FUNC-05',
    name: 'Clash Detection & Constructability Resolution',
    description: 'Executing Tekla Clash Check manager, verifying bolt clearance, erection access, weld access, and physical clearance for site fit-up.',
    tier: 'Functional',
    status: 'Active',
    frameworkVersion: 'V1.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    levels: [
      { id: 'lvl-func05-1', competencyId: 'comp-tekla-func-05', level: 1, levelName: 'Novice', behaviorDescription: 'Runs Tekla Clash Check tool on allotted model area; identifies direct physical collisions between steel parts.', frameworkVersion: 'V1.0' },
      { id: 'lvl-func05-2', competencyId: 'comp-tekla-func-05', level: 2, levelName: 'Developing', behaviorDescription: 'Checks bolt tightening clearances, wrench access, and part insertion paths; adjusts connection cuts to resolve clashes.', frameworkVersion: 'V1.0' },
      { id: 'lvl-func05-3', competencyId: 'comp-tekla-func-05', level: 3, levelName: 'Proficient', behaviorDescription: 'Conducts federated model clash detection (IFC / Navisworks) against MEP, concrete, and equipment; proposes constructability enhancements.', frameworkVersion: 'V1.0' },
      { id: 'lvl-func05-4', competencyId: 'comp-tekla-func-05', level: 4, levelName: 'Expert', behaviorDescription: 'Leads project constructability and erection staging reviews; prevents multi-million dollar field erection clashes before fabrication.', frameworkVersion: 'V1.0' }
    ]
  },
  {
    id: 'comp-tekla-func-06',
    departmentId: 'dept-tekla',
    code: 'FUNC-06',
    name: 'Drawing Presentation, Annotation & Dimensioning',
    description: 'Professional layout, dimension hierarchies, weld symbols (AWS D1.1), surface finish symbols, section cuts, and detail callouts.',
    tier: 'Functional',
    status: 'Active',
    frameworkVersion: 'V1.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    levels: [
      { id: 'lvl-func06-1', competencyId: 'comp-tekla-func-06', level: 1, levelName: 'Novice', behaviorDescription: 'Applies standard dimensions, part marks, and basic weld symbols according to drawing guidelines without excessive clutter.', frameworkVersion: 'V1.0' },
      { id: 'lvl-func06-2', competencyId: 'comp-tekla-func-06', level: 2, levelName: 'Developing', behaviorDescription: 'Arranges comprehensive dimension strings (running vs incremental), bevel symbols, hole callouts, and clean section references.', frameworkVersion: 'V1.0' },
      { id: 'lvl-func06-3', competencyId: 'comp-tekla-func-06', level: 3, levelName: 'Proficient', behaviorDescription: 'Produces highly polished, clear shop drawings with zero ambiguity for shop fabricators; formats complex skewed section cuts seamlessly.', frameworkVersion: 'V1.0' },
      { id: 'lvl-func06-4', competencyId: 'comp-tekla-func-06', level: 4, levelName: 'Expert', behaviorDescription: 'Defines company graphical standards, font templates, dimension style libraries, and annotation rules across all drawing categories.', frameworkVersion: 'V1.0' }
    ]
  },
  {
    id: 'comp-tekla-func-07',
    departmentId: 'dept-tekla',
    code: 'FUNC-07',
    name: 'Standards & Code Compliance (AISC / NISD / OSHA / EN)',
    description: 'Adherence to AISC Steel Construction Manual, NISD detailing practices, OSHA erection safety rules, and project fabricator standards.',
    tier: 'Functional',
    status: 'Active',
    frameworkVersion: 'V1.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    levels: [
      { id: 'lvl-func07-1', competencyId: 'comp-tekla-func-07', level: 1, levelName: 'Novice', behaviorDescription: 'Recognizes standard AISC profile designations, standard hole sizes, minimum bolt edge distances, and gauge dimensions.', frameworkVersion: 'V1.0' },
      { id: 'lvl-func07-2', competencyId: 'comp-tekla-func-07', level: 2, levelName: 'Developing', behaviorDescription: 'Applies NISD standard detailing conventions, column splice OSHA rules (4 bolts min), and fabricator-specific weld/bolt standards.', frameworkVersion: 'V1.0' },
      { id: 'lvl-func07-3', competencyId: 'comp-tekla-func-07', level: 3, levelName: 'Proficient', behaviorDescription: 'Demonstrates thorough mastery of AISC 360, AISC 341 (seismic provisions), RCSC bolt specifications, and galvanized coating vent hole rules.', frameworkVersion: 'V1.0' },
      { id: 'lvl-func07-4', competencyId: 'comp-tekla-func-07', level: 4, levelName: 'Expert', behaviorDescription: 'Interprets conflicting international codes (AISC vs Eurocode vs BS); audits compliance on critical infrastructure projects.', frameworkVersion: 'V1.0' }
    ]
  },
  {
    id: 'comp-tekla-func-08',
    departmentId: 'dept-tekla',
    code: 'FUNC-08',
    name: 'Productivity, Accuracy & Output Control',
    description: 'Meeting tonnage and sheet output benchmarks, zero rework, rapid revision turnaround, and high production efficiency.',
    tier: 'Functional',
    status: 'Active',
    frameworkVersion: 'V1.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    levels: [
      { id: 'lvl-func08-1', competencyId: 'comp-tekla-func-08', level: 1, levelName: 'Novice', behaviorDescription: 'Maintains steady progress on standard modeling tasks (10-15 tons/day simple steel) with acceptable first-pass accuracy.', frameworkVersion: 'V1.0' },
      { id: 'lvl-func08-2', competencyId: 'comp-tekla-func-08', level: 2, levelName: 'Developing', behaviorDescription: 'Consistently meets target productivity (25-35 tons/day medium complexity) with <5% checker markup rate.', frameworkVersion: 'V1.0' },
      { id: 'lvl-func08-3', competencyId: 'comp-tekla-func-08', level: 3, levelName: 'Proficient', behaviorDescription: 'Delivers high-volume output (50+ tons/day or complex misc steel packages) with near-zero error rates and rapid cycle times.', frameworkVersion: 'V1.0' },
      { id: 'lvl-func08-4', competencyId: 'comp-tekla-func-08', level: 4, levelName: 'Expert', behaviorDescription: 'Sets industry-leading productivity benchmarks; establishes workflow accelerators that multiply overall team throughput.', frameworkVersion: 'V1.0' }
    ]
  },
  {
    id: 'comp-tekla-func-09',
    departmentId: 'dept-tekla',
    code: 'FUNC-09',
    name: 'NC / DXF File Generation & Fabrication Data Export',
    description: 'Exporting CNC DSTV files, plate DXF contours, KISS / FabTrol / FabSuite data, bolt summaries, and shipping lists.',
    tier: 'Functional',
    status: 'Active',
    frameworkVersion: 'V1.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    levels: [
      { id: 'lvl-func09-1', competencyId: 'comp-tekla-func-09', level: 1, levelName: 'Novice', behaviorDescription: 'Generates standard NC files and plate DXFs from Tekla model under supervision.', frameworkVersion: 'V1.0' },
      { id: 'lvl-func09-2', competencyId: 'comp-tekla-func-09', level: 2, levelName: 'Developing', behaviorDescription: 'Verifies NC file header data, plate orientation, inner radius contouring, and exports KISS/MIS data packages accurately.', frameworkVersion: 'V1.0' },
      { id: 'lvl-func09-3', competencyId: 'comp-tekla-func-09', level: 3, levelName: 'Proficient', behaviorDescription: 'Troubleshoots complex robotic welding NC data, CNC drill/saw machine compatibility, bevel cuts, and scribe marking lines.', frameworkVersion: 'V1.0' },
      { id: 'lvl-func09-4', competencyId: 'comp-tekla-func-09', level: 4, levelName: 'Expert', behaviorDescription: 'Integrates automated data exchange pipelines between Tekla, ERP systems (STRUMIS, FabSuite), and automated fabrication machinery.', frameworkVersion: 'V1.0' }
    ]
  },
  {
    id: 'comp-tekla-func-10',
    departmentId: 'dept-tekla',
    code: 'FUNC-10',
    name: 'RFI Generation & Engineering Clarification Handling',
    description: 'Identifying contract drawing ambiguities, formulating technical Requests for Information (RFIs) with proposed solutions and sketches.',
    tier: 'Functional',
    status: 'Active',
    frameworkVersion: 'V1.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    levels: [
      { id: 'lvl-func10-1', competencyId: 'comp-tekla-func-10', level: 1, levelName: 'Novice', behaviorDescription: 'Identifies clear drawing discrepancies and brings them to team lead with sheet and grid references.', frameworkVersion: 'V1.0' },
      { id: 'lvl-func10-2', competencyId: 'comp-tekla-func-10', level: 2, levelName: 'Developing', behaviorDescription: 'Drafts comprehensive RFI questionnaires complete with 3D Tekla snapshots, proposed framing alternatives, and affected sheet lists.', frameworkVersion: 'V1.0' },
      { id: 'lvl-func10-3', competencyId: 'comp-tekla-func-10', level: 3, levelName: 'Proficient', behaviorDescription: 'Communicates directly with Engineer of Record (EOR) to resolve critical connection ambiguities; tracks RFI status to prevent schedule delays.', frameworkVersion: 'V1.0' },
      { id: 'lvl-func10-4', competencyId: 'comp-tekla-func-10', level: 4, levelName: 'Expert', behaviorDescription: 'Defines RFI escalation management protocols; conducts pre-detailing design reviews that preemptively identify 80%+ of engineering gaps.', frameworkVersion: 'V1.0' }
    ]
  },
  {
    id: 'comp-tekla-func-11',
    departmentId: 'dept-tekla',
    code: 'FUNC-11',
    name: 'Checking & Verification Methodology',
    description: 'Performing comprehensive structural model checks, drawing markups, bill of materials audit, connection verification, and back-checking.',
    tier: 'Functional',
    status: 'Active',
    frameworkVersion: 'V1.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    levels: [
      { id: 'lvl-func11-1', competencyId: 'comp-tekla-func-11', level: 1, levelName: 'Novice', behaviorDescription: 'Performs self-checking using standard checklist; verifies part numbers, material grades, and overall lengths.', frameworkVersion: 'V1.0' },
      { id: 'lvl-func11-2', competencyId: 'comp-tekla-func-11', level: 2, levelName: 'Developing', behaviorDescription: 'Conducts thorough model checking for simple framing; checks bolt edge distances, weld symbols, and clear clearances systematically.', frameworkVersion: 'V1.0' },
      { id: 'lvl-func11-3', competencyId: 'comp-tekla-func-11', level: 3, levelName: 'Proficient', behaviorDescription: 'Checks complex multi-story structures, heavy industrial framing, skewed trusses, and shop drawings with near-zero missed markups.', frameworkVersion: 'V1.0' },
      { id: 'lvl-func11-4', competencyId: 'comp-tekla-func-11', level: 4, levelName: 'Expert', behaviorDescription: 'Serves as Principal Checker / Chief Inspector; establishes company checking workflows, audit guidelines, and quality rating scorecards.', frameworkVersion: 'V1.0' }
    ]
  },
  {
    id: 'comp-tekla-func-12',
    departmentId: 'dept-tekla',
    code: 'FUNC-12',
    name: 'Structural Framing Interpretation & Contract Drawings',
    description: 'Reading and comprehending architectural, structural, MEP, and connection design drawings, general notes, and specifications.',
    tier: 'Functional',
    status: 'Active',
    frameworkVersion: 'V1.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    levels: [
      { id: 'lvl-func12-1', competencyId: 'comp-tekla-func-12', level: 1, levelName: 'Novice', behaviorDescription: 'Understands basic structural plans, column schedules, beam sizes, grid layouts, and typical detail callouts.', frameworkVersion: 'V1.0' },
      { id: 'lvl-func12-2', competencyId: 'comp-tekla-func-12', level: 2, levelName: 'Developing', behaviorDescription: 'Correlates structural framing plans with architectural elevations, section cuts, roof slopes, and general structural notes accurately.', frameworkVersion: 'V1.0' },
      { id: 'lvl-func12-3', competencyId: 'comp-tekla-func-12', level: 3, levelName: 'Proficient', behaviorDescription: 'Deciphers complex engineering intent across conflicting disciplines (structural vs architectural vs MEP); anticipates constructability requirements.', frameworkVersion: 'V1.0' },
      { id: 'lvl-func12-4', competencyId: 'comp-tekla-func-12', level: 4, levelName: 'Expert', behaviorDescription: 'Acts as technical authority on contract drawing interpretation; leads design coordination meetings with EOR and architects.', frameworkVersion: 'V1.0' }
    ]
  },
  {
    id: 'comp-tekla-func-13',
    departmentId: 'dept-tekla',
    code: 'FUNC-13',
    name: 'Revision Management & Delta Control',
    description: 'Tracking design drawing revisions (Addenda, Bulletins, ASIs), model changes, drawing clouding, and revision history documentation.',
    tier: 'Functional',
    status: 'Active',
    frameworkVersion: 'V1.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    levels: [
      { id: 'lvl-func13-1', competencyId: 'comp-tekla-func-13', level: 1, levelName: 'Novice', behaviorDescription: 'Applies revision marks, clouds, and descriptions to drawing titles according to markups.', frameworkVersion: 'V1.0' },
      { id: 'lvl-func13-2', competencyId: 'comp-tekla-func-13', level: 2, levelName: 'Developing', behaviorDescription: 'Compares revision design drawings with model, identifies modified/added members, updates model, and generates revision delta BOMs.', frameworkVersion: 'V1.0' },
      { id: 'lvl-func13-3', competencyId: 'comp-tekla-func-13', level: 3, levelName: 'Proficient', behaviorDescription: 'Executes complex revision rollouts across hundreds of active shop drawings, ensuring fabrication hold marks and delta releases are tracked flawlessly.', frameworkVersion: 'V1.0' },
      { id: 'lvl-func13-4', competencyId: 'comp-tekla-func-13', level: 4, levelName: 'Expert', behaviorDescription: 'Manages major scope revisions and change orders; provides comprehensive impact analysis and fabrication delta costing reports.', frameworkVersion: 'V1.0' }
    ]
  },
  {
    id: 'comp-tekla-func-14',
    departmentId: 'dept-tekla',
    code: 'FUNC-14',
    name: 'Custom Components & Parametric Detailing',
    description: 'Developing parametric custom connections, custom parts, seam components, and detail components with binding variables and equations.',
    tier: 'Functional',
    status: 'Active',
    frameworkVersion: 'V1.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    levels: [
      { id: 'lvl-func14-1', competencyId: 'comp-tekla-func-14', level: 1, levelName: 'Novice', behaviorDescription: 'Explodes and modifies simple custom components; applies existing catalog custom components accurately.', frameworkVersion: 'V1.0' },
      { id: 'lvl-func14-2', competencyId: 'comp-tekla-func-14', level: 2, levelName: 'Developing', behaviorDescription: 'Creates non-parametric custom parts and simple connections for repetitive detailing conditions.', frameworkVersion: 'V1.0' },
      { id: 'lvl-func14-3', competencyId: 'comp-tekla-func-14', level: 3, levelName: 'Proficient', behaviorDescription: 'Builds fully parametric custom components using distance variables, parameter equations, and automatic profile selection logic.', frameworkVersion: 'V1.0' },
      { id: 'lvl-func14-4', competencyId: 'comp-tekla-func-14', level: 4, levelName: 'Expert', behaviorDescription: 'Architects enterprise-grade custom component suites with dialog box definition (.inp files) and automated calculation formulas.', frameworkVersion: 'V1.0' }
    ]
  },
  {
    id: 'comp-tekla-func-15',
    departmentId: 'dept-tekla',
    code: 'FUNC-15',
    name: 'Project Setup & Environment Customization',
    description: 'Configuring project firm folders, numbering setup, drawing classifiers, title block attributes, role settings, and template editors.',
    tier: 'Functional',
    status: 'Active',
    frameworkVersion: 'V1.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    levels: [
      { id: 'lvl-func15-1', competencyId: 'comp-tekla-func-15', level: 1, levelName: 'Novice', behaviorDescription: 'Opens models with correct environment and role configurations; understands project folder structures.', frameworkVersion: 'V1.0' },
      { id: 'lvl-func15-2', competencyId: 'comp-tekla-func-15', level: 2, levelName: 'Developing', behaviorDescription: 'Sets up project numbering series, phase/lot settings, and standard drawing title block attributes.', frameworkVersion: 'V1.0' },
      { id: 'lvl-func15-3', competencyId: 'comp-tekla-func-15', level: 3, levelName: 'Proficient', behaviorDescription: 'Configures complete firm folders, custom report templates in Template Editor (.tpl), and custom drawing layout rules.', frameworkVersion: 'V1.0' },
      { id: 'lvl-func15-4', competencyId: 'comp-tekla-func-15', level: 4, levelName: 'Expert', behaviorDescription: 'Deploys customized enterprise Tekla environments, multi-user server administration, and cross-office standardization protocols.', frameworkVersion: 'V1.0' }
    ]
  },
  {
    id: 'comp-tekla-func-16',
    departmentId: 'dept-tekla',
    code: 'FUNC-16',
    name: 'Advanced Tekla Open API & Scripting / Macros',
    description: 'Developing custom C# .NET plugins, Tekla Open API automated tools, macro scripts, and batch processing utilities.',
    tier: 'Functional',
    status: 'Active',
    frameworkVersion: 'V1.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    levels: [
      { id: 'lvl-func16-1', competencyId: 'comp-tekla-func-16', level: 1, levelName: 'Novice', behaviorDescription: 'Executes recorded macros and pre-installed Open API plugins effectively within the Tekla interface.', frameworkVersion: 'V1.0' },
      { id: 'lvl-func16-2', competencyId: 'comp-tekla-func-16', level: 2, levelName: 'Developing', behaviorDescription: 'Records and customizes simple Tekla keystroke macros (.cs / .mac) to automate repetitive modeling sequences.', frameworkVersion: 'V1.0' },
      { id: 'lvl-func16-3', competencyId: 'comp-tekla-func-16', level: 3, levelName: 'Proficient', behaviorDescription: 'Develops standalone C# Tekla Open API applications to automate drawing exports, clash filtering, and custom attribute injection.', frameworkVersion: 'V1.0' },
      { id: 'lvl-func16-4', competencyId: 'comp-tekla-func-16', level: 4, levelName: 'Expert', behaviorDescription: 'Architects enterprise Tekla Open API extensions and AI-assisted automation toolsets used across global operations.', frameworkVersion: 'V1.0' }
    ]
  },
  {
    id: 'comp-tekla-func-17',
    departmentId: 'dept-tekla',
    code: 'FUNC-17',
    name: 'Anchor Bolt Layout & Foundation Interface Detailing',
    description: 'Anchor rod plans, embed plates, setting templates, grouting allowances, foundation coordinate verification, and edge distance checks.',
    tier: 'Functional',
    status: 'Active',
    frameworkVersion: 'V1.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    levels: [
      { id: 'lvl-func17-1', competencyId: 'comp-tekla-func-17', level: 1, levelName: 'Novice', behaviorDescription: 'Models standard anchor rods and base plates according to structural schedules with supervisor review.', frameworkVersion: 'V1.0' },
      { id: 'lvl-func17-2', competencyId: 'comp-tekla-func-17', level: 2, levelName: 'Developing', behaviorDescription: 'Creates clear Anchor Bolt Layout (AB) erection plans with grout thickness notes, bolt projection callouts, and template details.', frameworkVersion: 'V1.0' },
      { id: 'lvl-func17-3', competencyId: 'comp-tekla-func-17', level: 3, levelName: 'Proficient', behaviorDescription: 'Coordinates complex embedment angles, shear keys, heavy equipment foundation embed plates, and foundation step details.', frameworkVersion: 'V1.0' },
      { id: 'lvl-func17-4', competencyId: 'comp-tekla-func-17', level: 4, levelName: 'Expert', behaviorDescription: 'Audits global anchor bolt and civil foundation interfaces; eliminates costly foundation field modifications before concrete pour.', frameworkVersion: 'V1.0' }
    ]
  },
  {
    id: 'comp-tekla-func-18',
    departmentId: 'dept-tekla',
    code: 'FUNC-18',
    name: 'Complex Stair, Handrail & Industrial Egress Detailing',
    description: 'Stringer geometry, pan treads, checker plate landings, pipe/tube handrail turns, safety gates, toe plates, and IBC/OSHA egress compliance.',
    tier: 'Functional',
    status: 'Active',
    frameworkVersion: 'V1.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    levels: [
      { id: 'lvl-func18-1', competencyId: 'comp-tekla-func-18', level: 1, levelName: 'Novice', behaviorDescription: 'Models straight industrial stair stringers and basic infill pan steps using standard component 1039.', frameworkVersion: 'V1.0' },
      { id: 'lvl-func18-2', competencyId: 'comp-tekla-func-18', level: 2, levelName: 'Developing', behaviorDescription: 'Details multi-flight switchback stairs with intermediate support posts, continuous pipe handrails, and smooth corner transitions.', frameworkVersion: 'V1.0' },
      { id: 'lvl-func18-3', competencyId: 'comp-tekla-func-18', level: 3, levelName: 'Proficient', behaviorDescription: 'Designs intricate monumental architectural stairs, helical/spiral stair configurations, glass railing supports, and industrial cage ladders.', frameworkVersion: 'V1.0' },
      { id: 'lvl-func18-4', competencyId: 'comp-tekla-func-18', level: 4, levelName: 'Expert', behaviorDescription: 'Establishes department-wide egress detailing standards complying 100% with IBC, NFPA, and OSHA regulations across varied jurisdictions.', frameworkVersion: 'V1.0' }
    ]
  },
  {
    id: 'comp-tekla-func-19',
    departmentId: 'dept-tekla',
    code: 'FUNC-19',
    name: 'Heavy Industrial & Plate Girder / Truss Detailing',
    description: 'Built-up box columns, plate girders with intermediate stiffeners, crane runway girders, surge trusses, and heavy industrial duct supports.',
    tier: 'Functional',
    status: 'Active',
    frameworkVersion: 'V1.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    levels: [
      { id: 'lvl-func19-1', competencyId: 'comp-tekla-func-19', level: 1, levelName: 'Novice', behaviorDescription: 'Understands built-up profile modeling tools; models simple web/flange plate assemblies with fillet welds.', frameworkVersion: 'V1.0' },
      { id: 'lvl-func19-2', competencyId: 'comp-tekla-func-19', level: 2, levelName: 'Developing', behaviorDescription: 'Models plate girders with bearing and transverse stiffeners, bottom flange tension flange restrictions, and splice plates.', frameworkVersion: 'V1.0' },
      { id: 'lvl-func19-3', competencyId: 'comp-tekla-func-19', level: 3, levelName: 'Proficient', behaviorDescription: 'Details heavy industrial crane runways, complex box girders with internal diaphragm stiffeners, and camber curves.', frameworkVersion: 'V1.0' },
      { id: 'lvl-func19-4', competencyId: 'comp-tekla-func-19', level: 4, levelName: 'Expert', behaviorDescription: 'Leads detailing on mega-industrial plants (refineries, power plants, smelters); standardizes weld distortion control detailing.', frameworkVersion: 'V1.0' }
    ]
  },
  {
    id: 'comp-tekla-func-20',
    departmentId: 'dept-tekla',
    code: 'FUNC-20',
    name: 'BIM Coordination, IFC & Multi-Discipline Interoperability',
    description: 'IFC export property sets, Trimble Connect live collaboration, Navisworks clash federation, point cloud overlays, and Revit integration.',
    tier: 'Functional',
    status: 'Active',
    frameworkVersion: 'V1.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    levels: [
      { id: 'lvl-func20-1', competencyId: 'comp-tekla-func-20', level: 1, levelName: 'Novice', behaviorDescription: 'Imports reference models (IFC, DWG) into Tekla and aligns coordinate origin points properly.', frameworkVersion: 'V1.0' },
      { id: 'lvl-func20-2', competencyId: 'comp-tekla-func-20', level: 2, levelName: 'Developing', behaviorDescription: 'Exports accurate IFC models with user-defined property sets (UDAs) for client BIM coordination meetings.', frameworkVersion: 'V1.0' },
      { id: 'lvl-func20-3', competencyId: 'comp-tekla-func-20', level: 3, levelName: 'Proficient', behaviorDescription: 'Manages multi-discipline BIM federation in Trimble Connect / Navisworks; aligns 3D point cloud scans against detailing geometry.', frameworkVersion: 'V1.0' },
      { id: 'lvl-func20-4', competencyId: 'comp-tekla-func-20', level: 4, levelName: 'Expert', behaviorDescription: 'Leads global BIM execution planning (BEP); integrates full LOD 400 fabrication models into digital twin platforms.', frameworkVersion: 'V1.0' }
    ]
  },

  // =========================================================================
  // LEADERSHIP COMPETENCIES (10 Competencies - 4 Levels Each)
  // Exact source from: Tekla - Competency Framework Definitions & Behavioral Indicators
  // =========================================================================
  {
    id: 'comp-tekla-lead-01',
    departmentId: 'dept-tekla',
    code: 'LEAD-01',
    name: 'Strategic Thinking',
    description: 'Aligns Tekla detailing operations with organizational business goals, profitability targets, technological innovation, and long-term vision.',
    tier: 'Leadership',
    status: 'Active',
    frameworkVersion: 'V1.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    levels: [
      { id: 'lvl-lead01-1', competencyId: 'comp-tekla-lead-01', level: 1, levelName: 'Novice', behaviorDescription: 'Understands how detailing accuracy and on-time delivery directly impact business success and client retention.', frameworkVersion: 'V1.0' },
      { id: 'lvl-lead01-2', competencyId: 'comp-tekla-lead-01', level: 2, levelName: 'Developing', behaviorDescription: 'Identifies operational waste, unnecessary detailing cycles, and recommends streamlined workflows.', frameworkVersion: 'V1.0' },
      { id: 'lvl-lead01-3', competencyId: 'comp-tekla-lead-01', level: 3, levelName: 'Proficient', behaviorDescription: 'Formulates departmental productivity goals; optimizes gross margin per ton and implements lean detailing practices.', frameworkVersion: 'V1.0' },
      { id: 'lvl-lead01-4', competencyId: 'comp-tekla-lead-01', level: 4, levelName: 'Expert', behaviorDescription: 'Defines long-term technical and commercial strategy for the Tekla division; expands market presence across international territories.', frameworkVersion: 'V1.0' }
    ]
  },
  {
    id: 'comp-tekla-lead-02',
    departmentId: 'dept-tekla',
    code: 'LEAD-02',
    name: 'Execution & Results',
    description: 'Estimates detailing hours, plans model slicing and drawing issue sequences, manages RFI turnaround, and drives milestone completions.',
    tier: 'Leadership',
    status: 'Active',
    frameworkVersion: 'V1.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    levels: [
      { id: 'lvl-lead02-1', competencyId: 'comp-tekla-lead-02', level: 1, levelName: 'Novice', behaviorDescription: 'Understands project schedule breakdown, sequence zones, and tracking sheet entries.', frameworkVersion: 'V1.0' },
      { id: 'lvl-lead02-2', competencyId: 'comp-tekla-lead-02', level: 2, levelName: 'Developing', behaviorDescription: 'Tracks sequence-level drawing progress; coordinates sub-assembly releases with checking bandwidth.', frameworkVersion: 'V1.0' },
      { id: 'lvl-lead02-3', competencyId: 'comp-tekla-lead-02', level: 3, levelName: 'Proficient', behaviorDescription: 'Develops comprehensive project execution plans, sequence milestone schedules, and resource loading matrices.', frameworkVersion: 'V1.0' },
      { id: 'lvl-lead02-4', competencyId: 'comp-tekla-lead-02', level: 4, levelName: 'Expert', behaviorDescription: 'Directs multi-project portfolio delivery; optimizes cross-project resource utilization, risk mitigation, and client milestone commitments.', frameworkVersion: 'V1.0' }
    ]
  },
  {
    id: 'comp-tekla-lead-03',
    departmentId: 'dept-tekla',
    code: 'LEAD-03',
    name: 'People Leadership',
    description: 'Builds high-performing detailing teams, motivates staff, fosters talent development, and drives positive team culture and morale.',
    tier: 'Leadership',
    status: 'Active',
    frameworkVersion: 'V1.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    levels: [
      { id: 'lvl-lead03-1', competencyId: 'comp-tekla-lead-03', level: 1, levelName: 'Novice', behaviorDescription: 'Shares basic modeling shortcuts with peers; open to constructive feedback from senior mentors.', frameworkVersion: 'V1.0' },
      { id: 'lvl-lead03-2', competencyId: 'comp-tekla-lead-03', level: 2, levelName: 'Developing', behaviorDescription: 'Assists junior trainees with connection setup and drawing editing; provides constructive review notes on simple parts.', frameworkVersion: 'V1.0' },
      { id: 'lvl-lead03-3', competencyId: 'comp-tekla-lead-03', level: 3, levelName: 'Proficient', behaviorDescription: 'Structures structured on-the-job training; systematically elevates junior modelers to independent production capability.', frameworkVersion: 'V1.0' },
      { id: 'lvl-lead03-4', competencyId: 'comp-tekla-lead-03', level: 4, levelName: 'Expert', behaviorDescription: 'Designs department-wide mentoring frameworks; builds technical talent pipelines and trains future leads and checkers.', frameworkVersion: 'V1.0' }
    ]
  },
  {
    id: 'comp-tekla-lead-04',
    departmentId: 'dept-tekla',
    code: 'LEAD-04',
    name: 'Coaching & Feedback',
    description: 'Guides modelers and checkers on detailing best practices, constructability principles, objective competency feedback, and career growth.',
    tier: 'Leadership',
    status: 'Active',
    frameworkVersion: 'V1.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    levels: [
      { id: 'lvl-lead04-1', competencyId: 'comp-tekla-lead-04', level: 1, levelName: 'Novice', behaviorDescription: 'Participates actively in self-assessments; receptive to constructive feedback from team leaders.', frameworkVersion: 'V1.0' },
      { id: 'lvl-lead04-2', competencyId: 'comp-tekla-lead-04', level: 2, levelName: 'Developing', behaviorDescription: 'Provides specific, evidence-based feedback on peer check sheets and drawing accuracy.', frameworkVersion: 'V1.0' },
      { id: 'lvl-lead04-3', competencyId: 'comp-tekla-lead-04', level: 3, levelName: 'Proficient', behaviorDescription: 'Conducts formal quarterly competency evaluations; builds targeted individual development plans (IDPs) and tracks training impact.', frameworkVersion: 'V1.0' },
      { id: 'lvl-lead04-4', competencyId: 'comp-tekla-lead-04', level: 4, levelName: 'Expert', behaviorDescription: 'Builds enterprise performance appraisal and talent calibration systems that drive technical excellence and merit-based promotion.', frameworkVersion: 'V1.0' }
    ]
  },
  {
    id: 'comp-tekla-lead-05',
    departmentId: 'dept-tekla',
    code: 'LEAD-05',
    name: 'Stakeholder Management',
    description: 'Builds strong relationships with fabricators, general contractors, engineering firms, project managers, and internal business leaders.',
    tier: 'Leadership',
    status: 'Active',
    frameworkVersion: 'V1.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    levels: [
      { id: 'lvl-lead05-1', competencyId: 'comp-tekla-lead-05', level: 1, levelName: 'Novice', behaviorDescription: 'Understands client project directory, escalation hierarchy, and professional correspondence etiquette.', frameworkVersion: 'V1.0' },
      { id: 'lvl-lead05-2', competencyId: 'comp-tekla-lead-05', level: 2, levelName: 'Developing', behaviorDescription: 'Participates in weekly client progress calls; prepares agenda notes and clear drawing release logs.', frameworkVersion: 'V1.0' },
      { id: 'lvl-lead05-3', competencyId: 'comp-tekla-lead-05', level: 3, levelName: 'Proficient', behaviorDescription: 'Manages difficult client situations, scope changes, and drawing revision approval discussions diplomatically.', frameworkVersion: 'V1.0' },
      { id: 'lvl-lead05-4', competencyId: 'comp-tekla-lead-05', level: 4, levelName: 'Expert', behaviorDescription: 'Operates as trusted strategic advisor to major international steel fabricators and general contractors.', frameworkVersion: 'V1.0' }
    ]
  },
  {
    id: 'comp-tekla-lead-06',
    departmentId: 'dept-tekla',
    code: 'LEAD-06',
    name: 'Change Leadership',
    description: 'Champions new detailing software versions, automated cloud tools, Trimble Connect integrations, and operational transformations.',
    tier: 'Leadership',
    status: 'Active',
    frameworkVersion: 'V1.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    levels: [
      { id: 'lvl-lead06-1', competencyId: 'comp-tekla-lead-06', level: 1, levelName: 'Novice', behaviorDescription: 'Embraces new detailing tools and workflow updates positively with an eagerness to learn.', frameworkVersion: 'V1.0' },
      { id: 'lvl-lead06-2', competencyId: 'comp-tekla-lead-06', level: 2, levelName: 'Developing', behaviorDescription: 'Pilots new software extensions, documents step-by-step user guides, and assists peers during software rollouts.', frameworkVersion: 'V1.0' },
      { id: 'lvl-lead06-3', competencyId: 'comp-tekla-lead-06', level: 3, levelName: 'Proficient', behaviorDescription: 'Drives digital transformation initiatives across detailing projects; measures ROI on automation tools and overcomes team inertia.', frameworkVersion: 'V1.0' },
      { id: 'lvl-lead06-4', competencyId: 'comp-tekla-lead-06', level: 4, levelName: 'Expert', behaviorDescription: 'Spearheads disruptive technological innovation in structural detailing and AI-integrated engineering workflows.', frameworkVersion: 'V1.0' }
    ]
  },
  {
    id: 'comp-tekla-lead-07',
    departmentId: 'dept-tekla',
    code: 'LEAD-07',
    name: 'Decision Making',
    description: 'Makes definitive, authoritative decisions on connection constructability, scope boundaries, and delivery compromises under pressure.',
    tier: 'Leadership',
    status: 'Active',
    frameworkVersion: 'V1.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    levels: [
      { id: 'lvl-lead07-1', competencyId: 'comp-tekla-lead-07', level: 1, levelName: 'Novice', behaviorDescription: 'Handles differing technical opinions professionally; seeks senior guidance for unresolved modeling ambiguities.', frameworkVersion: 'V1.0' },
      { id: 'lvl-lead07-2', competencyId: 'comp-tekla-lead-07', level: 2, levelName: 'Developing', behaviorDescription: 'Mediates checking markup disagreements using AISC/NISD codes and contract design drawings as objective criteria.', frameworkVersion: 'V1.0' },
      { id: 'lvl-lead07-3', competencyId: 'comp-tekla-lead-07', level: 3, levelName: 'Proficient', behaviorDescription: 'Makes definitive, authoritative decisions on complex connection constructability under tight delivery constraints.', frameworkVersion: 'V1.0' },
      { id: 'lvl-lead07-4', competencyId: 'comp-tekla-lead-07', level: 4, levelName: 'Expert', behaviorDescription: 'Resolves high-stakes client and multi-discipline contractual disputes with win-win outcomes that safeguard project profitability.', frameworkVersion: 'V1.0' }
    ]
  },
  {
    id: 'comp-tekla-lead-08',
    departmentId: 'dept-tekla',
    code: 'LEAD-08',
    name: 'Cross-functional Collaboration',
    description: 'Bridges detailing with estimation, connection engineering, fabrication shop management, erection contractors, and PMO.',
    tier: 'Leadership',
    status: 'Active',
    frameworkVersion: 'V1.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    levels: [
      { id: 'lvl-lead08-1', competencyId: 'comp-tekla-lead-08', level: 1, levelName: 'Novice', behaviorDescription: 'Understands roles of estimation, connection design, fabrication, and erection in the structural lifecycle.', frameworkVersion: 'V1.0' },
      { id: 'lvl-lead08-2', competencyId: 'comp-tekla-lead-08', level: 2, levelName: 'Developing', behaviorDescription: 'Coordinates directly with connection design engineers to clarify calculation assumptions and weld details.', frameworkVersion: 'V1.0' },
      { id: 'lvl-lead08-3', competencyId: 'comp-tekla-lead-08', level: 3, levelName: 'Proficient', behaviorDescription: 'Synchronizes detailing production with fabrication shop scheduling and erection site crane availability seamlessly.', frameworkVersion: 'V1.0' },
      { id: 'lvl-lead08-4', competencyId: 'comp-tekla-lead-08', level: 4, levelName: 'Expert', behaviorDescription: 'Unifies engineering, commercial, fabrication, and erection business units into an integrated, frictionless delivery pipeline.', frameworkVersion: 'V1.0' }
    ]
  },
  {
    id: 'comp-tekla-lead-09',
    departmentId: 'dept-tekla',
    code: 'LEAD-09',
    name: 'Business & Financial Acumen',
    description: 'Understands project pricing, detailing man-hour budgets, contract change order recovery, and operational profitability metrics.',
    tier: 'Leadership',
    status: 'Active',
    frameworkVersion: 'V1.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    levels: [
      { id: 'lvl-lead09-1', competencyId: 'comp-tekla-lead-09', level: 1, levelName: 'Novice', behaviorDescription: 'Understands the concept of budgeted hours per sheet/ton and logs detailing time accurately against correct project codes.', frameworkVersion: 'V1.0' },
      { id: 'lvl-lead09-2', competencyId: 'comp-tekla-lead-09', level: 2, levelName: 'Developing', behaviorDescription: 'Tracks task completion hours against budgeted estimates; flags scope changes that may qualify for change orders.', frameworkVersion: 'V1.0' },
      { id: 'lvl-lead09-3', competencyId: 'comp-tekla-lead-09', level: 3, levelName: 'Proficient', behaviorDescription: 'Manages project-level P&L; prices scope revisions, maximizes billable utilization, and prevents unapproved out-of-scope work.', frameworkVersion: 'V1.0' },
      { id: 'lvl-lead09-4', competencyId: 'comp-tekla-lead-09', level: 4, levelName: 'Expert', behaviorDescription: 'Optimizes division financial performance; develops commercial pricing structures, contract models, and multi-million dollar master service agreements.', frameworkVersion: 'V1.0' }
    ]
  },
  {
    id: 'comp-tekla-lead-10',
    departmentId: 'dept-tekla',
    code: 'LEAD-10',
    name: 'Culture & Ethics Stewardship',
    description: 'Instills engineering ethics, quality dedication, workplace safety, zero-defect culture, and professional integrity across the organization.',
    tier: 'Leadership',
    status: 'Active',
    frameworkVersion: 'V1.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    levels: [
      { id: 'lvl-lead10-1', competencyId: 'comp-tekla-lead-10', level: 1, levelName: 'Novice', behaviorDescription: 'Demonstrates personal dedication to company core values, transparent error disclosure, and respectful team interactions.', frameworkVersion: 'V1.0' },
      { id: 'lvl-lead10-2', competencyId: 'comp-tekla-lead-10', level: 2, levelName: 'Developing', behaviorDescription: 'Actively promotes zero-defect checking culture and reinforces quality expectations in team discussions.', frameworkVersion: 'V1.0' },
      { id: 'lvl-lead10-3', competencyId: 'comp-tekla-lead-10', level: 3, levelName: 'Proficient', behaviorDescription: 'Leads ethical calibration across project teams; enforces compliance with engineering safety standards with zero tolerance for shortcuts.', frameworkVersion: 'V1.0' },
      { id: 'lvl-lead10-4', competencyId: 'comp-tekla-lead-10', level: 4, levelName: 'Expert', behaviorDescription: 'Shapes company-wide culture of engineering integrity, craftsmanship, and international standard excellence recognized across the industry.', frameworkVersion: 'V1.0' }
    ]
  }
];

// =========================================================================
// 10 TEKLA ROLES DEFINITION
// =========================================================================
export const SEED_TEKLA_ROLES: TrainingRole[] = [
  {
    id: 'role-tekla-trainee-modeler',
    departmentId: 'dept-tekla',
    roleName: 'Trainee Modeler',
    status: 'Active',
    frameworkVersion: 'V1.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'role-tekla-assoc-modeler',
    departmentId: 'dept-tekla',
    roleName: 'Associate Modeler',
    status: 'Active',
    frameworkVersion: 'V1.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'role-tekla-modeler',
    departmentId: 'dept-tekla',
    roleName: 'Modeler',
    status: 'Active',
    frameworkVersion: 'V1.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'role-tekla-sr-modeler',
    departmentId: 'dept-tekla',
    roleName: 'Senior Modeler',
    status: 'Active',
    frameworkVersion: 'V1.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'role-tekla-assoc-checker',
    departmentId: 'dept-tekla',
    roleName: 'Associate Checker',
    status: 'Active',
    frameworkVersion: 'V1.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'role-tekla-checker',
    departmentId: 'dept-tekla',
    roleName: 'Checker',
    status: 'Active',
    frameworkVersion: 'V1.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'role-tekla-sr-checker',
    departmentId: 'dept-tekla',
    roleName: 'Senior Checker',
    status: 'Active',
    frameworkVersion: 'V1.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'role-tekla-team-lead',
    departmentId: 'dept-tekla',
    roleName: 'Team Lead',
    status: 'Active',
    frameworkVersion: 'V1.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'role-tekla-project-lead',
    departmentId: 'dept-tekla',
    roleName: 'Project Lead',
    status: 'Active',
    frameworkVersion: 'V1.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'role-tekla-pm',
    departmentId: 'dept-tekla',
    roleName: 'Project Manager',
    status: 'Active',
    frameworkVersion: 'V1.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Helper to generate Role Competencies with selected role sets (5–10 competencies per role) and max 5 Priority Skills
export const SEED_TEKLA_ROLE_COMPETENCIES: TrainingRoleCompetency[] = [
  // ----------------------------------------------------
  // 1. Trainee Modeler (7 Assigned: 2 Core, 4 Functional, 1 Leadership, 5 Priority Skills)
  // ----------------------------------------------------
  { id: 'rc-tm-c1', departmentId: 'dept-tekla', roleId: 'role-tekla-trainee-modeler', competencyId: 'comp-tekla-core-01', requiredLevel: 1, isPrioritySkill: false, weight: 1.0, status: 'Active' },
  { id: 'rc-tm-c2', departmentId: 'dept-tekla', roleId: 'role-tekla-trainee-modeler', competencyId: 'comp-tekla-core-02', requiredLevel: 1, isPrioritySkill: false, weight: 1.0, status: 'Active' },
  // Priority Skills (4 Functional + 1 Leadership = 5 Priority Skills)
  { id: 'rc-tm-f1', departmentId: 'dept-tekla', roleId: 'role-tekla-trainee-modeler', competencyId: 'comp-tekla-func-01', requiredLevel: 1, isPrioritySkill: true, priorityOrder: 1, weight: 1.5, status: 'Active' },
  { id: 'rc-tm-f2', departmentId: 'dept-tekla', roleId: 'role-tekla-trainee-modeler', competencyId: 'comp-tekla-func-02', requiredLevel: 1, isPrioritySkill: true, priorityOrder: 2, weight: 1.5, status: 'Active' },
  { id: 'rc-tm-f4', departmentId: 'dept-tekla', roleId: 'role-tekla-trainee-modeler', competencyId: 'comp-tekla-func-04', requiredLevel: 1, isPrioritySkill: true, priorityOrder: 3, weight: 1.2, status: 'Active' },
  { id: 'rc-tm-f8', departmentId: 'dept-tekla', roleId: 'role-tekla-trainee-modeler', competencyId: 'comp-tekla-func-08', requiredLevel: 1, isPrioritySkill: true, priorityOrder: 4, weight: 1.2, status: 'Active' },
  { id: 'rc-tm-l4', departmentId: 'dept-tekla', roleId: 'role-tekla-trainee-modeler', competencyId: 'comp-tekla-lead-04', requiredLevel: 1, isPrioritySkill: true, priorityOrder: 5, weight: 1.0, status: 'Active' },

  // ----------------------------------------------------
  // 2. Associate Modeler (8 Assigned: 2 Core, 5 Functional, 1 Leadership, 5 Priority Skills)
  // ----------------------------------------------------
  { id: 'rc-am-c1', departmentId: 'dept-tekla', roleId: 'role-tekla-assoc-modeler', competencyId: 'comp-tekla-core-01', requiredLevel: 2, isPrioritySkill: false, weight: 1.0, status: 'Active' },
  { id: 'rc-am-c2', departmentId: 'dept-tekla', roleId: 'role-tekla-assoc-modeler', competencyId: 'comp-tekla-core-02', requiredLevel: 2, isPrioritySkill: false, weight: 1.0, status: 'Active' },
  // Priority Skills (5 Functional)
  { id: 'rc-am-f1', departmentId: 'dept-tekla', roleId: 'role-tekla-assoc-modeler', competencyId: 'comp-tekla-func-01', requiredLevel: 2, isPrioritySkill: true, priorityOrder: 1, weight: 1.5, status: 'Active' },
  { id: 'rc-am-f2', departmentId: 'dept-tekla', roleId: 'role-tekla-assoc-modeler', competencyId: 'comp-tekla-func-02', requiredLevel: 2, isPrioritySkill: true, priorityOrder: 2, weight: 1.5, status: 'Active' },
  { id: 'rc-am-f3', departmentId: 'dept-tekla', roleId: 'role-tekla-assoc-modeler', competencyId: 'comp-tekla-func-03', requiredLevel: 2, isPrioritySkill: true, priorityOrder: 3, weight: 1.2, status: 'Active' },
  { id: 'rc-am-f4', departmentId: 'dept-tekla', roleId: 'role-tekla-assoc-modeler', competencyId: 'comp-tekla-func-04', requiredLevel: 2, isPrioritySkill: true, priorityOrder: 4, weight: 1.5, status: 'Active' },
  { id: 'rc-am-f8', departmentId: 'dept-tekla', roleId: 'role-tekla-assoc-modeler', competencyId: 'comp-tekla-func-08', requiredLevel: 2, isPrioritySkill: true, priorityOrder: 5, weight: 1.2, status: 'Active' },
  // Leadership
  { id: 'rc-am-l4', departmentId: 'dept-tekla', roleId: 'role-tekla-assoc-modeler', competencyId: 'comp-tekla-lead-04', requiredLevel: 1, isPrioritySkill: false, weight: 1.0, status: 'Active' },

  // ----------------------------------------------------
  // 3. Modeler (8 Assigned: 2 Core, 5 Functional, 1 Leadership, 5 Priority Skills)
  // ----------------------------------------------------
  { id: 'rc-mod-c1', departmentId: 'dept-tekla', roleId: 'role-tekla-modeler', competencyId: 'comp-tekla-core-01', requiredLevel: 3, isPrioritySkill: false, weight: 1.0, status: 'Active' },
  { id: 'rc-mod-c4', departmentId: 'dept-tekla', roleId: 'role-tekla-modeler', competencyId: 'comp-tekla-core-04', requiredLevel: 3, isPrioritySkill: false, weight: 1.0, status: 'Active' },
  // Priority Skills (5 Functional)
  { id: 'rc-mod-f1', departmentId: 'dept-tekla', roleId: 'role-tekla-modeler', competencyId: 'comp-tekla-func-01', requiredLevel: 3, isPrioritySkill: true, priorityOrder: 1, weight: 1.5, status: 'Active' },
  { id: 'rc-mod-f2', departmentId: 'dept-tekla', roleId: 'role-tekla-modeler', competencyId: 'comp-tekla-func-02', requiredLevel: 3, isPrioritySkill: true, priorityOrder: 2, weight: 1.5, status: 'Active' },
  { id: 'rc-mod-f5', departmentId: 'dept-tekla', roleId: 'role-tekla-modeler', competencyId: 'comp-tekla-func-05', requiredLevel: 3, isPrioritySkill: true, priorityOrder: 3, weight: 1.2, status: 'Active' },
  { id: 'rc-mod-f6', departmentId: 'dept-tekla', roleId: 'role-tekla-modeler', competencyId: 'comp-tekla-func-06', requiredLevel: 3, isPrioritySkill: true, priorityOrder: 4, weight: 1.2, status: 'Active' },
  { id: 'rc-mod-f8', departmentId: 'dept-tekla', roleId: 'role-tekla-modeler', competencyId: 'comp-tekla-func-08', requiredLevel: 3, isPrioritySkill: true, priorityOrder: 5, weight: 1.5, status: 'Active' },
  // Leadership
  { id: 'rc-mod-l4', departmentId: 'dept-tekla', roleId: 'role-tekla-modeler', competencyId: 'comp-tekla-lead-04', requiredLevel: 2, isPrioritySkill: false, weight: 1.0, status: 'Active' },

  // ----------------------------------------------------
  // 4. Senior Modeler (8 Assigned: 2 Core, 5 Functional, 1 Leadership, 5 Priority Skills)
  // ----------------------------------------------------
  { id: 'rc-srm-c1', departmentId: 'dept-tekla', roleId: 'role-tekla-sr-modeler', competencyId: 'comp-tekla-core-01', requiredLevel: 4, isPrioritySkill: false, weight: 1.0, status: 'Active' },
  { id: 'rc-srm-c4', departmentId: 'dept-tekla', roleId: 'role-tekla-sr-modeler', competencyId: 'comp-tekla-core-04', requiredLevel: 4, isPrioritySkill: false, weight: 1.0, status: 'Active' },
  // Priority Skills (5 Functional)
  { id: 'rc-srm-f1', departmentId: 'dept-tekla', roleId: 'role-tekla-sr-modeler', competencyId: 'comp-tekla-func-01', requiredLevel: 4, isPrioritySkill: true, priorityOrder: 1, weight: 1.5, status: 'Active' },
  { id: 'rc-srm-f2', departmentId: 'dept-tekla', roleId: 'role-tekla-sr-modeler', competencyId: 'comp-tekla-func-02', requiredLevel: 4, isPrioritySkill: true, priorityOrder: 2, weight: 1.5, status: 'Active' },
  { id: 'rc-srm-f5', departmentId: 'dept-tekla', roleId: 'role-tekla-sr-modeler', competencyId: 'comp-tekla-func-05', requiredLevel: 4, isPrioritySkill: true, priorityOrder: 3, weight: 1.5, status: 'Active' },
  { id: 'rc-srm-f7', departmentId: 'dept-tekla', roleId: 'role-tekla-sr-modeler', competencyId: 'comp-tekla-func-07', requiredLevel: 3, isPrioritySkill: true, priorityOrder: 4, weight: 1.2, status: 'Active' },
  { id: 'rc-srm-f14', departmentId: 'dept-tekla', roleId: 'role-tekla-sr-modeler', competencyId: 'comp-tekla-func-14', requiredLevel: 3, isPrioritySkill: true, priorityOrder: 5, weight: 1.2, status: 'Active' },
  // Leadership
  { id: 'rc-srm-l4', departmentId: 'dept-tekla', roleId: 'role-tekla-sr-modeler', competencyId: 'comp-tekla-lead-04', requiredLevel: 2, isPrioritySkill: false, weight: 1.0, status: 'Active' },

  // ----------------------------------------------------
  // 5. Associate Checker (8 Assigned: 2 Core, 5 Functional, 1 Leadership, 5 Priority Skills)
  // ----------------------------------------------------
  { id: 'rc-achk-c1', departmentId: 'dept-tekla', roleId: 'role-tekla-assoc-checker', competencyId: 'comp-tekla-core-01', requiredLevel: 3, isPrioritySkill: false, weight: 1.0, status: 'Active' },
  { id: 'rc-achk-c3', departmentId: 'dept-tekla', roleId: 'role-tekla-assoc-checker', competencyId: 'comp-tekla-core-03', requiredLevel: 3, isPrioritySkill: false, weight: 1.0, status: 'Active' },
  // Priority Skills (5 Functional)
  { id: 'rc-achk-f11', departmentId: 'dept-tekla', roleId: 'role-tekla-assoc-checker', competencyId: 'comp-tekla-func-11', requiredLevel: 3, isPrioritySkill: true, priorityOrder: 1, weight: 1.5, status: 'Active' },
  { id: 'rc-achk-f12', departmentId: 'dept-tekla', roleId: 'role-tekla-assoc-checker', competencyId: 'comp-tekla-func-12', requiredLevel: 3, isPrioritySkill: true, priorityOrder: 2, weight: 1.5, status: 'Active' },
  { id: 'rc-achk-f7', departmentId: 'dept-tekla', roleId: 'role-tekla-assoc-checker', competencyId: 'comp-tekla-func-07', requiredLevel: 3, isPrioritySkill: true, priorityOrder: 3, weight: 1.2, status: 'Active' },
  { id: 'rc-achk-f5', departmentId: 'dept-tekla', roleId: 'role-tekla-assoc-checker', competencyId: 'comp-tekla-func-05', requiredLevel: 3, isPrioritySkill: true, priorityOrder: 4, weight: 1.2, status: 'Active' },
  { id: 'rc-achk-f4', departmentId: 'dept-tekla', roleId: 'role-tekla-assoc-checker', competencyId: 'comp-tekla-func-04', requiredLevel: 3, isPrioritySkill: true, priorityOrder: 5, weight: 1.2, status: 'Active' },
  // Leadership
  { id: 'rc-achk-l4', departmentId: 'dept-tekla', roleId: 'role-tekla-assoc-checker', competencyId: 'comp-tekla-lead-04', requiredLevel: 2, isPrioritySkill: false, weight: 1.0, status: 'Active' },

  // ----------------------------------------------------
  // 6. Checker (8 Assigned: 2 Core, 5 Functional, 1 Leadership, 5 Priority Skills)
  // ----------------------------------------------------
  { id: 'rc-chk-c1', departmentId: 'dept-tekla', roleId: 'role-tekla-checker', competencyId: 'comp-tekla-core-01', requiredLevel: 4, isPrioritySkill: false, weight: 1.0, status: 'Active' },
  { id: 'rc-chk-c3', departmentId: 'dept-tekla', roleId: 'role-tekla-checker', competencyId: 'comp-tekla-core-03', requiredLevel: 4, isPrioritySkill: false, weight: 1.0, status: 'Active' },
  // Priority Skills (5 Functional)
  { id: 'rc-chk-f11', departmentId: 'dept-tekla', roleId: 'role-tekla-checker', competencyId: 'comp-tekla-func-11', requiredLevel: 4, isPrioritySkill: true, priorityOrder: 1, weight: 1.5, status: 'Active' },
  { id: 'rc-chk-f12', departmentId: 'dept-tekla', roleId: 'role-tekla-checker', competencyId: 'comp-tekla-func-12', requiredLevel: 4, isPrioritySkill: true, priorityOrder: 2, weight: 1.5, status: 'Active' },
  { id: 'rc-chk-f7', departmentId: 'dept-tekla', roleId: 'role-tekla-checker', competencyId: 'comp-tekla-func-07', requiredLevel: 4, isPrioritySkill: true, priorityOrder: 3, weight: 1.5, status: 'Active' },
  { id: 'rc-chk-f13', departmentId: 'dept-tekla', roleId: 'role-tekla-checker', competencyId: 'comp-tekla-func-13', requiredLevel: 4, isPrioritySkill: true, priorityOrder: 4, weight: 1.2, status: 'Active' },
  { id: 'rc-chk-f5', departmentId: 'dept-tekla', roleId: 'role-tekla-checker', competencyId: 'comp-tekla-func-05', requiredLevel: 4, isPrioritySkill: true, priorityOrder: 5, weight: 1.2, status: 'Active' },
  // Leadership
  { id: 'rc-chk-l4', departmentId: 'dept-tekla', roleId: 'role-tekla-checker', competencyId: 'comp-tekla-lead-04', requiredLevel: 3, isPrioritySkill: false, weight: 1.0, status: 'Active' },

  // ----------------------------------------------------
  // 7. Senior Checker (8 Assigned: 2 Core, 5 Functional, 1 Leadership, 5 Priority Skills)
  // ----------------------------------------------------
  { id: 'rc-srchk-c1', departmentId: 'dept-tekla', roleId: 'role-tekla-sr-checker', competencyId: 'comp-tekla-core-01', requiredLevel: 4, isPrioritySkill: false, weight: 1.0, status: 'Active' },
  { id: 'rc-srchk-c3', departmentId: 'dept-tekla', roleId: 'role-tekla-sr-checker', competencyId: 'comp-tekla-core-03', requiredLevel: 4, isPrioritySkill: false, weight: 1.0, status: 'Active' },
  // Priority Skills (5 Functional)
  { id: 'rc-srchk-f11', departmentId: 'dept-tekla', roleId: 'role-tekla-sr-checker', competencyId: 'comp-tekla-func-11', requiredLevel: 4, isPrioritySkill: true, priorityOrder: 1, weight: 1.5, status: 'Active' },
  { id: 'rc-srchk-f12', departmentId: 'dept-tekla', roleId: 'role-tekla-sr-checker', competencyId: 'comp-tekla-func-12', requiredLevel: 4, isPrioritySkill: true, priorityOrder: 2, weight: 1.5, status: 'Active' },
  { id: 'rc-srchk-f7', departmentId: 'dept-tekla', roleId: 'role-tekla-sr-checker', competencyId: 'comp-tekla-func-07', requiredLevel: 4, isPrioritySkill: true, priorityOrder: 3, weight: 1.5, status: 'Active' },
  { id: 'rc-srchk-f5', departmentId: 'dept-tekla', roleId: 'role-tekla-sr-checker', competencyId: 'comp-tekla-func-05', requiredLevel: 4, isPrioritySkill: true, priorityOrder: 4, weight: 1.2, status: 'Active' },
  { id: 'rc-srchk-f19', departmentId: 'dept-tekla', roleId: 'role-tekla-sr-checker', competencyId: 'comp-tekla-func-19', requiredLevel: 4, isPrioritySkill: true, priorityOrder: 5, weight: 1.2, status: 'Active' },
  // Leadership
  { id: 'rc-srchk-l4', departmentId: 'dept-tekla', roleId: 'role-tekla-sr-checker', competencyId: 'comp-tekla-lead-04', requiredLevel: 4, isPrioritySkill: false, weight: 1.0, status: 'Active' },

  // ----------------------------------------------------
  // 8. Team Lead (8 Assigned: 2 Core, 3 Functional, 3 Leadership, 5 Priority Skills)
  // ----------------------------------------------------
  { id: 'rc-tl-c1', departmentId: 'dept-tekla', roleId: 'role-tekla-team-lead', competencyId: 'comp-tekla-core-01', requiredLevel: 4, isPrioritySkill: false, weight: 1.0, status: 'Active' },
  { id: 'rc-tl-c2', departmentId: 'dept-tekla', roleId: 'role-tekla-team-lead', competencyId: 'comp-tekla-core-02', requiredLevel: 4, isPrioritySkill: false, weight: 1.0, status: 'Active' },
  // Priority Skills (3 Functional + 2 Leadership = 5 Priority Skills)
  { id: 'rc-tl-f11', departmentId: 'dept-tekla', roleId: 'role-tekla-team-lead', competencyId: 'comp-tekla-func-11', requiredLevel: 4, isPrioritySkill: true, priorityOrder: 1, weight: 1.5, status: 'Active' },
  { id: 'rc-tl-f12', departmentId: 'dept-tekla', roleId: 'role-tekla-team-lead', competencyId: 'comp-tekla-func-12', requiredLevel: 4, isPrioritySkill: true, priorityOrder: 2, weight: 1.5, status: 'Active' },
  { id: 'rc-tl-f10', departmentId: 'dept-tekla', roleId: 'role-tekla-team-lead', competencyId: 'comp-tekla-func-10', requiredLevel: 4, isPrioritySkill: true, priorityOrder: 3, weight: 1.5, status: 'Active' },
  { id: 'rc-tl-l2', departmentId: 'dept-tekla', roleId: 'role-tekla-team-lead', competencyId: 'comp-tekla-lead-02', requiredLevel: 4, isPrioritySkill: true, priorityOrder: 4, weight: 1.2, status: 'Active' },
  { id: 'rc-tl-l3', departmentId: 'dept-tekla', roleId: 'role-tekla-team-lead', competencyId: 'comp-tekla-lead-03', requiredLevel: 4, isPrioritySkill: true, priorityOrder: 5, weight: 1.2, status: 'Active' },
  // Leadership
  { id: 'rc-tl-l4', departmentId: 'dept-tekla', roleId: 'role-tekla-team-lead', competencyId: 'comp-tekla-lead-04', requiredLevel: 3, isPrioritySkill: false, weight: 1.0, status: 'Active' },

  // ----------------------------------------------------
  // 9. Project Lead (8 Assigned: 2 Core, 3 Functional, 3 Leadership, 5 Priority Skills)
  // ----------------------------------------------------
  { id: 'rc-pl-c1', departmentId: 'dept-tekla', roleId: 'role-tekla-project-lead', competencyId: 'comp-tekla-core-01', requiredLevel: 4, isPrioritySkill: false, weight: 1.0, status: 'Active' },
  { id: 'rc-pl-c2', departmentId: 'dept-tekla', roleId: 'role-tekla-project-lead', competencyId: 'comp-tekla-core-02', requiredLevel: 4, isPrioritySkill: false, weight: 1.0, status: 'Active' },
  // Priority Skills (3 Functional + 2 Leadership = 5 Priority Skills)
  { id: 'rc-pl-f10', departmentId: 'dept-tekla', roleId: 'role-tekla-project-lead', competencyId: 'comp-tekla-func-10', requiredLevel: 4, isPrioritySkill: true, priorityOrder: 1, weight: 1.5, status: 'Active' },
  { id: 'rc-pl-f11', departmentId: 'dept-tekla', roleId: 'role-tekla-project-lead', competencyId: 'comp-tekla-func-11', requiredLevel: 4, isPrioritySkill: true, priorityOrder: 2, weight: 1.5, status: 'Active' },
  { id: 'rc-pl-f13', departmentId: 'dept-tekla', roleId: 'role-tekla-project-lead', competencyId: 'comp-tekla-func-13', requiredLevel: 4, isPrioritySkill: true, priorityOrder: 3, weight: 1.5, status: 'Active' },
  { id: 'rc-pl-l2', departmentId: 'dept-tekla', roleId: 'role-tekla-project-lead', competencyId: 'comp-tekla-lead-02', requiredLevel: 4, isPrioritySkill: true, priorityOrder: 4, weight: 1.2, status: 'Active' },
  { id: 'rc-pl-l3', departmentId: 'dept-tekla', roleId: 'role-tekla-project-lead', competencyId: 'comp-tekla-lead-03', requiredLevel: 4, isPrioritySkill: true, priorityOrder: 5, weight: 1.2, status: 'Active' },
  // Leadership
  { id: 'rc-pl-l5', departmentId: 'dept-tekla', roleId: 'role-tekla-project-lead', competencyId: 'comp-tekla-lead-05', requiredLevel: 4, isPrioritySkill: false, weight: 1.0, status: 'Active' },

  // ----------------------------------------------------
  // 10. Project Manager (8 Assigned: 2 Core, 3 Functional, 3 Leadership, 5 Priority Skills)
  // ----------------------------------------------------
  { id: 'rc-pm-c1', departmentId: 'dept-tekla', roleId: 'role-tekla-pm', competencyId: 'comp-tekla-core-01', requiredLevel: 4, isPrioritySkill: false, weight: 1.0, status: 'Active' },
  { id: 'rc-pm-c10', departmentId: 'dept-tekla', roleId: 'role-tekla-pm', competencyId: 'comp-tekla-core-10', requiredLevel: 4, isPrioritySkill: false, weight: 1.0, status: 'Active' },
  // Priority Skills (3 Functional + 2 Leadership = 5 Priority Skills)
  { id: 'rc-pm-f10', departmentId: 'dept-tekla', roleId: 'role-tekla-pm', competencyId: 'comp-tekla-func-10', requiredLevel: 4, isPrioritySkill: true, priorityOrder: 1, weight: 1.5, status: 'Active' },
  { id: 'rc-pm-f15', departmentId: 'dept-tekla', roleId: 'role-tekla-pm', competencyId: 'comp-tekla-func-15', requiredLevel: 4, isPrioritySkill: true, priorityOrder: 2, weight: 1.5, status: 'Active' },
  { id: 'rc-pm-f20', departmentId: 'dept-tekla', roleId: 'role-tekla-pm', competencyId: 'comp-tekla-func-20', requiredLevel: 4, isPrioritySkill: true, priorityOrder: 3, weight: 1.5, status: 'Active' },
  { id: 'rc-pm-l1', departmentId: 'dept-tekla', roleId: 'role-tekla-pm', competencyId: 'comp-tekla-lead-01', requiredLevel: 4, isPrioritySkill: true, priorityOrder: 4, weight: 1.2, status: 'Active' },
  { id: 'rc-pm-l2', departmentId: 'dept-tekla', roleId: 'role-tekla-pm', competencyId: 'comp-tekla-lead-02', requiredLevel: 4, isPrioritySkill: true, priorityOrder: 5, weight: 1.2, status: 'Active' },
  // Leadership
  { id: 'rc-pm-l9', departmentId: 'dept-tekla', roleId: 'role-tekla-pm', competencyId: 'comp-tekla-lead-09', requiredLevel: 4, isPrioritySkill: false, weight: 1.0, status: 'Active' }
];

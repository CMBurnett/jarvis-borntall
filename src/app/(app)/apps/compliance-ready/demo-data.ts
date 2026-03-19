import type { Assessment, Standard, ClauseResult, StandardResult } from "./types";

// ── ISO 9001:2015 Clauses ─────────────────────────────────────────────────────

const iso9001Clauses: ClauseResult[] = [
  {
    id: "4.1", title: "Understanding the Organization and its Context", standard: "ISO 9001:2015", status: "conforming", priority: null,
    evidence: [{ name: "Context of the organization document", status: "found" }, { name: "SWOT analysis", status: "found" }, { name: "Interested parties register", status: "found" }],
    gap: null, actionRequired: null,
  },
  {
    id: "4.2", title: "Understanding the Needs and Expectations of Interested Parties", standard: "ISO 9001:2015", status: "conforming", priority: null,
    evidence: [{ name: "Interested parties matrix", status: "found" }, { name: "Requirements register", status: "found" }],
    gap: null, actionRequired: null,
  },
  {
    id: "4.3", title: "Determining the Scope of the QMS", standard: "ISO 9001:2015", status: "conforming", priority: null,
    evidence: [{ name: "QMS scope statement", status: "found" }, { name: "Quality manual (scope section)", status: "found" }],
    gap: null, actionRequired: null,
  },
  {
    id: "4.4", title: "Quality Management System and its Processes", standard: "ISO 9001:2015", status: "partial", priority: "P2",
    evidence: [{ name: "Process map / turtle diagrams", status: "found" }, { name: "Process interaction matrix", status: "partial" }, { name: "Process performance metrics", status: "not_found" }],
    gap: "Process performance metrics not established for all key processes.",
    actionRequired: "Define KPIs for each core process and implement tracking dashboards.",
  },
  {
    id: "5.1", title: "Leadership and Commitment", standard: "ISO 9001:2015", status: "conforming", priority: null,
    evidence: [{ name: "Management review minutes", status: "found" }, { name: "Quality policy communication records", status: "found" }],
    gap: null, actionRequired: null,
  },
  {
    id: "5.2", title: "Policy", standard: "ISO 9001:2015", status: "conforming", priority: null,
    evidence: [{ name: "Quality policy document", status: "found" }, { name: "Policy communication records", status: "found" }],
    gap: null, actionRequired: null,
  },
  {
    id: "5.3", title: "Organizational Roles, Responsibilities and Authorities", standard: "ISO 9001:2015", status: "conforming", priority: null,
    evidence: [{ name: "Organization chart", status: "found" }, { name: "Role descriptions with QMS responsibilities", status: "found" }],
    gap: null, actionRequired: null,
  },
  {
    id: "6.1", title: "Actions to Address Risks and Opportunities", standard: "ISO 9001:2015", status: "partial", priority: "P2",
    evidence: [{ name: "Risk register", status: "found" }, { name: "Risk treatment plans", status: "partial" }, { name: "Opportunity assessment records", status: "not_found" }],
    gap: "Opportunity assessment not formally documented; risk treatment plans incomplete for 3 identified risks.",
    actionRequired: "Complete risk treatment plans and create formal opportunity assessment process.",
  },
  {
    id: "6.2", title: "Quality Objectives and Planning to Achieve Them", standard: "ISO 9001:2015", status: "conforming", priority: null,
    evidence: [{ name: "Quality objectives document", status: "found" }, { name: "Objective achievement plans", status: "found" }],
    gap: null, actionRequired: null,
  },
  {
    id: "7.1", title: "Resources", standard: "ISO 9001:2015", status: "conforming", priority: null,
    evidence: [{ name: "Resource planning records", status: "found" }, { name: "Infrastructure maintenance schedule", status: "found" }],
    gap: null, actionRequired: null,
  },
  {
    id: "7.2", title: "Competence", standard: "ISO 9001:2015", status: "gap", priority: "P1",
    evidence: [{ name: "Competency matrix", status: "partial" }, { name: "Training records", status: "partial" }, { name: "Competency evaluation results", status: "not_found" }],
    gap: "3 operators missing competency records; training matrix not updated since Q3 2025.",
    actionRequired: "Update competency matrix, conduct evaluations for all operators, establish refresher training schedule.",
  },
  {
    id: "7.5", title: "Documented Information", standard: "ISO 9001:2015", status: "conforming", priority: null,
    evidence: [{ name: "Document control procedure", status: "found" }, { name: "Master document list", status: "found" }, { name: "Record retention schedule", status: "found" }],
    gap: null, actionRequired: null,
  },
  {
    id: "8.1", title: "Operational Planning and Control", standard: "ISO 9001:2015", status: "conforming", priority: null,
    evidence: [{ name: "Production planning procedures", status: "found" }, { name: "Work instructions", status: "found" }],
    gap: null, actionRequired: null,
  },
  {
    id: "8.2", title: "Requirements for Products and Services", standard: "ISO 9001:2015", status: "conforming", priority: null,
    evidence: [{ name: "Customer requirements review records", status: "found" }, { name: "Contract review procedure", status: "found" }],
    gap: null, actionRequired: null,
  },
  {
    id: "8.4", title: "Control of Externally Provided Processes, Products and Services", standard: "ISO 9001:2015", status: "partial", priority: "P2",
    evidence: [{ name: "Approved supplier list", status: "found" }, { name: "Supplier evaluation records", status: "partial" }, { name: "Incoming inspection records", status: "found" }],
    gap: "Supplier evaluation criteria not applied consistently; 2 suppliers overdue for re-evaluation.",
    actionRequired: "Complete overdue supplier evaluations and standardize evaluation criteria.",
  },
  {
    id: "8.5", title: "Production and Service Provision", standard: "ISO 9001:2015", status: "gap", priority: "P1",
    evidence: [{ name: "Process control documentation", status: "partial" }, { name: "Validation records", status: "not_found" }, { name: "Traceability records", status: "found" }],
    gap: "Process control documentation incomplete for 2 critical production processes; no validation records for special processes.",
    actionRequired: "Complete process control documentation and establish validation protocols for special processes.",
  },
  {
    id: "8.7", title: "Control of Nonconforming Outputs", standard: "ISO 9001:2015", status: "conforming", priority: null,
    evidence: [{ name: "Nonconformance procedure", status: "found" }, { name: "NCR log", status: "found" }],
    gap: null, actionRequired: null,
  },
  {
    id: "9.1", title: "Monitoring, Measurement, Analysis and Evaluation", standard: "ISO 9001:2015", status: "gap", priority: "P1",
    evidence: [{ name: "Customer satisfaction survey results", status: "not_found" }, { name: "Process performance data", status: "partial" }, { name: "Analysis of data reports", status: "not_found" }],
    gap: "Customer satisfaction survey not conducted Q1; process performance data incomplete.",
    actionRequired: "Conduct customer satisfaction survey, compile Q1 performance data, and produce analysis report.",
  },
  {
    id: "9.2", title: "Internal Audit", standard: "ISO 9001:2015", status: "partial", priority: "P2",
    evidence: [{ name: "Audit schedule", status: "found" }, { name: "Audit reports", status: "partial" }, { name: "Auditor competence records", status: "found" }],
    gap: "2 scheduled audits not yet completed for the current cycle.",
    actionRequired: "Schedule and complete remaining internal audits before next management review.",
  },
  {
    id: "9.3", title: "Management Review", standard: "ISO 9001:2015", status: "conforming", priority: null,
    evidence: [{ name: "Management review agenda", status: "found" }, { name: "Management review minutes", status: "found" }, { name: "Action items from review", status: "found" }],
    gap: null, actionRequired: null,
  },
  {
    id: "10.1", title: "General — Improvement", standard: "ISO 9001:2015", status: "conforming", priority: null,
    evidence: [{ name: "Continual improvement procedure", status: "found" }, { name: "Improvement project records", status: "found" }],
    gap: null, actionRequired: null,
  },
  {
    id: "10.2", title: "Nonconformity and Corrective Action", standard: "ISO 9001:2015", status: "partial", priority: "P2",
    evidence: [{ name: "Corrective action procedure", status: "found" }, { name: "CAPA log", status: "found" }, { name: "Root cause analysis records", status: "partial" }],
    gap: "Root cause analysis not completed for 4 open CAPAs.",
    actionRequired: "Complete root cause analysis for all open CAPAs and verify corrective actions.",
  },
];

// ── AS9100 Rev D Additional Clauses ───────────────────────────────────────────

const as9100Clauses: ClauseResult[] = [
  ...iso9001Clauses.map(c => ({ ...c, standard: "AS9100 Rev D" as Standard })),
  {
    id: "8.1.1", title: "Operational Risk Management", standard: "AS9100 Rev D", status: "gap", priority: "P1",
    evidence: [{ name: "Operational risk management plan", status: "not_found" }, { name: "Risk mitigation tracking", status: "not_found" }],
    gap: "No formal operational risk management plan for production processes.",
    actionRequired: "Develop and implement operational risk management plan per AS9100 8.1.1 requirements.",
  },
  {
    id: "8.1.2", title: "Configuration Management", standard: "AS9100 Rev D", status: "partial", priority: "P1",
    evidence: [{ name: "Configuration management plan", status: "partial" }, { name: "Configuration status accounting", status: "not_found" }, { name: "Configuration audit records", status: "not_found" }],
    gap: "Configuration management plan incomplete; no status accounting or audit records.",
    actionRequired: "Complete configuration management plan, establish status accounting process, and conduct configuration audits.",
  },
  {
    id: "8.1.3", title: "Product Safety", standard: "AS9100 Rev D", status: "conforming", priority: null,
    evidence: [{ name: "Product safety assessment", status: "found" }, { name: "Safety critical items list", status: "found" }],
    gap: null, actionRequired: null,
  },
  {
    id: "8.1.4", title: "Prevention of Counterfeit Parts", standard: "AS9100 Rev D", status: "partial", priority: "P1",
    evidence: [{ name: "Counterfeit parts prevention plan", status: "found" }, { name: "Approved source list", status: "found" }, { name: "Counterfeit detection training records", status: "not_found" }],
    gap: "Counterfeit detection training not completed for receiving inspection personnel.",
    actionRequired: "Conduct counterfeit parts detection training for all receiving inspection staff.",
  },
  {
    id: "8.4.3", title: "Information for External Providers (Aerospace)", standard: "AS9100 Rev D", status: "gap", priority: "P1",
    evidence: [{ name: "Flowdown requirements procedure", status: "partial" }, { name: "Supplier quality clauses", status: "not_found" }, { name: "Special process delegation records", status: "not_found" }],
    gap: "Quality clauses not flowed down to 5 key suppliers; special process delegations undocumented.",
    actionRequired: "Develop standard quality clauses for POs, flow down to all suppliers, and document special process delegations.",
  },
  {
    id: "8.5.5", title: "Post-Delivery Activities", standard: "AS9100 Rev D", status: "conforming", priority: null,
    evidence: [{ name: "Warranty and service records", status: "found" }, { name: "Field failure analysis reports", status: "found" }],
    gap: null, actionRequired: null,
  },
  {
    id: "8.7.1", title: "Nonconforming Output — Aerospace Disposition", standard: "AS9100 Rev D", status: "partial", priority: "P2",
    evidence: [{ name: "MRB procedure", status: "found" }, { name: "Customer concession records", status: "partial" }, { name: "Scrap/rework documentation", status: "found" }],
    gap: "Customer concession process not consistently followed for use-as-is dispositions.",
    actionRequired: "Review and reinforce customer concession process; retrain MRB members.",
  },
];

// ── ISO 14001:2015 Clauses ────────────────────────────────────────────────────

const iso14001Clauses: ClauseResult[] = [
  {
    id: "4.1", title: "Understanding the Organization and its Context", standard: "ISO 14001:2015", status: "conforming", priority: null,
    evidence: [{ name: "Environmental context analysis", status: "found" }, { name: "External/internal issues register", status: "found" }],
    gap: null, actionRequired: null,
  },
  {
    id: "4.2", title: "Understanding the Needs and Expectations of Interested Parties", standard: "ISO 14001:2015", status: "conforming", priority: null,
    evidence: [{ name: "Environmental interested parties register", status: "found" }],
    gap: null, actionRequired: null,
  },
  {
    id: "4.3", title: "Determining the Scope of the EMS", standard: "ISO 14001:2015", status: "conforming", priority: null,
    evidence: [{ name: "EMS scope statement", status: "found" }],
    gap: null, actionRequired: null,
  },
  {
    id: "5.1", title: "Leadership and Commitment (Environmental)", standard: "ISO 14001:2015", status: "conforming", priority: null,
    evidence: [{ name: "Top management environmental commitment evidence", status: "found" }],
    gap: null, actionRequired: null,
  },
  {
    id: "5.2", title: "Environmental Policy", standard: "ISO 14001:2015", status: "conforming", priority: null,
    evidence: [{ name: "Environmental policy document", status: "found" }, { name: "Policy communication records", status: "found" }],
    gap: null, actionRequired: null,
  },
  {
    id: "6.1.1", title: "Actions to Address Risks and Opportunities (Environmental)", standard: "ISO 14001:2015", status: "gap", priority: "P1",
    evidence: [{ name: "Environmental risk register", status: "not_found" }, { name: "Risk treatment plans (environmental)", status: "not_found" }],
    gap: "Environmental risk register out of date; no current risk treatment plans.",
    actionRequired: "Update environmental risk register and develop treatment plans for identified risks.",
  },
  {
    id: "6.1.2", title: "Environmental Aspects", standard: "ISO 14001:2015", status: "gap", priority: "P1",
    evidence: [{ name: "Aspects and impacts register", status: "partial" }, { name: "Significance evaluation criteria", status: "not_found" }, { name: "Life cycle perspective analysis", status: "not_found" }],
    gap: "Aspects register incomplete; no significance evaluation or life cycle analysis.",
    actionRequired: "Complete environmental aspects register with significance evaluation and life cycle perspective.",
  },
  {
    id: "6.1.3", title: "Compliance Obligations", standard: "ISO 14001:2015", status: "partial", priority: "P2",
    evidence: [{ name: "Legal requirements register", status: "found" }, { name: "Compliance evaluation records", status: "partial" }],
    gap: "Compliance evaluation not current for 3 applicable regulations.",
    actionRequired: "Update compliance evaluation for all applicable environmental regulations.",
  },
  {
    id: "6.2", title: "Environmental Objectives and Planning", standard: "ISO 14001:2015", status: "partial", priority: "P2",
    evidence: [{ name: "Environmental objectives", status: "found" }, { name: "Action plans for objectives", status: "partial" }],
    gap: "Action plans incomplete for 2 environmental objectives.",
    actionRequired: "Complete action plans with timelines and responsibilities for all environmental objectives.",
  },
  {
    id: "7.2", title: "Competence (Environmental)", standard: "ISO 14001:2015", status: "gap", priority: "P1",
    evidence: [{ name: "Environmental training matrix", status: "not_found" }, { name: "Environmental awareness training records", status: "not_found" }],
    gap: "No environmental competence matrix or training records.",
    actionRequired: "Develop environmental competence matrix and conduct awareness training for all relevant personnel.",
  },
  {
    id: "8.1", title: "Operational Planning and Control (Environmental)", standard: "ISO 14001:2015", status: "gap", priority: "P1",
    evidence: [{ name: "Environmental operational controls", status: "not_found" }, { name: "Chemical storage procedure", status: "partial" }, { name: "Waste management procedure", status: "partial" }],
    gap: "Chemical storage procedure not reviewed; waste management procedure outdated; no formal operational controls.",
    actionRequired: "Review and update all environmental operational control procedures.",
  },
  {
    id: "8.2", title: "Emergency Preparedness and Response", standard: "ISO 14001:2015", status: "partial", priority: "P2",
    evidence: [{ name: "Emergency response plan (environmental)", status: "found" }, { name: "Spill response drill records", status: "partial" }],
    gap: "Spill response drills not conducted in past 6 months.",
    actionRequired: "Schedule and conduct environmental emergency response drills.",
  },
  {
    id: "9.1.1", title: "Monitoring, Measurement, Analysis and Evaluation (Environmental)", standard: "ISO 14001:2015", status: "gap", priority: "P1",
    evidence: [{ name: "Environmental monitoring plan", status: "not_found" }, { name: "Emissions monitoring data", status: "not_found" }, { name: "Waste tracking records", status: "partial" }],
    gap: "No formal environmental monitoring plan; emissions data not tracked.",
    actionRequired: "Establish environmental monitoring plan, implement emissions tracking, and formalize waste records.",
  },
  {
    id: "9.1.2", title: "Evaluation of Compliance", standard: "ISO 14001:2015", status: "gap", priority: "P1",
    evidence: [{ name: "Compliance evaluation procedure", status: "not_found" }, { name: "Compliance evaluation records", status: "not_found" }],
    gap: "No formal compliance evaluation process or records.",
    actionRequired: "Establish compliance evaluation procedure and conduct initial evaluation against all obligations.",
  },
  {
    id: "9.2", title: "Internal Audit (Environmental)", standard: "ISO 14001:2015", status: "gap", priority: "P1",
    evidence: [{ name: "EMS audit schedule", status: "not_found" }, { name: "EMS audit reports", status: "not_found" }],
    gap: "No EMS-specific internal audits conducted.",
    actionRequired: "Develop EMS audit schedule and conduct audits covering all EMS clauses.",
  },
  {
    id: "9.3", title: "Management Review (Environmental)", standard: "ISO 14001:2015", status: "partial", priority: "P2",
    evidence: [{ name: "Management review (EMS inputs)", status: "partial" }, { name: "Environmental performance trends", status: "not_found" }],
    gap: "Management review does not fully cover required EMS inputs.",
    actionRequired: "Expand management review agenda to include all ISO 14001 required inputs.",
  },
  {
    id: "10.2", title: "Nonconformity and Corrective Action (Environmental)", standard: "ISO 14001:2015", status: "gap", priority: "P1",
    evidence: [{ name: "Environmental CAPA procedure", status: "not_found" }, { name: "Environmental incident log", status: "not_found" }],
    gap: "No environmental-specific corrective action process.",
    actionRequired: "Establish environmental CAPA procedure and incident tracking system.",
  },
];

// ── ISO 45001:2018 Clauses ────────────────────────────────────────────────────

const iso45001Clauses: ClauseResult[] = [
  {
    id: "4.1", title: "Understanding the Organization and its Context", standard: "ISO 45001:2018", status: "conforming", priority: null,
    evidence: [{ name: "OH&S context analysis", status: "found" }],
    gap: null, actionRequired: null,
  },
  {
    id: "4.2", title: "Understanding the Needs of Workers and Other Interested Parties", standard: "ISO 45001:2018", status: "partial", priority: "P2",
    evidence: [{ name: "Worker consultation records", status: "partial" }, { name: "Interested parties register (OH&S)", status: "not_found" }],
    gap: "Worker consultation not fully documented; no OH&S interested parties register.",
    actionRequired: "Create OH&S interested parties register and document worker consultation process.",
  },
  {
    id: "5.1", title: "Leadership and Commitment (OH&S)", standard: "ISO 45001:2018", status: "partial", priority: "P2",
    evidence: [{ name: "OH&S policy signed by top management", status: "found" }, { name: "Evidence of leadership participation in OH&S", status: "partial" }],
    gap: "Limited evidence of top management active participation in OH&S activities.",
    actionRequired: "Document management participation in safety walks, reviews, and OH&S committee meetings.",
  },
  {
    id: "5.4", title: "Consultation and Participation of Workers", standard: "ISO 45001:2018", status: "gap", priority: "P1",
    evidence: [{ name: "Worker participation procedure", status: "not_found" }, { name: "Safety committee meeting minutes", status: "not_found" }, { name: "Worker consultation records", status: "not_found" }],
    gap: "No formal worker participation process; safety committee not established.",
    actionRequired: "Establish safety committee, develop worker participation procedure, and begin regular meetings.",
  },
  {
    id: "6.1.1", title: "General — Planning (OH&S)", standard: "ISO 45001:2018", status: "gap", priority: "P1",
    evidence: [{ name: "OH&S risk and opportunity register", status: "not_found" }, { name: "Planning actions for OH&S risks", status: "not_found" }],
    gap: "No OH&S risk and opportunity planning.",
    actionRequired: "Develop OH&S risk register and plan actions to address identified risks and opportunities.",
  },
  {
    id: "6.1.2", title: "Hazard Identification and Assessment of Risks", standard: "ISO 45001:2018", status: "gap", priority: "P1",
    evidence: [{ name: "Hazard identification procedure", status: "partial" }, { name: "Risk assessment records", status: "not_found" }, { name: "Job safety analyses (JSAs)", status: "not_found" }],
    gap: "Risk assessments not completed; no JSAs for high-risk activities.",
    actionRequired: "Complete risk assessments for all work areas and develop JSAs for high-risk tasks.",
  },
  {
    id: "6.1.3", title: "Determination of Legal Requirements (OH&S)", standard: "ISO 45001:2018", status: "partial", priority: "P2",
    evidence: [{ name: "OH&S legal requirements register", status: "partial" }, { name: "OSHA compliance records", status: "found" }],
    gap: "Legal requirements register incomplete for state-specific OH&S regulations.",
    actionRequired: "Update legal requirements register to include all applicable state and local OH&S regulations.",
  },
  {
    id: "7.2", title: "Competence (OH&S)", standard: "ISO 45001:2018", status: "gap", priority: "P1",
    evidence: [{ name: "OH&S training matrix", status: "not_found" }, { name: "Safety training records", status: "partial" }, { name: "Competency evaluation (OH&S)", status: "not_found" }],
    gap: "No OH&S training matrix; safety training records incomplete.",
    actionRequired: "Develop OH&S competency matrix, complete training gaps, and implement evaluation process.",
  },
  {
    id: "8.1.1", title: "General — Operational Planning (OH&S)", standard: "ISO 45001:2018", status: "gap", priority: "P1",
    evidence: [{ name: "OH&S operational controls", status: "not_found" }, { name: "Hierarchy of controls documentation", status: "not_found" }],
    gap: "No formal OH&S operational controls or hierarchy of controls approach.",
    actionRequired: "Develop OH&S operational control procedures applying hierarchy of controls methodology.",
  },
  {
    id: "8.1.2", title: "Eliminating Hazards and Reducing OH&S Risks", standard: "ISO 45001:2018", status: "gap", priority: "P1",
    evidence: [{ name: "Hazard elimination/reduction records", status: "not_found" }, { name: "PPE assessment and issuance records", status: "partial" }],
    gap: "No systematic hazard elimination process; PPE assessment incomplete.",
    actionRequired: "Implement hazard elimination program and complete PPE assessments for all work areas.",
  },
  {
    id: "8.2", title: "Emergency Preparedness and Response (OH&S)", standard: "ISO 45001:2018", status: "partial", priority: "P2",
    evidence: [{ name: "Emergency response plan", status: "found" }, { name: "Emergency drill records", status: "partial" }, { name: "First aid capability assessment", status: "not_found" }],
    gap: "Emergency drills not conducted quarterly as planned; first aid capability not assessed.",
    actionRequired: "Conduct emergency drills on schedule and complete first aid capability assessment.",
  },
  {
    id: "9.1.1", title: "Monitoring, Measurement, Analysis and Performance Evaluation — General", standard: "ISO 45001:2018", status: "gap", priority: "P1",
    evidence: [{ name: "Monitoring and measurement plan document", status: "not_found" }, { name: "Equipment calibration and verification records register", status: "not_found" }, { name: "Performance measurement data logs (inspection reports, test results, metrics dashboards)", status: "not_found" }, { name: "OH&S performance evaluation reports with analysis and trends", status: "not_found" }, { name: "Control effectiveness assessment records", status: "not_found" }, { name: "Documented criteria for OH&S performance evaluation", status: "not_found" }],
    gap: "Missing: Monitoring and measurement plan document; Equipment calibration and verification records register; Performance measurement data logs (inspection reports, test results, metrics dashboards); OH&S performance evaluation reports with analysis and trends; Control effectiveness assessment records; Documented criteria for OH&S performance evaluation.",
    actionRequired: "Document and formalize: Monitoring and measurement plan document, Equipment calibration and verification records register, Performance measurement data logs (inspection reports, test results, metrics dashboards), OH&S performance evaluation reports with analysis and trends, Control effectiveness assessment records, Documented criteria for OH&S performance evaluation.",
  },
  {
    id: "9.1.2", title: "Evaluation of Compliance", standard: "ISO 45001:2018", status: "gap", priority: "P1",
    evidence: [{ name: "OH&S compliance evaluation procedure", status: "not_found" }, { name: "Compliance evaluation records", status: "not_found" }],
    gap: "No formal OH&S compliance evaluation process.",
    actionRequired: "Establish OH&S compliance evaluation procedure and conduct initial compliance evaluation.",
  },
  {
    id: "9.2.1", title: "Internal Audit — General", standard: "ISO 45001:2018", status: "gap", priority: "P1",
    evidence: [{ name: "OH&S audit program", status: "not_found" }, { name: "OH&S audit reports", status: "not_found" }],
    gap: "No OH&S internal audit program established.",
    actionRequired: "Develop OH&S internal audit program and conduct audits.",
  },
  {
    id: "9.3.1", title: "General — Management Review", standard: "ISO 45001:2018", status: "gap", priority: "P1",
    evidence: [{ name: "OH&S management review records", status: "not_found" }, { name: "OH&S performance trends for review", status: "not_found" }],
    gap: "No OH&S-specific management review conducted.",
    actionRequired: "Conduct OH&S management review covering all required inputs per ISO 45001 clause 9.3.",
  },
  {
    id: "10.2", title: "Incident, Nonconformity and Corrective Action", standard: "ISO 45001:2018", status: "gap", priority: "P1",
    evidence: [{ name: "Incident investigation procedure", status: "partial" }, { name: "Incident investigation records", status: "not_found" }, { name: "OH&S corrective action log", status: "not_found" }],
    gap: "Incident investigation procedure incomplete; no formal investigation records or corrective action tracking.",
    actionRequired: "Complete incident investigation procedure, establish investigation records, and implement OH&S CAPA tracking.",
  },
];

// ── Helper to build StandardResult ────────────────────────────────────────────

function buildStandardResult(standard: Standard, clauses: ClauseResult[]): StandardResult {
  const filtered = clauses.filter(c => c.standard === standard);
  const conforming = filtered.filter(c => c.status === "conforming").length;
  const partial = filtered.filter(c => c.status === "partial").length;
  const gaps = filtered.filter(c => c.status === "gap").length;
  const score = Math.round(((conforming + partial * 0.5) / filtered.length) * 100);
  return { standard, score, totalClauses: filtered.length, conforming, partial, gaps, clauses: filtered };
}

// ── Assessments ───────────────────────────────────────────────────────────────

export const DEMO_ASSESSMENTS: Assessment[] = [
  {
    id: "ASMT-003",
    name: "Q1 2026 Full Compliance Assessment",
    date: "2026-03-04",
    status: "completed",
    standards: ["ISO 9001:2015", "AS9100 Rev D", "ISO 14001:2015", "ISO 45001:2018"],
    documents: [
      "Quality Manual v12.3.pdf",
      "Environmental Policy 2026.pdf",
      "OH&S Policy Statement.pdf",
      "Management Review Minutes - Feb 2026.pdf",
      "Internal Audit Reports - Q4 2025.pdf",
      "Training Records Master.xlsx",
      "Risk Register - March 2026.xlsx",
      "Approved Supplier List.pdf",
      "CAPA Log 2025-2026.xlsx",
      "Process Flow Diagrams.pdf",
    ],
    results: [
      buildStandardResult("ISO 9001:2015", iso9001Clauses),
      buildStandardResult("AS9100 Rev D", as9100Clauses),
      buildStandardResult("ISO 14001:2015", iso14001Clauses),
      buildStandardResult("ISO 45001:2018", iso45001Clauses),
    ],
  },
  {
    id: "ASMT-002",
    name: "Pre-Surveillance ISO 9001 Check",
    date: "2025-12-15",
    status: "completed",
    standards: ["ISO 9001:2015"],
    documents: [
      "Quality Manual v11.8.pdf",
      "Management Review Minutes - Nov 2025.pdf",
      "Internal Audit Reports - Q3 2025.pdf",
      "CAPA Log 2025.xlsx",
    ],
    results: [
      { standard: "ISO 9001:2015", score: 68, totalClauses: 22, conforming: 12, partial: 6, gaps: 4, clauses: [] },
    ],
  },
  {
    id: "ASMT-001",
    name: "Initial Gap Assessment",
    date: "2025-09-20",
    status: "completed",
    standards: ["ISO 9001:2015", "ISO 14001:2015"],
    documents: [
      "Quality Manual v11.2.pdf",
      "Environmental Policy 2025.pdf",
      "Process Maps.pdf",
    ],
    results: [
      { standard: "ISO 9001:2015", score: 52, totalClauses: 22, conforming: 8, partial: 7, gaps: 7, clauses: [] },
      { standard: "ISO 14001:2015", score: 30, totalClauses: 17, conforming: 3, partial: 5, gaps: 9, clauses: [] },
    ],
  },
];

export const AVAILABLE_STANDARDS: Standard[] = [
  "ISO 9001:2015",
  "AS9100 Rev D",
  "ISO 14001:2015",
  "ISO 45001:2018",
];

export const STANDARD_LABELS: Record<Standard, { short: string; color: string }> = {
  "ISO 9001:2015": { short: "ISO 9001", color: "text-blue-400" },
  "AS9100 Rev D": { short: "AS9100", color: "text-violet-400" },
  "ISO 14001:2015": { short: "ISO 14001", color: "text-emerald-400" },
  "ISO 45001:2018": { short: "ISO 45001", color: "text-amber-400" },
};

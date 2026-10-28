import type { CaseRecord, DemoState, Institution, ReviewOutcome } from "@/types/domain";

const day = (date: string) => `${date}T10:00:00.000Z`;
const institutions: Institution[] = [
  { id: "inst-10024", permanentId: "DEMO-10024", name: "ABC Institute of Technology", region: "North", state: "Delhi", city: "New Delhi", institutionType: "Engineering", established: 2004, lastActivity: "2026-10-26" },
  { id: "inst-10028", permanentId: "DEMO-10028", name: "Suryodaya Autonomous Institute of Advanced Engineering and Applied Sciences", region: "West", state: "Maharashtra", city: "Pune", institutionType: "Engineering", established: 1998, lastActivity: "2026-10-24" },
  { id: "inst-10031", permanentId: "DEMO-10031", name: "Mysore School of Design", region: "South", state: "Karnataka", city: "Mysuru", institutionType: "Design", established: 2011, lastActivity: "2026-10-21" },
  { id: "inst-10035", permanentId: "DEMO-10035", name: "Harborview Institute of Technology", region: "West", state: "Gujarat", city: "Vadodara", institutionType: "Engineering", established: 2008, lastActivity: "2026-10-17" },
  { id: "inst-10036", permanentId: "DEMO-10036", name: "Harbourview Institute of Technology", region: "East", state: "Odisha", city: "Bhubaneswar", institutionType: "Engineering", established: 2014, lastActivity: "2026-10-18" },
  { id: "inst-10038", permanentId: "DEMO-10038", name: "Lakeside Polytechnic College", region: "South", state: "Tamil Nadu", city: "Coimbatore", institutionType: "Polytechnic", established: 1992, lastActivity: "2026-10-25" },
  { id: "inst-10042", permanentId: "DEMO-10042", name: "Deccan Institute of Applied Sciences", region: "Central", state: "Madhya Pradesh", city: "Indore", institutionType: "Applied Sciences", established: 2001, lastActivity: "2026-10-10" },
  { id: "inst-10047", permanentId: "DEMO-10047", name: "Eastern Valley College of Engineering", region: "East", state: "West Bengal", city: "Siliguri", institutionType: "Engineering", established: 2007, lastActivity: "2026-10-20" },
  { id: "inst-10051", permanentId: "DEMO-10051", name: "Konkan School of Management and Technology", region: "West", state: "Goa", city: "Panaji", institutionType: "Management", established: 2015, lastActivity: "2026-10-22" },
  { id: "inst-10056", permanentId: "DEMO-10056", name: "Himalayan Institute of Digital Studies", region: "North", state: "Uttarakhand", city: "Dehradun", institutionType: "Information Technology", established: 2010, lastActivity: "2026-10-23" },
  { id: "inst-10059", permanentId: "DEMO-10059", name: "Riverbend Women's Polytechnic", region: "East", state: "Bihar", city: "Patna", institutionType: "Polytechnic", established: 2003, lastActivity: "2026-10-15" },
  { id: "inst-10063", permanentId: "DEMO-10063", name: "Cauvery Institute of Architecture", region: "South", state: "Karnataka", city: "Mangaluru", institutionType: "Architecture", established: 2009, lastActivity: "2026-10-12" },
  { id: "inst-10068", permanentId: "DEMO-10068", name: "Central Plateau Technical University", region: "Central", state: "Chhattisgarh", city: "Raipur", institutionType: "University", established: 1996, lastActivity: "2026-10-09" },
  { id: "inst-10071", permanentId: "DEMO-10071", name: "Coastal Institute for Renewable Energy", region: "South", state: "Kerala", city: "Kochi", institutionType: "Engineering", established: 2017, lastActivity: "2026-10-26" },
  { id: "inst-10074", permanentId: "DEMO-10074", name: "Northstar College of Pharmacy", region: "North", state: "Haryana", city: "Rohtak", institutionType: "Pharmacy", established: 2005, lastActivity: "2026-10-11" },
  { id: "inst-10079", permanentId: "DEMO-10079", name: "Sahyadri Institute of Civil Engineering", region: "West", state: "Maharashtra", city: "Nashik", institutionType: "Engineering", established: 2006, lastActivity: "2026-10-19" },
  { id: "inst-10082", permanentId: "DEMO-10082", name: "Aravali Centre for Technical Education", region: "North", state: "Rajasthan", city: "Jaipur", institutionType: "Engineering", established: 1999, lastActivity: "2026-10-08" },
  { id: "inst-10086", permanentId: "DEMO-10086", name: "Delta Institute of Electronics", region: "East", state: "Assam", city: "Guwahati", institutionType: "Electronics", established: 2013, lastActivity: null },
];

const makeCase = (
  id: string,
  institutionId: string,
  receivedAt: string,
  category: string,
  bureau: CaseRecord["bureau"],
  status: CaseRecord["status"],
  priority: CaseRecord["priority"],
  officer: string,
  lastAction: string,
  lastActionAt: string | null,
  expectedDisposalDate: string | null,
  description: string,
  awaitingBureau?: CaseRecord["bureau"],
): CaseRecord => ({
  id,
  institutionId,
  receivedAt,
  category,
  bureau,
  status,
  priority,
  officer,
  lastAction,
  lastActionAt,
  expectedDisposalDate,
  description,
  attachmentNames: id.endsWith("0142") ? ["student-representation-demo.pdf"] : [],
  awaitingBureau,
  relatedCaseIds: [],
  history: [
    { id: `${id}-received`, at: day(receivedAt), kind: "Received", summary: "Complaint received and registered in demo records.", actor: "Demo intake desk", bureau },
    ...(lastActionAt ? [{ id: `${id}-last`, at: day(lastActionAt), kind: "Review" as const, summary: lastAction, actor: officer, bureau }] : []),
  ],
});

const cases: CaseRecord[] = [
  makeCase("PGRC-2026-0142", "inst-10024", "2026-08-18", "Student grievance", "Public Grievance Redressal Cell (PGRC)", "Under process", "High", "Meera Rao", "Documents requested from institution", "2026-10-24", "2026-10-30", "A student grievance concerning a delayed academic record. This synthetic example is linked by institution ID to a separate regulatory review.", "Regulation Bureau (RB)"),
  makeCase("RB-2026-0081", "inst-10024", "2026-09-02", "Regulatory compliance", "Regulation Bureau (RB)", "Under process", "High", "Arjun Menon", "Preliminary review initiated", "2026-10-26", "2026-11-04", "A separate illustrative regulatory review for the same institution. Human review is needed to determine whether coordination is useful."),
  makeCase("PGRC-2026-0097", "inst-10024", "2026-06-11", "Examination records", "Public Grievance Redressal Cell (PGRC)", "Disposed", "Normal", "Meera Rao", "Response recorded and case disposed", "2026-08-03", "2026-08-06", "An earlier synthetic grievance record for institution-history demonstration."),
  makeCase("RB-2026-0102", "inst-10028", "2026-07-14", "Approval conditions", "Regulation Bureau (RB)", "Pending", "Critical", "Kavita Shah", "Awaiting initial review", "2026-08-28", "2026-09-12", "Illustrative approval-condition review; demonstration deadline only."),
  makeCase("PGRC-2026-0189", "inst-10028", "2026-09-27", "Student grievance", "Public Grievance Redressal Cell (PGRC)", "Pending", "High", "Sana Iqbal", "Acknowledgement issued", "2026-10-02", "2026-10-31", "A separate grievance record for the same institution, not assumed to be a duplicate."),
  makeCase("RB-2026-0124", "inst-10031", "2026-05-19", "Programme information", "Regulation Bureau (RB)", "Disposed", "Low", "Devika Nair", "Clarification recorded", "2026-07-12", "2026-07-20", "Closed synthetic programme information review."),
  makeCase("AAC-2026-0038", "inst-10031", "2026-09-08", "Academic coordination", "Academic Affairs Cell", "Under process", "Normal", "Rohan Das", "Joint response scheduled", "2026-10-21", "2026-11-01", "Illustrative academic coordination record. Separate bureau actions reviewed with no conflict."),
  makeCase("RB-2026-0157", "inst-10035", "2026-09-03", "Institution identity query", "Regulation Bureau (RB)", "Under process", "Normal", "Arjun Menon", "Identity fields checked", "2026-10-17", "2026-11-08", "This institution is deliberately named similarly to another demo institution. Permanent IDs differ; manual identity verification is required."),
  makeCase("PGRC-2026-0204", "inst-10036", "2026-09-11", "Student grievance", "Public Grievance Redressal Cell (PGRC)", "Pending", "Normal", "Sana Iqbal", "Receipt acknowledged", "2026-10-18", "2026-11-13", "Separate synthetic case at a different institution. Name similarity alone is not evidence of identity."),
  makeCase("RB-2026-0068", "inst-10038", "2026-04-22", "Infrastructure compliance", "Regulation Bureau (RB)", "Under process", "High", "Kavita Shah", "Regional inspection scheduled", "2026-10-25", "2026-11-03", "Illustrative compliance review shared for human coordination with a Regional Office."),
  makeCase("WRO-2026-0044", "inst-10038", "2026-07-02", "Regional inspection", "Western Regional Office", "Under process", "Normal", "Nikhil Patil", "Inspection notes submitted", "2026-10-23", "2026-11-05", "Separate site-inspection activity; reviewer marked the parallel action related, not a duplicate."),
  makeCase("PGRC-2026-0121", "inst-10042", "2026-07-28", "Fee-related grievance", "Public Grievance Redressal Cell (PGRC)", "Escalated", "Critical", "Meera Rao", "Escalated for bureau review", "2026-10-10", "2026-10-18", "Escalated synthetic grievance with an illustrative overdue date."),
  makeCase("RB-2026-0171", "inst-10042", "2026-10-20", "Institution data correction", "Regulation Bureau (RB)", "Pending", "Low", "Arjun Menon", "Awaiting triage", "2026-10-20", "2026-11-22", "A low-priority records question awaiting triage."),
  makeCase("WRO-2026-0056", "inst-10047", "2026-06-03", "Inspection follow-up", "Western Regional Office", "Pending", "High", "Nikhil Patil", "Second reminder issued", "2026-09-18", "2026-10-12", "Illustrative regional follow-up awaiting the institution's response."),
  makeCase("AAC-2026-0043", "inst-10047", "2026-09-14", "Programme approval query", "Academic Affairs Cell", "Under process", "Normal", "Rohan Das", "Supporting record reviewed", "2026-10-20", "2026-11-10", "A separate programme query in the same institution's case history."),
  makeCase("RB-2026-0093", "inst-10051", "2026-05-26", "Approval extension", "Regulation Bureau (RB)", "Transferred", "Normal", "Kavita Shah", "Transferred for regional context", "2026-09-29", "2026-10-29", "Transferred to a Regional Office for additional context.", "Western Regional Office"),
  makeCase("WRO-2026-0062", "inst-10051", "2026-09-30", "Regional coordination", "Western Regional Office", "Under process", "Low", "Nikhil Patil", "Regional notes added", "2026-10-22", "2026-11-14", "Follow-up to the illustrative transferred file."),
  makeCase("PGRC-2026-0165", "inst-10056", "2026-08-05", "Student grievance", "Public Grievance Redressal Cell (PGRC)", "Pending", "High", "Sana Iqbal", "Initial response requested", "2026-09-15", "2026-10-28", "A pending grievance nearing its illustrative expected disposal date."),
  makeCase("AAC-2026-0051", "inst-10056", "2026-10-01", "Academic records", "Academic Affairs Cell", "Under process", "Normal", "Rohan Das", "Records cross-checked", "2026-10-23", "2026-11-12", "An academic-record request handled separately from the grievance."),
  makeCase("RB-2026-0118", "inst-10059", "2026-06-19", "Approval conditions", "Regulation Bureau (RB)", "Pending", "High", "Devika Nair", "No recent response recorded", "2026-09-02", "2026-09-30", "A synthetic file with a long inactivity period and overdue expected date."),
  makeCase("PGRC-2026-0211", "inst-10059", "2026-10-12", "Hostel grievance", "Public Grievance Redressal Cell (PGRC)", "Pending", "Normal", "Sana Iqbal", "Receipt acknowledged", "2026-10-14", "2026-11-14", "New independent grievance at the same institution."),
  makeCase("RB-2026-0139", "inst-10063", "2026-07-06", "Programme review", "Regulation Bureau (RB)", "Disposed", "Normal", "Arjun Menon", "Review outcome recorded", "2026-09-20", "2026-09-25", "A completed synthetic programme review."),
  makeCase("AAC-2026-0063", "inst-10063", "2026-10-07", "Course information", "Academic Affairs Cell", "Pending", "Low", "Rohan Das", "Intake pending", null, null, "Optional activity and expected dates are intentionally missing for edge-case handling."),
  makeCase("WRO-2026-0032", "inst-10068", "2026-04-16", "Infrastructure review", "Western Regional Office", "Escalated", "Critical", "Nikhil Patil", "Escalated for resolution", "2026-10-09", "2026-10-01", "A synthetic critical regional file past its demonstration expected date."),
  makeCase("RB-2026-0160", "inst-10068", "2026-10-09", "Institution record update", "Regulation Bureau (RB)", "Pending", "Normal", "Devika Nair", "Awaiting desk review", "2026-10-11", "2026-11-16", "A separate record update, not an automatic duplicate."),
  makeCase("PGRC-2026-0198", "inst-10071", "2026-09-26", "Student grievance", "Public Grievance Redressal Cell (PGRC)", "Under process", "High", "Meera Rao", "Response received for review", "2026-10-26", "2026-10-31", "A current grievance approaching its illustrative target date."),
  makeCase("RB-2026-0188", "inst-10071", "2026-10-02", "Regulatory reporting", "Regulation Bureau (RB)", "Pending", "Normal", "Kavita Shah", "Awaiting triage", "2026-10-03", "2026-11-15", "A separate reporting matter for the same institution."),
  makeCase("RB-2026-0072", "inst-10074", "2026-05-06", "Approval clarification", "Regulation Bureau (RB)", "Disposed", "Low", "Devika Nair", "Clarification recorded", "2026-08-16", "2026-08-20", "Completed synthetic approval clarification."),
  makeCase("PGRC-2026-0220", "inst-10074", "2026-10-21", "Student records", "Public Grievance Redressal Cell (PGRC)", "Pending", "Normal", "Sana Iqbal", "Receipt acknowledged", "2026-10-22", "2026-11-21", "New student-records grievance."),
  makeCase("RB-2026-0146", "inst-10079", "2026-08-30", "Infrastructure compliance", "Regulation Bureau (RB)", "Under process", "High", "Arjun Menon", "Inspection evidence reviewed", "2026-10-19", "2026-11-02", "Illustrative compliance file under active review."),
  makeCase("WRO-2026-0071", "inst-10079", "2026-10-04", "Site inspection", "Western Regional Office", "Pending", "Normal", "Nikhil Patil", "Visit date requested", "2026-10-20", "2026-11-09", "Related regional context, pending coordination decision."),
  makeCase("PGRC-2026-0133", "inst-10082", "2026-07-20", "Student grievance", "Public Grievance Redressal Cell (PGRC)", "Transferred", "High", "Meera Rao", "Transferred to responsible Bureau", "2026-10-06", "2026-10-27", "Transferred illustrative grievance; awaiting cross-bureau action.", "Regulation Bureau (RB)"),
  makeCase("RB-2026-0194", "inst-10082", "2026-10-16", "Institution data correction", "Regulation Bureau (RB)", "Pending", "Low", "Kavita Shah", "Intake pending", "2026-10-17", "2026-11-18", "New records correction request."),
  makeCase("AAC-2026-0027", "inst-10086", "2026-03-11", "Programme review", "Academic Affairs Cell", "Disposed", "Normal", "Rohan Das", "Response recorded and file closed", "2026-06-18", "2026-06-29", "Closed illustrative programme file. Institution last activity is intentionally missing."),
  makeCase("RB-2026-0202", "inst-10086", "2026-10-23", "Approval query", "Regulation Bureau (RB)", "Pending", "Normal", "Arjun Menon", "New file awaiting review", "2026-10-24", "2026-11-24", "New synthetic query."),
  makeCase("PGRC-2026-0227", "inst-10035", "2026-10-25", "Student grievance", "Public Grievance Redressal Cell (PGRC)", "Pending", "Normal", "Sana Iqbal", "Receipt acknowledged", "2026-10-25", "2026-11-24", "A separate illustrative case. Similar institution name to DEMO-10036 requires manual identity review."),
  makeCase("RB-2026-0214", "inst-10038", "2026-10-20", "Regional compliance", "Regulation Bureau (RB)", "Pending", "Normal", "Kavita Shah", "Evidence checklist shared", "2026-10-26", "2026-11-16", "A second compliance work item for the same institution."),
  makeCase("PGRC-2026-0234", "inst-10031", "2026-10-24", "Student services query", "Public Grievance Redressal Cell (PGRC)", "Pending", "Low", "Meera Rao", "Receipt acknowledged", "2026-10-25", "2026-11-25", "A new independent grievance.")
];

const linkCases = (a: string, b: string) => {
  const left = cases.find((item) => item.id === a);
  const right = cases.find((item) => item.id === b);
  if (left && right) {
    left.relatedCaseIds.push(b);
    right.relatedCaseIds.push(a);
  }
};
linkCases("PGRC-2026-0142", "RB-2026-0081");
linkCases("RB-2026-0068", "WRO-2026-0044");
linkCases("RB-2026-0102", "PGRC-2026-0189");

export const SEED_REVIEW_OUTCOMES: Record<string, ReviewOutcome> = {
  "institution:inst-10024": "pending",
  "institution:inst-10038": "related",
  "institution:inst-10031": "no-conflict",
  "names:inst-10035:inst-10036": "pending",
};

export const createSeedState = (): DemoState => ({
  institutions: structuredClone(institutions),
  cases: structuredClone(cases),
  reviewOutcomes: structuredClone(SEED_REVIEW_OUTCOMES),
  readAlertIds: [],
  role: "Senior Management",
  enteredDemo: false,
  simulationSequence: 0,
  resetEpoch: 0,
});

export const SEED_CASE_COUNT = cases.length;
export const SEED_INSTITUTION_COUNT = institutions.length;

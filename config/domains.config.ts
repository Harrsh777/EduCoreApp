/**
 * Config-driven 3-Level Admin ERP: Domain → Sections → Modules.
 * Level 1: Admin Home shows only these 6 domains.
 * Level 2: Domain Hub renders sections and modules from this config.
 * Level 3: Module Workspace = existing screens at /dashboard/[schoolCode]/[route].
 * No hardcoded module lists in UI.
 */

export type DomainModule = {
  id?: string;
  title: string;
  route: string;
  description?: string;
  badge?: string;
  icon?: string;
};

export type DomainSection = {
  id?: string;
  title: string;
  modules: DomainModule[];
};

export type DomainConfig = {
  id: string;
  title: string;
  color: string;
  icon: string;
  sections: DomainSection[];
};

const FINANCE_COLOR = '#6366F1';
const ACADEMICS_COLOR = '#2563EB';
const STUDENTS_COLOR = '#0D9488';
const STAFF_COLOR = '#7C3AED';
const SECURITY_COLOR = '#DC2626';
const COMMUNICATION_COLOR = '#9333EA';

export const DOMAINS_CONFIG: DomainConfig[] = [
  {
    id: 'finance',
    title: 'Finance',
    color: FINANCE_COLOR,
    icon: 'wallet',
    sections: [
      {
        id: 'fee-management',
        title: 'Fee Management',
        modules: [
          { title: 'Fee Dashboard', route: 'fees/v2/dashboard', description: 'Summary: collected, this month, pending', icon: 'pie-chart' },
          { title: 'Fee Heads', route: 'fees/v2/fee-heads', description: 'CRUD fee heads (name, description, is_optional)', icon: 'list' },
          { title: 'Fee Structures', route: 'fees/v2/fee-structures', description: 'Attach heads to class/academic_year', icon: 'layers' },
          { title: 'Collect Payment', route: 'fees/v2/collection', description: 'Record payment: student, amount, mode, date → receipt', icon: 'card' },
          { title: 'Student Fee Statements', route: 'fees/statements', description: 'Per-student dues and payment history', icon: 'document-text' },
          { title: 'Discounts & Fines', route: 'fees/discounts-fines', description: 'Configure or apply discounts/fines', icon: 'pricetag' },
          { title: 'Fee Reports', route: 'fees/reports', description: 'Daily/monthly collection, pending, overdue', icon: 'bar-chart' },
        ],
      },
      {
        id: 'accounting',
        title: 'Accounting',
        modules: [
          { title: 'Expense/Income', route: 'expense-income', description: 'Track expenses and income', icon: 'trending-up' },
        ],
      },
    ],
  },
  {
    id: 'academics',
    title: 'Academics',
    color: ACADEMICS_COLOR,
    icon: 'school',
    sections: [
      {
        id: 'academic-setup',
        title: 'Academic Setup',
        modules: [
          { title: 'Academic Year Management', route: 'institute-info', description: 'Year setup, promotion, closure, audit', icon: 'calendar' },
          { title: 'Classes Overview', route: 'classes/overview', description: 'Summary of all classes with student count and class teacher', icon: 'book' },
          { title: 'Modify Classes', route: 'classes/modify', description: 'Create, edit, delete classes; assign class teacher', icon: 'create' },
          { title: 'Subject Teachers', route: 'classes/subject-teachers', description: 'Assign subject and teacher per class/section', icon: 'people' },
          { title: 'Add/Modify Subjects', route: 'classes/subjects', description: 'CRUD subjects for the school', icon: 'library' },
        ],
      },
      {
        id: 'timetable',
        title: 'Timetable',
        modules: [
          { title: 'Timetable Builder', route: 'timetable', description: 'Build and manage timetables', icon: 'grid' },
          { title: 'Class Timetable', route: 'timetable', description: 'View class-wise timetables', icon: 'today' },
          { title: 'Teacher Timetable', route: 'timetable', description: 'View teacher-wise timetables', icon: 'person' },
          { title: 'Group Wise Timetable', route: 'timetable', description: 'Group-wise timetable view', icon: 'people' },
        ],
      },
      {
        id: 'calendar',
        title: 'Event/Calendar',
        modules: [
          { title: 'Academic Calendar', route: 'calendar/academic', description: 'View terms, session dates, key dates', icon: 'calendar' },
          { title: 'Events', route: 'calendar/events', description: 'List and create events (holidays, school events)', icon: 'calendar-outline' },
        ],
      },
      {
        id: 'examination',
        title: 'Examination System',
        modules: [
          { title: 'Examination Dashboard', route: 'examinations/dashboard', description: 'Overview of exams (upcoming, ongoing, completed)', icon: 'clipboard' },
          { title: 'Create Examination', route: 'examinations/create', description: 'Create exam with info, classes, subjects, schedule', icon: 'add-circle' },
          { title: 'Grade Scale', route: 'examinations/grade-scale', description: 'Define grade boundaries for auto-grading', icon: 'speedometer' },
          { title: 'Examination Reports', route: 'examinations/reports', description: 'Schedule, marks summary, pass/fail, rank', icon: 'stats-chart' },
          { title: 'Marks Dashboard', route: 'marks', description: 'Entry point: list exams, view marks summary', icon: 'analytics' },
          { title: 'Mark Entry', route: 'marks-entry', description: 'Enter marks per exam, class, subject for each student', icon: 'create' },
        ],
      },
      {
        id: 'report-cards',
        title: 'Report Cards',
        modules: [
          { title: 'Generate Report Card', route: 'report-card/generate', description: 'Generate for exam/class/students using template', icon: 'document' },
          { title: 'Report Card Dashboard', route: 'report-card/dashboard', description: 'List and access generated report cards', icon: 'folder-open' },
          { title: 'Customize Template', route: 'report-card/templates', description: 'CRUD report card templates (layout, placeholders)', icon: 'options' },
        ],
      },
      {
        id: 'academic-tools',
        title: 'Academic Tools',
        modules: [
          { title: 'Copy Checking', route: 'copy-checking', description: 'Manage copy checking', icon: 'document-text' },
          { title: 'Digital Diary (Homework)', route: 'homework', description: 'Homework and diary management', icon: 'bookmark' },
          { title: 'Certificate Dashboard', route: 'certificates/dashboard', description: 'Issued certificates; links to issue and templates', icon: 'ribbon' },
          { title: 'New Certificate', route: 'certificates/new', description: 'Issue certificate: student, template, placeholders', icon: 'add-circle' },
        ],
      },
    ],
  },
  {
    id: 'students',
    title: 'Students',
    color: STUDENTS_COLOR,
    icon: 'people',
    sections: [
      {
        id: 'student-management',
        title: 'Student Management',
        modules: [
          { title: 'Add Student', route: 'students/add', description: 'Create a new student record', icon: 'person-add' },
          { title: 'Student Directory', route: 'students/directory', description: 'Searchable, filterable list of students', icon: 'people' },
          { title: 'Bulk Import Students', route: 'students/import', description: 'Import many students from CSV/Excel', icon: 'cloud-upload' },
          { title: 'Student Siblings', route: 'students/siblings', description: 'Link siblings (associate students as siblings)', icon: 'git-branch' },
        ],
      },
      {
        id: 'attendance',
        title: 'Attendance',
        modules: [
          { title: 'Mark Attendance', route: 'students/mark-attendance', description: 'Mark daily student attendance by class/section', icon: 'checkmark-done' },
          { title: 'Student Attendance Report', route: 'students/attendance-report', description: 'Attendance summary by student/class/date range', icon: 'stats-chart' },
        ],
      },
      {
        id: 'library',
        title: 'Library',
        modules: [
          { title: 'Library Dashboard', route: 'library/dashboard', description: 'Summary: books, issued, overdue', icon: 'library' },
          { title: 'Library Basics', route: 'library/basics', description: 'CRUD sections and material types', icon: 'settings' },
          { title: 'Library Catalogue', route: 'library/catalogue', description: 'List/search books; add book and copies; issue', icon: 'book' },
          { title: 'Library Transactions', route: 'library/transactions', description: 'List issue/return; perform return', icon: 'swap-horizontal' },
        ],
      },
      {
        id: 'transport',
        title: 'Transport',
        modules: [
          { title: 'Transport Dashboard', route: 'transport/dashboard', description: 'Overview: routes, vehicles, students mapped', icon: 'bus' },
          { title: 'Vehicles', route: 'transport/vehicles', description: 'CRUD vehicles (number, type, capacity)', icon: 'car' },
          { title: 'Stops', route: 'transport/stops', description: 'CRUD stops (name, address, order)', icon: 'location' },
          { title: 'Routes', route: 'transport/routes', description: 'Create/edit routes: name, vehicle, stop sequence', icon: 'map' },
          { title: 'Student Route Mapping', route: 'transport/route-students', description: 'Assign students to route and stop', icon: 'git-branch' },
        ],
      },
    ],
  },
  {
    id: 'staff',
    title: 'Staff',
    color: STAFF_COLOR,
    icon: 'person',
    sections: [
      {
        id: 'staff-management',
        title: 'Staff Management',
        modules: [
          { title: 'Staff Directory', route: 'staff-management', description: 'Browse and manage staff', icon: 'people' },
          { title: 'Add Staff', route: 'staff-management/add', description: 'Add new staff member', icon: 'person-add' },
          { title: 'Bulk Staff Import', route: 'staff-management/import', description: 'Import staff in bulk', icon: 'cloud-upload' },
          { title: 'Bulk Photo Upload', route: 'staff-management', description: 'Upload staff photos in bulk', icon: 'images' },
        ],
      },
      {
        id: 'attendance',
        title: 'Attendance',
        modules: [
          { title: 'Staff Attendance', route: 'attendance/staff', description: 'Mark daily staff attendance', icon: 'checkmark-done' },
          { title: 'Staff Attendance Marking Report', route: 'attendance', description: 'Attendance reports', icon: 'stats-chart' },
          { title: 'Attendance', route: 'attendance', description: 'Attendance dashboard', icon: 'calendar' },
        ],
      },
      {
        id: 'leave-management',
        title: 'Leave Management',
        modules: [
          { title: 'Leave Dashboard', route: 'leave/dashboard', description: 'Pending staff/student requests; leave types', icon: 'calendar' },
          { title: 'Staff Leave Management', route: 'leave/staff-leave-management', description: 'List staff leave requests; approve/reject', icon: 'person' },
          { title: 'Student Leave Approval', route: 'leave/student-leave', description: 'List student leave requests; approve/reject', icon: 'school' },
          { title: 'Staff Leave Approval', route: 'leave/staff-leave', description: 'Approve staff leave', icon: 'checkmark-circle' },
          { title: 'Leave Basics', route: 'leave/basics', description: 'Configure leave types and working days', icon: 'settings' },
        ],
      },
      {
        id: 'access-roles',
        title: 'Access & Roles',
        modules: [
          { title: 'Role Management', route: 'settings/roles', description: 'Manage roles and permissions', icon: 'shield-checkmark' },
          { title: 'Password Manager', route: 'password', description: 'Manage passwords', icon: 'key' },
        ],
      },
    ],
  },
  {
    id: 'security',
    title: 'Security',
    color: SECURITY_COLOR,
    icon: 'shield-checkmark',
    sections: [
      {
        id: 'front-office',
        title: 'Front Office',
        modules: [
          { title: 'Front Office Dashboard', route: 'front-office', description: 'Today’s passes, visitors in/out', icon: 'desktop' },
          { title: 'Gate Pass', route: 'gate-pass', description: 'Create and list gate passes; mark returned', icon: 'exit' },
          { title: 'Visitor Management', route: 'visitor-management', description: 'Check-in/check-out visitors; list and search', icon: 'person' },
        ],
      },
      {
        id: 'institute-control',
        title: 'Institute Control',
        modules: [
          { title: 'Institute Info', route: 'institute-info', description: 'Institute details and settings', icon: 'business' },
          { title: 'Basic Institute Info', route: 'institute-info', description: 'Basic institute information', icon: 'information-circle' },
        ],
      },
    ],
  },
  {
    id: 'communication',
    title: 'Communication',
    color: COMMUNICATION_COLOR,
    icon: 'chatbubbles',
    sections: [
      {
        id: 'messaging',
        title: 'Messaging',
        modules: [
          { title: 'Communication', route: 'communication', description: 'Send messages and announcements', icon: 'chatbubbles' },
        ],
      },
      {
        id: 'reports-media',
        title: 'Reports & Media',
        modules: [
          { title: 'Report', route: 'reports', description: 'View and generate reports', icon: 'bar-chart' },
          { title: 'Gallery', route: 'gallery', description: 'Media and gallery', icon: 'images' },
        ],
      },
    ],
  },
];

export function getDomainById(id: string): DomainConfig | undefined {
  return DOMAINS_CONFIG.find((d) => d.id === id);
}

export function getAllDomains(): DomainConfig[] {
  return DOMAINS_CONFIG;
}

/** Flat list for global search: domains + all modules with context. */
export type SearchableItem = {
  type: 'domain' | 'module';
  title: string;
  subtitle?: string;
  /** For navigation: module route (e.g. 'fees') or domain id for domain (e.g. 'finance'). */
  route: string;
  domainId: string;
  domainTitle: string;
  sectionTitle?: string;
  icon?: string;
  color?: string;
};

export function getSearchableItems(): SearchableItem[] {
  const items: SearchableItem[] = [];
  for (const domain of DOMAINS_CONFIG) {
    items.push({
      type: 'domain',
      title: domain.title,
      subtitle: 'Open domain',
      route: domain.id,
      domainId: domain.id,
      domainTitle: domain.title,
      icon: domain.icon,
      color: domain.color,
    });
    for (const section of domain.sections) {
      for (const mod of section.modules) {
        items.push({
          type: 'module',
          title: mod.title,
          subtitle: mod.description,
          route: mod.route,
          domainId: domain.id,
          domainTitle: domain.title,
          sectionTitle: section.title,
          icon: mod.icon,
          color: domain.color,
        });
      }
    }
  }
  return items;
}

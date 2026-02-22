/**
 * Student dashboard menu: sections and modules with paths and icons.
 * Matches the required routes and API usage.
 */

import type Ionicons from '@expo/vector-icons/Ionicons';

export type ModuleItem = {
  id: string;
  label: string;
  path: string;
  icon: keyof typeof Ionicons.glyphMap;
};

export type SectionConfig = {
  id: string;
  title: string;
  modules: ModuleItem[];
};

export const STUDENT_DASHBOARD_SECTIONS: SectionConfig[] = [
  {
    id: 'academics',
    title: 'Academics',
    modules: [
      { id: 'my-class', label: 'My Class', path: 'class', icon: 'school' },
      { id: 'attendance', label: 'Attendance', path: 'attendance', icon: 'calendar' },
      { id: 'examinations', label: 'Examinations', path: 'examinations', icon: 'document-text' },
      { id: 'marks', label: 'Marks', path: 'marks', icon: 'bar-chart' },
      { id: 'report-card', label: 'Report Card', path: 'report-card', icon: 'ribbon' },
      { id: 'copy-checking', label: 'Copy Checking', path: 'copy-checking', icon: 'document-text-outline' },
      { id: 'calendar', label: 'Academic Calendar', path: 'calendar/academic', icon: 'calendar-outline' },
      { id: 'diary', label: 'Digital Diary', path: 'diary', icon: 'book' },
      { id: 'library', label: 'Library', path: 'library', icon: 'library' },
    ],
  },
  {
    id: 'fees-transport',
    title: 'Fees & Transport',
    modules: [
      { id: 'fees', label: 'Fees', path: 'fees', icon: 'cash' },
      { id: 'transport', label: 'Transport Info', path: 'transport', icon: 'bus' },
    ],
  },
  {
    id: 'requests',
    title: 'Requests',
    modules: [
      { id: 'apply-leave', label: 'Apply for Leave', path: 'apply-leave', icon: 'calendar-outline' },
      { id: 'my-leaves', label: 'My Leaves', path: 'my-leaves', icon: 'calendar' },
      { id: 'certificates', label: 'Certificate Management', path: 'certificates', icon: 'ribbon' },
    ],
  },
  {
    id: 'communication',
    title: 'Communication',
    modules: [
      { id: 'communication', label: 'Communication', path: 'communication', icon: 'notifications' },
      { id: 'parent', label: 'Parent Info', path: 'parent', icon: 'people' },
    ],
  },
  {
    id: 'media',
    title: 'Media & Activities',
    modules: [
      { id: 'gallery', label: 'Gallery', path: 'gallery', icon: 'images' },
    ],
  },
  {
    id: 'account',
    title: 'Account',
    modules: [
      { id: 'settings', label: 'Settings', path: 'settings', icon: 'settings' },
      { id: 'change-password', label: 'Change Password', path: 'change-password', icon: 'key' },
    ],
  },
];

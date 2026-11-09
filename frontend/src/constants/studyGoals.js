import { BookOpen, Target, GraduationCap, MoreHorizontal } from 'lucide-react';

// Ids must match STUDY_GOALS in backend/app/schemas.py
export const STUDY_GOALS = [
    { id: 'jamb', label: 'JAMB / UTME', description: 'Joint Admissions & Matriculation', icon: Target },
    { id: 'waec', label: 'WAEC / SSCE', description: 'West African Senior Certificate', icon: BookOpen },
    { id: 'uni', label: 'University Exams', description: 'Undergraduate coursework & tests', icon: GraduationCap },
    { id: 'other', label: 'General Study', description: 'General learning & revision', icon: MoreHorizontal },
];

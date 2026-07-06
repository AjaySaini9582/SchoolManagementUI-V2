export interface Homework {
  id: number;
  classSectionId: number;
  subjectId: number;
  title: string;
  description: string | null;
  homeworkDate: string;
  dueDate: string | null;
  isActive: boolean;
}

export interface HomeworkListItem {
  id: number;
  classSectionId: number;
  classSectionName: string | null;
  subjectId: number;
  subjectName: string | null;
  title: string | null;
  description: string | null;
  homeworkDate: string;
  dueDate: string | null;
  isActive: boolean;
}

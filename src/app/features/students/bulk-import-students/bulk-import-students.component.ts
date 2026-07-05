import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';

import { MASTER_KEY, MasterKeyDataValue } from '../../../core/models/master.model';
import { ClassWithSectionsDto, SessionResponseDTO } from '../../../core/models/setup.model';
import { BulkImportResult, StudentBulkImportRow } from '../../../core/models/student.model';
import { MasterService } from '../../../core/services/master.service';
import { SetupService } from '../../../core/services/setup.service';
import { StudentService } from '../../../core/services/student.service';
import { EmptyStateComponent } from '../../../shared/empty-state/empty-state.component';
import { ToastService } from '../../../shared/toast/toast.service';
import { downloadCsv, parseCsv, toCsv } from '../../../shared/utils/csv-export.util';

const EXPECTED_COLUMNS = [
  { key: 'Name', header: 'Name' },
  { key: 'FatherName', header: 'FatherName' },
  { key: 'MotherName', header: 'MotherName' },
  { key: 'ContactNumber', header: 'ContactNumber' },
  { key: 'DOB', header: 'DOB' },
  { key: 'Gender', header: 'Gender' },
  { key: 'AdmissionNumber', header: 'AdmissionNumber' },
  { key: 'RollNumber', header: 'RollNumber' },
  { key: 'Class', header: 'Class' },
  { key: 'Section', header: 'Section' },
  { key: 'SessionStart', header: 'SessionStart' },
];

interface ParsedRow {
  lineNumber: number;
  raw: Record<string, string>;
  row: StudentBulkImportRow | null;
  error: string | null;
}

/** CSV-only bulk import (no .xlsx support — that would need a client-side
 * Excel-parsing library, which isn't installed). "Download Template" gives
 * admins the exact header row expected. */
@Component({
  selector: 'app-bulk-import-students',
  standalone: true,
  imports: [EmptyStateComponent, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatTableModule],
  templateUrl: './bulk-import-students.component.html',
  styleUrl: './bulk-import-students.component.scss',
})
export class BulkImportStudentsComponent implements OnInit {
  private readonly setupService = inject(SetupService);
  private readonly masterService = inject(MasterService);
  private readonly studentService = inject(StudentService);
  private readonly toast = inject(ToastService);

  private classSections: ClassWithSectionsDto[] = [];
  private sessions: SessionResponseDTO[] = [];
  private genders: MasterKeyDataValue[] = [];

  readonly parsedRows = signal<ParsedRow[]>([]);
  readonly importing = signal(false);
  readonly result = signal<BulkImportResult | null>(null);
  readonly displayedColumns = ['lineNumber', 'name', 'class', 'session', 'status'];

  get validRowCount(): number {
    return this.parsedRows().filter((row) => row.row !== null).length;
  }

  ngOnInit(): void {
    this.setupService.getAllClassesWithSections().subscribe((response) => (this.classSections = response.data ?? []));
    this.setupService.getAllCreateSession().subscribe((response) => (this.sessions = response.data ?? []));
    this.masterService.getMasterKeyData([MASTER_KEY.Gender]).subscribe((response) => (this.genders = response.data ?? []));
  }

  downloadTemplate(): void {
    const sampleRow = {
      Name: 'Aarav Sharma',
      FatherName: 'Rajesh Sharma',
      MotherName: 'Priya Sharma',
      ContactNumber: '9999999999',
      DOB: '2015-05-10',
      Gender: 'Male',
      AdmissionNumber: 'ADM001',
      RollNumber: '1',
      Class: 'Class 1',
      Section: 'A',
      SessionStart: '2025',
    };
    downloadCsv(toCsv([sampleRow], EXPECTED_COLUMNS), 'student-import-template.csv');
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    this.result.set(null);
    const reader = new FileReader();
    reader.onload = () => this.parseFile(String(reader.result ?? ''));
    reader.readAsText(file);
    input.value = '';
  }

  import(): void {
    const rows = this.parsedRows()
      .map((parsed) => parsed.row)
      .filter((row): row is StudentBulkImportRow => row !== null);

    if (rows.length === 0) {
      this.toast.error('No valid rows to import.');
      return;
    }

    this.importing.set(true);
    this.studentService.bulkImportStudents(rows).subscribe({
      next: (response) => {
        this.importing.set(false);
        if (response.isSuccess) {
          this.toast.success(response.errorMessage ?? 'Import complete.');
          this.result.set(response.data);
        } else {
          this.toast.error(response.errorMessage ?? 'Unable to import students.');
        }
      },
      error: () => {
        this.importing.set(false);
        this.toast.error('Unable to import students right now.');
      },
    });
  }

  private parseFile(content: string): void {
    const records = parseCsv(content);
    if (records.length === 0) {
      this.toast.error('The file has no data rows.');
      return;
    }

    this.parsedRows.set(records.map((record, index) => this.resolveRow(record, index + 2)));
  }

  private resolveRow(record: Record<string, string>, lineNumber: number): ParsedRow {
    const name = record['Name']?.trim();
    if (!name) {
      return { lineNumber, raw: record, row: null, error: 'Name is required.' };
    }

    const className = record['Class']?.trim();
    const sectionName = record['Section']?.trim();
    const cls = this.classSections.find((c) => c.name.toLowerCase() === className?.toLowerCase());
    const section = cls?.sections.find((s) => s.name.toLowerCase() === sectionName?.toLowerCase());
    if (!cls || !section) {
      return { lineNumber, raw: record, row: null, error: `Unknown class/section: "${className}" / "${sectionName}".` };
    }

    const sessionStart = Number(record['SessionStart']);
    const session = this.sessions.find((s) => s.start === sessionStart);
    if (!session) {
      return { lineNumber, raw: record, row: null, error: `Unknown session start year: "${record['SessionStart']}".` };
    }

    const genderText = record['Gender']?.trim();
    const gender = genderText ? this.genders.find((g) => g.text?.toLowerCase() === genderText.toLowerCase()) : undefined;

    const dobText = record['DOB']?.trim();
    let dob: string | null = null;
    if (dobText) {
      dob = this.normalizeDob(dobText);
      if (!dob) {
        return { lineNumber, raw: record, row: null, error: `Invalid DOB "${dobText}" — use yyyy-MM-dd or dd-MM-yyyy.` };
      }
    }

    const row: StudentBulkImportRow = {
      name,
      fatherName: record['FatherName'] || null,
      motherName: record['MotherName'] || null,
      contactNumber: record['ContactNumber'] || null,
      dob,
      genderId: gender?.id ?? null,
      admissionNumber: record['AdmissionNumber'] || null,
      rollNumber: record['RollNumber'] ? Number(record['RollNumber']) : null,
      classSectionId: section.id,
      sessionYearId: session.id,
    };
    return { lineNumber, raw: record, row, error: null };
  }

  /** The backend deserializes `dob` straight into `DateTime?` via
   * System.Text.Json, which only accepts ISO 8601 (`yyyy-MM-dd`) — it
   * rejects any other format with a 400 rather than a friendly per-row
   * error. CSV dates very commonly aren't ISO once a spreadsheet app has
   * touched the file (Excel silently reformats date-looking cells to the
   * system locale, e.g. `10/05/2015`), so normalize here — before the
   * request ever goes out — rather than let a whole-batch import fail on
   * a single malformed date deep in row N. */
  private normalizeDob(value: string): string | null {
    const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (isoMatch) {
      return value;
    }
    const dayFirstMatch = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(value);
    if (dayFirstMatch) {
      const [, day, month, year] = dayFirstMatch;
      const dd = day.padStart(2, '0');
      const mm = month.padStart(2, '0');
      if (Number(mm) >= 1 && Number(mm) <= 12 && Number(dd) >= 1 && Number(dd) <= 31) {
        return `${year}-${mm}-${dd}`;
      }
    }
    return null;
  }
}

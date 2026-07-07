import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { Observable, forkJoin, of, switchMap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { MASTER_KEY, MasterKeyDataValue } from '../../core/models/master.model';
import { SCHOOL_DOCUMENT_NAME, SchoolProfile, SchoolUploadDocument } from '../../core/models/school.model';
import { MasterApiResponseDTO } from '../../core/models/shared.model';
import { MasterService } from '../../core/services/master.service';
import { SchoolProfileContextService } from '../../core/services/school-profile-context.service';
import { SchoolService } from '../../core/services/school.service';
import { FieldErrorComponent } from '../../shared/field-error/field-error.component';
import { FileUploadComponent } from '../../shared/file-upload/file-upload.component';
import { ToastService } from '../../shared/toast/toast.service';

@Component({
  selector: 'app-school-profile',
  standalone: true,
  imports: [
    FieldErrorComponent,
    FileUploadComponent,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    ReactiveFormsModule,
  ],
  templateUrl: './school-profile.component.html',
  styleUrl: './school-profile.component.scss',
})
export class SchoolProfileComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly schoolService = inject(SchoolService);
  private readonly masterService = inject(MasterService);
  private readonly schoolProfileContext = inject(SchoolProfileContextService);
  private readonly toast = inject(ToastService);

  private schoolId = 0;

  readonly loading = signal(true);
  readonly saving = signal(false);

  readonly banks = signal<MasterApiResponseDTO[]>([]);
  readonly accountTypes = signal<MasterKeyDataValue[]>([]);

  private readonly logoMasterId = signal<number | null>(null);
  private readonly letterheadMasterId = signal<number | null>(null);
  readonly existingLogo = signal<SchoolUploadDocument | null>(null);
  readonly existingLetterhead = signal<SchoolUploadDocument | null>(null);

  readonly form = this.formBuilder.nonNullable.group({
    name: ['', Validators.required],
    alternateName: [''],
    affiliationName: [''],
    affiliationRegdNumber: [''],
    schoolCode: [''],
    udiseCode: [''],
    contactNumber: ['', Validators.required],
    phoneNumber: [''],
    smsNumber: [''],
    email: ['', Validators.email],
    website: [''],
    address: [''],
    accountTypeId: [null as number | null],
    bankId: [null as number | null],
    accountNumber: [''],
    ifscCode: [''],
    pricipalName: [''],
    isEPF: [false],
    epfAmtPer: [0],
    isEPS: [false],
    epsAmtPer: [0],
    schoolPrefix: [''],
    isFine: [false],
    fineFromDate: [0],
    finePerDayAmount: [0],
    isWhatsApp: [false],
    isSMS: [false],
    aboutSchool: [''],
    termsConditionsForStudents: [''],
    declaration: [''],
    logoFile: [null as File | null],
    letterheadFile: [null as File | null],
  });

  ngOnInit(): void {
    forkJoin({
      banks: this.masterService.getAllBankMaster(),
      accountTypes: this.masterService.getMasterKeyData([MASTER_KEY.BankAccountType]),
      documentTypes: this.schoolService.getAllSchoolDocumentMasterList(),
      profile: this.schoolService.getSchoolData(),
    }).subscribe({
      next: (result) => {
        this.banks.set(result.banks.data ?? []);
        this.accountTypes.set(result.accountTypes.data ?? []);

        const documentTypes = result.documentTypes.data ?? [];
        this.logoMasterId.set(documentTypes.find((doc) => doc.documentName === SCHOOL_DOCUMENT_NAME.Logo)?.id ?? null);
        this.letterheadMasterId.set(documentTypes.find((doc) => doc.documentName === SCHOOL_DOCUMENT_NAME.Letterhead)?.id ?? null);

        // A brand-new install has no school row yet — GetSchoolData reports
        // isSuccess=false with no data in that case, which is not an error,
        // just an empty form ready for the first save.
        const profile = result.profile.data;
        if (profile) {
          this.schoolId = profile.id;
          this.patchForm(profile);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Unable to load the school profile form.');
      },
    });
  }

  logoUrl(): string | null {
    const doc = this.existingLogo();
    return doc?.fileName ? `${environment.apiBaseUrl}/UploadFiles/School/${this.schoolId}/${doc.fileName}` : null;
  }

  letterheadUrl(): string | null {
    const doc = this.existingLetterhead();
    return doc?.fileName ? `${environment.apiBaseUrl}/UploadFiles/School/${this.schoolId}/${doc.fileName}` : null;
  }

  private patchForm(profile: SchoolProfile): void {
    const bank = profile.schoolBankDTO;
    const other = profile.schoolOtherInformationDTO;
    this.form.patchValue({
      name: profile.name,
      alternateName: profile.alternateName ?? '',
      affiliationName: profile.affiliationName ?? '',
      affiliationRegdNumber: profile.affiliationRegdNumber ?? '',
      schoolCode: profile.schoolCode ?? '',
      udiseCode: profile.udiseCode ?? '',
      contactNumber: profile.contactNumber ?? '',
      phoneNumber: profile.phoneNumber ?? '',
      smsNumber: profile.smsNumber ?? '',
      email: profile.email ?? '',
      website: profile.website ?? '',
      address: profile.address ?? '',
      accountTypeId: bank?.accountTypeId ?? null,
      bankId: bank?.bankId ?? null,
      accountNumber: bank?.accountNumber ?? '',
      ifscCode: bank?.ifscCode ?? '',
      pricipalName: other?.pricipalName ?? '',
      isEPF: other?.isEPF ?? false,
      epfAmtPer: other?.epfAmtPer ?? 0,
      isEPS: other?.isEPS ?? false,
      epsAmtPer: other?.epsAmtPer ?? 0,
      schoolPrefix: other?.schoolPrefix ?? '',
      isFine: other?.isFine ?? false,
      fineFromDate: other?.fineFromDate ?? 0,
      finePerDayAmount: other?.finePerDayAmount ?? 0,
      isWhatsApp: other?.isWhatsApp ?? false,
      isSMS: other?.isSMS ?? false,
      aboutSchool: other?.aboutSchool ?? '',
      termsConditionsForStudents: other?.termsConditionsForStudents ?? '',
      declaration: other?.declaration ?? '',
    });

    const documents = profile.uploadDocumentDTO ?? [];
    this.existingLogo.set(documents.find((doc) => doc.schoolDocumentMasterId === this.logoMasterId()) ?? null);
    this.existingLetterhead.set(documents.find((doc) => doc.schoolDocumentMasterId === this.letterheadMasterId()) ?? null);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.error('Fill in the required fields before saving.');
      return;
    }

    const value = this.form.getRawValue();
    const documents: SchoolUploadDocument[] = [];
    const logoMasterId = this.logoMasterId();
    const letterheadMasterId = this.letterheadMasterId();
    if (value.logoFile && logoMasterId) {
      documents.push({ id: 0, schoolDocumentMasterId: logoMasterId, fileName: null, filePath: null, file: value.logoFile });
    }
    if (value.letterheadFile && letterheadMasterId) {
      documents.push({ id: 0, schoolDocumentMasterId: letterheadMasterId, fileName: null, filePath: null, file: value.letterheadFile });
    }

    const profile: SchoolProfile = {
      id: this.schoolId,
      name: value.name,
      alternateName: value.alternateName || null,
      affiliationName: value.affiliationName || null,
      affiliationRegdNumber: value.affiliationRegdNumber || null,
      schoolCode: value.schoolCode || null,
      udiseCode: value.udiseCode || null,
      contactNumber: value.contactNumber,
      phoneNumber: value.phoneNumber || null,
      smsNumber: value.smsNumber || null,
      email: value.email || null,
      website: value.website || null,
      address: value.address || null,
      schoolBankDTO: {
        accountTypeId: value.accountTypeId,
        bankId: value.bankId,
        accountNumber: value.accountNumber || null,
        ifscCode: value.ifscCode || null,
      },
      schoolOtherInformationDTO: {
        pricipalName: value.pricipalName || null,
        isEPF: value.isEPF,
        epfAmtPer: value.epfAmtPer,
        isEPS: value.isEPS,
        epsAmtPer: value.epsAmtPer,
        schoolPrefix: value.schoolPrefix || null,
        isFine: value.isFine,
        fineFromDate: value.fineFromDate,
        finePerDayAmount: value.finePerDayAmount,
        isWhatsApp: value.isWhatsApp,
        isSMS: value.isSMS,
        aboutSchool: value.aboutSchool || null,
        termsConditionsForStudents: value.termsConditionsForStudents || null,
        declaration: value.declaration || null,
      },
      uploadDocumentDTO: documents.length > 0 ? documents : null,
    };

    // Every save adds a brand-new Tb_School_Upload_Document row for any
    // attached file — it never replaces the old one. So when the user is
    // re-uploading a logo/letterhead that already exists, delete the old
    // document (removes the DB row + physical file) first, or saving would
    // leave the previous file orphaned on disk and duplicated in the DB.
    const staleDocumentIds: number[] = [];
    if (value.logoFile && this.existingLogo()) {
      staleDocumentIds.push(this.existingLogo()!.id);
    }
    if (value.letterheadFile && this.existingLetterhead()) {
      staleDocumentIds.push(this.existingLetterhead()!.id);
    }

    // forkJoin([]) completes without ever emitting a value, so switchMap
    // would never fire and this would hang forever when there's nothing to
    // delete — fall back to of(null) in that case instead.
    const deleteStaleDocuments$: Observable<unknown> =
      staleDocumentIds.length > 0
        ? forkJoin(staleDocumentIds.map((id) => this.schoolService.deleteSchoolDocument(id)))
        : of(null);

    this.saving.set(true);
    deleteStaleDocuments$
      .pipe(switchMap(() => this.schoolService.addOrUpdateSchoolData(profile)))
      .subscribe({
        next: (response) => {
          this.saving.set(false);
          if (response.isSuccess) {
            this.toast.success('School profile saved.');
            this.form.patchValue({ logoFile: null, letterheadFile: null });
            this.schoolProfileContext.refresh();
            this.reload();
          } else {
            this.toast.error(response.errorMessage ?? 'Unable to save the school profile.');
          }
        },
        error: () => {
          this.saving.set(false);
          this.toast.error('Unable to save the school profile right now.');
        },
      });
  }

  private reload(): void {
    this.schoolService.getSchoolData().subscribe((response) => {
      const profile = response.data;
      if (profile) {
        this.schoolId = profile.id;
        this.patchForm(profile);
      }
    });
  }
}

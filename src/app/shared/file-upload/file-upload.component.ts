import { Component, ElementRef, Input, OnDestroy, ViewChild, forwardRef, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

/** Single-file drag-drop picker with preview, wired as a `ControlValueAccessor`
 * so it drops straight into a reactive form as `[formControl]` bound to
 * `File | null` — matching the `UploadDocument.file` shape used by the
 * Student/Employee document-upload flows. */
@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './file-upload.component.html',
  styleUrl: './file-upload.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FileUploadComponent),
      multi: true,
    },
  ],
})
export class FileUploadComponent implements ControlValueAccessor, OnDestroy {
  @Input() accept = 'image/*,.pdf';
  @Input() maxSizeMB = 5;
  @Input() label = 'Drag & drop a file here, or click to browse';
  /** Shown above the dropzone (as a link) when editing a record that already
   * has a file on the server and the user hasn't picked a replacement yet —
   * without this the dropzone looks identical whether a document was
   * previously uploaded or not, with no way to see or open what's already
   * there. */
  @Input() existingFileUrl: string | null = null;
  @Input() existingFileName: string | null = null;

  @ViewChild('fileInput') private readonly fileInputRef!: ElementRef<HTMLInputElement>;

  readonly file = signal<File | null>(null);
  readonly previewUrl = signal<string | null>(null);
  readonly dragOver = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly disabled = signal(false);

  private onChange: (value: File | null) => void = () => {};
  private onTouched: () => void = () => {};

  get isImage(): boolean {
    return this.file()?.type.startsWith('image/') ?? false;
  }

  get isExistingImage(): boolean {
    return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(this.existingFileName ?? '');
  }

  writeValue(value: File | null): void {
    this.setFile(value);
  }

  registerOnChange(fn: (value: File | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (!this.disabled()) {
      this.dragOver.set(true);
    }
  }

  onDragLeave(): void {
    this.dragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(false);
    if (this.disabled()) {
      return;
    }
    const dropped = event.dataTransfer?.files?.[0] ?? null;
    if (dropped) {
      this.selectFile(dropped);
    }
  }

  onInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const selected = input.files?.[0] ?? null;
    if (selected) {
      this.selectFile(selected);
    }
    input.value = '';
  }

  triggerBrowse(): void {
    if (!this.disabled()) {
      this.fileInputRef.nativeElement.click();
    }
  }

  remove(event: Event): void {
    event.stopPropagation();
    this.setFile(null);
    this.onChange(null);
  }

  private selectFile(candidate: File): void {
    this.onTouched();
    if (candidate.size > this.maxSizeMB * 1024 * 1024) {
      this.errorMessage.set(`File exceeds ${this.maxSizeMB}MB.`);
      return;
    }
    this.errorMessage.set(null);
    this.setFile(candidate);
    this.onChange(candidate);
  }

  private setFile(value: File | null): void {
    const existingPreview = this.previewUrl();
    if (existingPreview) {
      URL.revokeObjectURL(existingPreview);
      this.previewUrl.set(null);
    }
    this.file.set(value);
    if (value?.type.startsWith('image/')) {
      this.previewUrl.set(URL.createObjectURL(value));
    }
  }

  ngOnDestroy(): void {
    const existingPreview = this.previewUrl();
    if (existingPreview) {
      URL.revokeObjectURL(existingPreview);
    }
  }
}

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FileUploadComponent } from './file-upload.component';

function makeFile(name: string, sizeBytes: number, type = 'image/png'): File {
  return new File([new Uint8Array(sizeBytes)], name, { type });
}

describe('FileUploadComponent', () => {
  let fixture: ComponentFixture<FileUploadComponent>;
  let component: FileUploadComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FileUploadComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FileUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates with no file selected', () => {
    expect(component.file()).toBeNull();
    expect(component.previewUrl()).toBeNull();
  });

  it('writeValue sets the file without notifying the form', () => {
    const onChange = jasmine.createSpy('onChange');
    component.registerOnChange(onChange);

    const file = makeFile('photo.png', 1024);
    component.writeValue(file);

    expect(component.file()).toBe(file);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('selecting a file via the native input notifies the form and sets a preview for images', () => {
    const onChange = jasmine.createSpy('onChange');
    component.registerOnChange(onChange);

    const file = makeFile('photo.png', 1024, 'image/png');
    const input = document.createElement('input');
    Object.defineProperty(input, 'files', { value: [file] });

    component.onInputChange({ target: input } as unknown as Event);

    expect(component.file()).toBe(file);
    expect(onChange).toHaveBeenCalledWith(file);
    expect(component.previewUrl()).not.toBeNull();
  });

  it('rejects files over maxSizeMB without notifying the form', () => {
    const onChange = jasmine.createSpy('onChange');
    component.registerOnChange(onChange);
    component.maxSizeMB = 1;

    const tooBig = makeFile('big.pdf', 2 * 1024 * 1024, 'application/pdf');
    const input = document.createElement('input');
    Object.defineProperty(input, 'files', { value: [tooBig] });

    component.onInputChange({ target: input } as unknown as Event);

    expect(component.file()).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
    expect(component.errorMessage()).toContain('1MB');
  });

  it('remove() clears the file and notifies the form with null', () => {
    const onChange = jasmine.createSpy('onChange');
    component.registerOnChange(onChange);
    component.writeValue(makeFile('photo.png', 1024));

    component.remove(new Event('click'));

    expect(component.file()).toBeNull();
    expect(onChange).toHaveBeenCalledWith(null);
  });
});

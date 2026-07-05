import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { MasterService } from './master.service';

describe('MasterService', () => {
  let service: MasterService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(MasterService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('sends repeated KeyList query params for GetMasterKeyData, not a comma-joined value', () => {
    service.getMasterKeyData([1, 8]).subscribe();

    const req = httpMock.expectOne(
      (request) => request.url.endsWith('/api/Master/GetMasterKeyData') && request.method === 'GET',
    );
    expect(req.request.params.getAll('KeyList')).toEqual(['1', '8']);
    req.flush({ isSuccess: true, data: [], message: null, errorMessage: null, statusCode: 200 });
  });

  it('caches identical key-group requests instead of firing twice', () => {
    service.getMasterKeyData([1, 2]).subscribe();
    service.getMasterKeyData([2, 1]).subscribe();

    // Same group regardless of input order -> only one HTTP call.
    const req = httpMock.expectOne(() => true);
    expect(req.request.params.getAll('KeyList')).toEqual(['1', '2']);
    req.flush({ isSuccess: true, data: [], message: null, errorMessage: null, statusCode: 200 });
  });
});

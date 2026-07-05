import { Directive, Input, TemplateRef } from '@angular/core';

import { DataTableCellContext } from './data-table.model';

/** Lets a parent override how one column renders, e.g.:
 * `<ng-template appDataTableCell="status" let-row>...</ng-template>` */
@Directive({
  selector: '[appDataTableCell]',
  standalone: true,
})
export class DataTableCellDirective<T = unknown> {
  @Input('appDataTableCell') column = '';

  constructor(public readonly templateRef: TemplateRef<DataTableCellContext<T>>) {}
}

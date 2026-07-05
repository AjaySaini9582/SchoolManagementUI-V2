/** Flattens an object into FormData using ASP.NET Core's default `[FromForm]`
 * model-binding convention: dot notation for nested objects, `[index]` for
 * collections. Needed for `Student`/`Employee` create-or-update payloads,
 * which mix scalar fields, nested detail objects, and `IFormFile` uploads. */
export function toFormData(value: unknown, formData: FormData = new FormData(), parentKey = ''): FormData {
  if (value === null || value === undefined) {
    return formData;
  }
  if (value instanceof File) {
    formData.append(parentKey, value);
    return formData;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => toFormData(item, formData, `${parentKey}[${index}]`));
    return formData;
  }
  if (typeof value === 'object') {
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      const nextKey = parentKey ? `${parentKey}.${key}` : key;
      toFormData(nested, formData, nextKey);
    }
    return formData;
  }
  formData.append(parentKey, String(value));
  return formData;
}

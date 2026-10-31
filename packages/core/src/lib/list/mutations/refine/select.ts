export function applySelect(item: any, select?: any): any {
  if (!item || !select) return item;

  let result = { ...item };

  if (Array.isArray(select.omit) && select.omit.length > 0) {
    for (const key of select.omit) {
      delete result[key];
    }
  }

  if (Array.isArray(select.pick) && select.pick.length > 0) {
    const picked: any = {};
    for (const key of select.pick) {
      if (key in result) {
        picked[key] = result[key];
      }
    }
    result = picked;
  }

  return result;
}

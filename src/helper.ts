export class Helper {
  public static IsNullOrUndefined(value: any): boolean {
    return typeof value === 'undefined' || value === null;
  }

  public static GetClassContainingString(classList: DOMTokenList, match: string): string {
    let found = '';

    classList.forEach((className: string) => {
      if (className.indexOf(match) > -1) {
        found = className;
      }
    });

    return found;
  }
}

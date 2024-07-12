export const replaceString = (
  original: string,
  find: string | string[],
  replace: string
) => {
  if (!Array.isArray(find)) {
    find = [find];
  }

  find.forEach((findItem) => {
    original = original.split(findItem).join(replace);
  });

  return original;
};

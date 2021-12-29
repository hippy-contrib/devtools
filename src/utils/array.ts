export function add(arr: string[], id: string) {
  const hadInclude = arr.includes(id);
  if (!hadInclude) arr.push(id);
}

export function remove(arr: string[], id: string) {
  const index = arr.findIndex((v) => v === id);
  if (index > -1) arr.splice(index, 1);
}

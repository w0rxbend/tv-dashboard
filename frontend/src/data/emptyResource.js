export const EMPTY_RESOURCE = {
  error: undefined,
  latest: undefined,
  loading: false,
};

export function optionalResource(resource) {
  return resource ?? EMPTY_RESOURCE;
}

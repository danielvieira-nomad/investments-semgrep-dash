export function toRepoSlug(repositoryName) {
  return encodeURIComponent(repositoryName)
}

export function fromRepoSlug(slug) {
  return decodeURIComponent(slug)
}

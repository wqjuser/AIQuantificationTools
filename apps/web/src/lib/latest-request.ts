export interface LatestRequestCoordinator {
  begin(): number;
  isCurrent(token: number): boolean;
}

export function createLatestRequestCoordinator(): LatestRequestCoordinator {
  let generation = 0;
  return {
    begin() {
      generation += 1;
      return generation;
    },
    isCurrent(token) {
      return token === generation;
    }
  };
}

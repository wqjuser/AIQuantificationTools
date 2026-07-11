import { describe, expect, test } from "vitest";
import { createLatestRequestCoordinator } from "./latest-request";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, reject, resolve };
}

describe("latest request coordinator", () => {
  test("an older success cannot commit after a newer request begins", async () => {
    const coordinator = createLatestRequestCoordinator();
    const olderResult = deferred<string>();
    const commits: string[] = [];
    const olderToken = coordinator.begin();
    const olderRequest = olderResult.promise.then((value) => {
      if (coordinator.isCurrent(olderToken)) commits.push(value);
    });

    const newerToken = coordinator.begin();
    expect(coordinator.isCurrent(newerToken)).toBe(true);
    olderResult.resolve("older");
    await olderRequest;

    expect(commits).toEqual([]);
  });

  test("an older rejection cannot commit failure after a newer request begins", async () => {
    const coordinator = createLatestRequestCoordinator();
    const olderResult = deferred<string>();
    const failures: string[] = [];
    const olderToken = coordinator.begin();
    const olderRequest = olderResult.promise.catch((error: Error) => {
      if (coordinator.isCurrent(olderToken)) failures.push(error.message);
    });

    coordinator.begin();
    olderResult.reject(new Error("older failed"));
    await olderRequest;

    expect(failures).toEqual([]);
  });
});

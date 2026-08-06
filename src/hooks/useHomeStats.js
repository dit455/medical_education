import { useEffect, useState } from "react";

import { getInstitutions, getListCourses, getListSubjects, getRegions } from "../api.js";

// Maps the `source` key declared on each tile in `src/content/homeContent.js`
// to the live API call that produces its number. Nothing on the homepage
// invents a figure: a source that is missing here, or an endpoint that fails,
// leaves the tile in its "to be updated" state instead.
const LOADERS = {
  institutions: () => getInstitutions(),
  courses: () => getListCourses(),
  subjects: () => getListSubjects(),
  regions: () => getRegions(),
};

/**
 * Fetches every counter the homepage asks for in one pass.
 *
 * @param {Array<{ id: string, source?: string }>} tiles stat definitions
 * @returns {{ counts: Record<string, number>, status: "loading"|"ready"|"error" }}
 */
export function useHomeStats(tiles) {
  const [counts, setCounts] = useState({});
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let cancelled = false;
    const sources = [...new Set(tiles.map((tile) => tile.source).filter((key) => key in LOADERS))];

    if (sources.length === 0) {
      setStatus("ready");
      return undefined;
    }

    Promise.allSettled(sources.map((key) => LOADERS[key]())).then((results) => {
      if (cancelled) return;
      const next = {};
      let failures = 0;
      results.forEach((result, index) => {
        if (result.status === "fulfilled" && Array.isArray(result.value)) {
          next[sources[index]] = result.value.length;
        } else {
          failures += 1;
        }
      });
      setCounts(next);
      setStatus(failures === results.length ? "error" : "ready");
    });

    return () => {
      cancelled = true;
    };
  }, [tiles]);

  return { counts, status };
}

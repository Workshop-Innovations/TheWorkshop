# Historical performance baseline

The first optimization pass compared clean commit `6c5f911` with route/data-loading changes under local production previews. Chrome used 4x CPU slowdown, 80 ms latency, 200,000 bytes/sec download, fresh contexts and disabled cache; external requests/fonts were blocked. Each figure is the median of three runs using synthetic SQLite data.

| Content readiness | Original | First optimization pass |
| --- | ---: | ---: |
| Landing | 3.36 s | 1.46 s |
| Dashboard | 3.46 s | 1.82 s |
| Profile | 3.67 s | 1.69 s |
| Dashboard application GETs | 10 | 2 |
| Entry JavaScript | 1.46 MB | 406 KB |

Readiness meant the first page heading, or profile email—not TTI or completion of every request. These are lab observations, not field Core Web Vitals or Nigerian hosting measurements. The first lazy profile navigation was slower by about 257 ms; return/repeat navigation improved. The aggregate focus response was 59 bytes rather than an 18,401-byte history payload in a separate 100-session fixture comparison; database statement count remained two including authentication.

The subsequent interface/schema/folder cleanup changed the application again. **These timings are historical, not measurements of the final cleaned interface.** The cleaned frontend production entry is approximately 402 KB; real loading times should be remeasured on the testing deployment.

Benchmark-only tooling and raw output were removed from the push contents and archived locally outside Git at the user's request. Regression tests remain; they verify behavior rather than inventing new performance claims.

Next measurements: hosted cold/warm API p50/p95, PostgreSQL connection/query timing, field LCP/INP/CLS and navigation from Nigerian mobile networks, with region and cache state recorded.

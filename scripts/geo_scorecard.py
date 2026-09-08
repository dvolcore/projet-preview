#!/usr/bin/env python3
"""Pro Jet GEO/SEO scorecard (GEO-MIN lane).

Computes the weighted eight-subscore scorecard defined by config/geo-rubric.json.
Subscores are 0-100 with coverage 0-1. Sources that could not be observed are
reported as unavailable: they contribute nothing to the weighted score, their
weight is reported as an explicit unknown contribution, and any renormalized
score is labeled. No silent zeros, no silent renormalization.

Usage:
  python3 scripts/geo_scorecard.py --rubric config/geo-rubric.json \
      --observations observations.json --out scorecard.json

Observations file shape (keys = rubric subscore keys):
  {
    "technical_seo": {"score": 90, "coverage": 1.0, "status": "measured",
                      "evidence": ["..."], "note": "..."},
    "observed_answer_visibility": {"status": "unavailable", "coverage": 0.0,
                      "note": "no authorized live answer-engine observation"}
  }
"""

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

VALID_STATUSES = ("measured", "provisional", "unavailable")


def load_json(path):
    with open(path, "r", encoding="utf-8") as handle:
        return json.load(handle)


def load_rubric(path):
    rubric = load_json(path)
    if rubric.get("schema_version") != 1:
        raise ValueError("rubric schema_version must be 1")
    subscores = rubric.get("subscores")
    if not isinstance(subscores, list) or not subscores:
        raise ValueError("rubric must define a non-empty subscores list")
    total = 0
    for entry in subscores:
        weight = entry.get("weight")
        if not isinstance(weight, (int, float)) or isinstance(weight, bool):
            raise ValueError(f"subscore {entry.get('key')!r} weight must be a number")
        if weight <= 0:
            raise ValueError(f"subscore {entry.get('key')!r} weight must be positive")
        total += weight
    if abs(total - 100) > 1e-9:
        raise ValueError(f"rubric weights must sum to 100, got {total}")
    return rubric


def _validate_score(key, score):
    if not isinstance(score, (int, float)) or isinstance(score, bool):
        raise ValueError(f"{key}: score must be a number")
    if score < 0 or score > 100:
        raise ValueError(f"{key}: score {score} outside 0-100")
    return float(score)


def _validate_coverage(key, coverage):
    if not isinstance(coverage, (int, float)) or isinstance(coverage, bool):
        raise ValueError(f"{key}: coverage must be a number")
    if coverage < 0 or coverage > 1:
        raise ValueError(f"{key}: coverage {coverage} outside 0-1")
    return float(coverage)


def compute_scorecard(observations, rubric, generated_utc=None):
    subscore_entries = []
    known_contribution = 0.0
    known_weight = 0.0
    unknown_weight = 0.0
    unknown_keys = []
    for entry in rubric["subscores"]:
        key = entry["key"]
        weight = float(entry["weight"])
        observed = observations.get(key)
        if observed is None:
            observed = {"status": "unavailable", "coverage": 0.0,
                        "note": "no observation supplied for this subscore"}
        status = observed.get("status")
        if status not in VALID_STATUSES:
            raise ValueError(f"{key}: status {status!r} must be one of {VALID_STATUSES}")
        coverage = _validate_coverage(key, observed.get("coverage", 0.0))
        record = {
            "key": key,
            "weight": weight,
            "status": status,
            "coverage": coverage,
            "evidence": observed.get("evidence", []),
            "note": observed.get("note", ""),
        }
        if status in ("measured", "provisional"):
            score = _validate_score(key, observed.get("score"))
            record["score"] = score
            record["contribution"] = score * weight / 100.0
            known_contribution += record["contribution"]
            known_weight += weight
        else:
            score = observed.get("score")
            if score is not None:
                raise ValueError(f"{key}: unavailable subscore must not carry a score")
            record["score"] = None
            record["contribution"] = 0.0
            record["unknown_contribution"] = weight
            unknown_weight += weight
            unknown_keys.append(key)
        subscore_entries.append(record)

    renormalized = None
    if known_weight > 0:
        renormalized = known_contribution / known_weight * 100.0

    return {
        "schema_version": 1,
        "rubric_id": rubric.get("rubric_id"),
        "rubric_version": rubric.get("rubric_version"),
        "generated_utc": generated_utc or datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "weights_sum": sum(float(e["weight"]) for e in rubric["subscores"]),
        "coverage": known_weight / 100.0,
        "known_weight": known_weight,
        "unknown_weight": unknown_weight,
        "unknown_keys": unknown_keys,
        "weighted_known_score": round(known_contribution, 4),
        "renormalized_score": round(renormalized, 4) if renormalized is not None else None,
        "renormalization_label": (
            "renormalized over measured weight only; not comparable to a full-coverage score"
            if renormalized is not None and unknown_weight > 0
            else "full coverage; no renormalization applied"
        ),
        "subscores": subscore_entries,
    }


def main(argv=None):
    parser = argparse.ArgumentParser(description="Compute the Pro Jet GEO/SEO scorecard.")
    parser.add_argument("--rubric", required=True, help="path to geo-rubric.json")
    parser.add_argument("--observations", required=True, help="path to observations JSON")
    parser.add_argument("--out", help="write scorecard JSON here (default: stdout)")
    args = parser.parse_args(argv)

    try:
        rubric = load_rubric(args.rubric)
        observations = load_json(args.observations)
        scorecard = compute_scorecard(observations, rubric)
    except (ValueError, OSError, json.JSONDecodeError) as error:
        print(f"geo_scorecard: {error}", file=sys.stderr)
        return 2

    payload = json.dumps(scorecard, indent=2, ensure_ascii=False)
    if args.out:
        Path(args.out).write_text(payload + "\n", encoding="utf-8")
    else:
        print(payload)
    return 0


if __name__ == "__main__":
    sys.exit(main())

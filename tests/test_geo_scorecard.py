"""Unit tests for the GEO/SEO scorecard (GEO-MIN lane)."""

import json
import math
import sys
import unittest
from pathlib import Path

WEBSITE_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(WEBSITE_ROOT / "scripts"))

from geo_scorecard import compute_scorecard, load_rubric  # noqa: E402

RUBRIC_PATH = WEBSITE_ROOT / "config" / "geo-rubric.json"


class RubricTests(unittest.TestCase):
    def test_shipped_rubric_loads_and_weights_sum_to_100(self):
        rubric = load_rubric(RUBRIC_PATH)
        self.assertEqual(rubric["schema_version"], 1)
        self.assertTrue(rubric.get("rubric_version"))
        self.assertEqual(sum(e["weight"] for e in rubric["subscores"]), 100)

    def test_mandatory_eight_subscores_present_with_plan_weights(self):
        rubric = json.loads(RUBRIC_PATH.read_text())
        weights = {e["key"]: e["weight"] for e in rubric["subscores"]}
        self.assertEqual(weights, {
            "technical_seo": 20,
            "local_seo": 15,
            "structured_data": 10,
            "content_quality": 15,
            "ai_citability": 10,
            "conversion": 10,
            "accessibility_performance": 10,
            "observed_answer_visibility": 10,
        })

    def test_weights_not_summing_to_100_are_rejected(self):
        bad = json.loads(RUBRIC_PATH.read_text())
        bad["subscores"][0]["weight"] += 5
        with self.assertRaises(ValueError):
            load_rubric_data(bad)


def load_rubric_data(data):
    import tempfile
    with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as handle:
        json.dump(data, handle)
        path = handle.name
    try:
        return load_rubric(path)
    finally:
        Path(path).unlink(missing_ok=True)


class BoundaryTests(unittest.TestCase):
    def setUp(self):
        self.rubric = load_rubric(RUBRIC_PATH)

    def _full_observation(self, score):
        return {e["key"]: {"score": score, "coverage": 1.0, "status": "measured"}
                for e in self.rubric["subscores"]}

    def test_zero_and_one_hundred_are_valid_boundaries(self):
        for score in (0, 100):
            card = compute_scorecard(self._full_observation(score), self.rubric)
            self.assertEqual(card["coverage"], 1.0)
            self.assertEqual(card["unknown_weight"], 0)
            self.assertAlmostEqual(card["weighted_known_score"], float(score), places=4)
            self.assertAlmostEqual(card["renormalized_score"], float(score), places=4)

    def test_out_of_range_scores_are_rejected(self):
        for score in (-1, 100.01, "90", None):
            with self.assertRaises(ValueError):
                compute_scorecard(self._full_observation(score), self.rubric)

    def test_out_of_range_coverage_is_rejected(self):
        observations = self._full_observation(50)
        observations["technical_seo"]["coverage"] = 1.5
        with self.assertRaises(ValueError):
            compute_scorecard(observations, self.rubric)

    def test_unknown_status_is_rejected(self):
        observations = self._full_observation(50)
        observations["technical_seo"]["status"] = "guess"
        with self.assertRaises(ValueError):
            compute_scorecard(observations, self.rubric)

    def test_unavailable_subscore_must_not_carry_a_score(self):
        observations = self._full_observation(50)
        observations["technical_seo"] = {"status": "unavailable", "coverage": 0.0, "score": 40}
        with self.assertRaises(ValueError):
            compute_scorecard(observations, self.rubric)


class CalculationTests(unittest.TestCase):
    def setUp(self):
        self.rubric = load_rubric(RUBRIC_PATH)

    def test_weighted_calculation_is_exact(self):
        observations = {e["key"]: {"score": 0, "coverage": 1.0, "status": "measured"}
                        for e in self.rubric["subscores"]}
        observations["technical_seo"]["score"] = 80      # 20% -> 16
        observations["conversion"]["score"] = 100        # 10% -> 10
        card = compute_scorecard(observations, self.rubric)
        self.assertAlmostEqual(card["weighted_known_score"], 26.0, places=4)
        self.assertAlmostEqual(card["coverage"], 1.0)

    def test_missing_data_is_labeled_not_silently_zero(self):
        observations = {e["key"]: {"score": 50, "coverage": 1.0, "status": "measured"}
                        for e in self.rubric["subscores"]}
        del observations["observed_answer_visibility"]
        card = compute_scorecard(observations, self.rubric)
        missing = next(s for s in card["subscores"] if s["key"] == "observed_answer_visibility")
        self.assertEqual(missing["status"], "unavailable")
        self.assertEqual(missing["unknown_contribution"], 10)
        self.assertEqual(card["unknown_weight"], 10)
        self.assertEqual(card["unknown_keys"], ["observed_answer_visibility"])
        self.assertAlmostEqual(card["coverage"], 0.9)
        self.assertAlmostEqual(card["weighted_known_score"], 45.0, places=4)

    def test_renormalization_is_explicitly_labeled(self):
        observations = {e["key"]: {"score": 50, "coverage": 1.0, "status": "measured"}
                        for e in self.rubric["subscores"]}
        observations["observed_answer_visibility"] = {"status": "unavailable", "coverage": 0.0}
        card = compute_scorecard(observations, self.rubric)
        self.assertAlmostEqual(card["renormalized_score"], 50.0, places=4)
        self.assertIn("renormalized", card["renormalization_label"])
        self.assertIn("not comparable", card["renormalization_label"])

    def test_fully_unavailable_observations_report_unknown_contribution(self):
        observations = {e["key"]: {"status": "unavailable", "coverage": 0.0}
                        for e in self.rubric["subscores"]}
        card = compute_scorecard(observations, self.rubric)
        self.assertEqual(card["known_weight"], 0)
        self.assertEqual(card["unknown_weight"], 100)
        self.assertAlmostEqual(card["coverage"], 0.0)
        self.assertEqual(card["weighted_known_score"], 0.0)
        self.assertIsNone(card["renormalized_score"])

    def test_provisional_status_counts_toward_known_score(self):
        observations = {e["key"]: {"score": 60, "coverage": 0.5, "status": "provisional"}
                        for e in self.rubric["subscores"]}
        card = compute_scorecard(observations, self.rubric)
        self.assertAlmostEqual(card["weighted_known_score"], 60.0, places=4)
        self.assertAlmostEqual(card["coverage"], 1.0)


class CliTests(unittest.TestCase):
    def test_cli_refuses_bad_observations(self):
        import subprocess
        import tempfile
        rubric = str(RUBRIC_PATH)
        with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as handle:
            json.dump({"technical_seo": {"score": 200, "coverage": 1.0, "status": "measured"}}, handle)
            observations = handle.name
        result = subprocess.run(
            [sys.executable, str(WEBSITE_ROOT / "scripts" / "geo_scorecard.py"),
             "--rubric", rubric, "--observations", observations],
            capture_output=True, text=True)
        Path(observations).unlink(missing_ok=True)
        self.assertEqual(result.returncode, 2)
        self.assertIn("outside 0-100", result.stderr)


if __name__ == "__main__":
    unittest.main()

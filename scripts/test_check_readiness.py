import copy
import datetime as dt
import json
from pathlib import Path
import tempfile
import unittest
from check_readiness import BUSINESS, REPO, evaluate


class ReadinessTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.base = Path(self.temp.name)
        (self.base / 'receipt.txt').write_text('Controlled test receipt fixture; not real connection evidence.')
        self.now = dt.datetime(2026, 9, 5, tzinfo=dt.timezone.utc)
        self.config = {'schema_version': 1, 'environment': 'production', 'gates': {
            key: {'status': 'evidence-recorded', 'owner': 'operator-id', 'environment': 'production',
                  'outcome': 'passed', 'timestamp': '2026-09-04T23:00:00Z', 'evidence_ref': 'receipt.txt'} for key in BUSINESS}}

    def run_check(self, scope='business'):
        return evaluate(self.config, self.base, scope, self.now)

    def test_plausible_records_are_not_independent_proof(self):
        report, code = self.run_check()
        self.assertEqual(code, 0)
        self.assertFalse(report['independently_verified'])
        self.assertEqual(report['status'], 'evidence-recorded')

    def test_default_is_blocked(self):
        self.config = json.loads((REPO / 'config/operations.example.json').read_text())
        self.assertEqual(self.run_check()[1], 1)

    def test_each_requirement_blocks_business(self):
        for key in BUSINESS:
            with self.subTest(key=key):
                gate = self.config['gates'].pop(key)
                self.assertEqual(self.run_check()[1], 1)
                self.config['gates'][key] = gate

    def test_release_not_business(self):
        del self.config['gates']['payments']
        self.assertEqual(self.run_check('release')[1], 0)
        self.assertEqual(self.run_check()[1], 1)

    def test_invalid_and_blocked_cases(self):
        original = copy.deepcopy(self.config)
        for field, value, expected in [('status', 'verified', 2), ('owner', '', 1), ('outcome', 'failed', 1),
                                      ('timestamp', 'tomorrow', 2), ('timestamp', '2026-09-06T00:00:00Z', 1),
                                      ('timestamp', '2026-01-01T00:00:00Z', 1), ('evidence_ref', 'absent', 1),
                                      ('environment', 'sandbox', 1), ('evidence_ref', 'https://example.com', 2),
                                      ('evidence_ref', str(REPO / 'README.md'), 1)]:
            with self.subTest(field=field, value=value):
                self.config = copy.deepcopy(original)
                self.config['gates']['intake'][field] = value
                self.assertEqual(self.run_check()[1], expected)

    def test_no_sensitive_values_echoed(self):
        self.config['api_key'] = 'private-value'
        report, code = self.run_check()
        self.assertEqual(code, 2)
        self.assertNotIn('private-value', json.dumps(report))

    def test_sandbox_never_passes_production(self):
        self.config['environment'] = 'sandbox'
        for gate in self.config['gates'].values():
            gate['environment'] = 'sandbox'
        self.assertEqual(self.run_check()[1], 1)

    def test_nested_shapes_and_unknown_identifiers_do_not_leak(self):
        self.config['gates']['private-value'] = {'status': 'invalid'}
        self.config['environment'] = ['private-value']
        self.config['gates']['intake']['status'] = []
        report, code = self.run_check()
        self.assertEqual(code, 2)
        self.assertNotIn('private-value', json.dumps(report))

    def test_cli_exit_codes(self):
        import subprocess
        import sys
        path = self.base / 'config.json'
        for config, expected in [(self.config, 0), ({'schema_version': 1, 'environment': 'local', 'gates': {}}, 1), ({'ready': True}, 2)]:
            path.write_text(json.dumps(config))
            # Use real current time for this CLI integration fixture.
            for gate in config.get('gates', {}).values():
                gate['timestamp'] = dt.datetime.now(dt.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
            path.write_text(json.dumps(config))
            result = subprocess.run([sys.executable, str(REPO / 'scripts/check_readiness.py'), '--config', str(path), '--scope', 'business', '--format', 'json'], capture_output=True, text=True)
            self.assertEqual(result.returncode, expected)
            self.assertIn('status', json.loads(result.stdout))

    def test_wrong_types_invalid(self):
        self.config['gates']['intake']['owner'] = True
        self.assertEqual(self.run_check()[1], 2)


if __name__ == '__main__':
    unittest.main()

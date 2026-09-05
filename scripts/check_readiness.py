#!/usr/bin/env python3
"""Offline evidence completeness checks, never external connection verification."""
import argparse
import datetime as dt
import json
from pathlib import Path
import sys

RELEASE = ('facts', 'domain', 'seo', 'migration', 'crm', 'intake', 'response_owner', 'privacy', 'rollback')
BUSINESS = RELEASE + ('telephony', 'dispatch', 'estimates', 'payments', 'reports', 'continuity', 'analytics', 'ai', 'follow_up', 'end_to_end')
MAX_AGE_DAYS = 30
STATES = {'unknown', 'blocked', 'evidence-recorded'}
ENVIRONMENTS = {'local', 'sandbox', 'production'}
REPO = Path(__file__).resolve().parents[1]


def utc_timestamp(value):
    if not isinstance(value, str) or not value.endswith('Z'):
        raise ValueError('timestamp must be an ISO-8601 UTC string ending Z')
    result = dt.datetime.fromisoformat(value[:-1] + '+00:00')
    return result


def contained(path, parent):
    return path == parent or parent in path.parents


def evaluate(config, base, scope='release', now=None):
    """Return a sanitized report. Evidence files are tested for existence, not read."""
    now = now or dt.datetime.now(dt.timezone.utc)
    errors = []
    checks = []
    allowed = {'schema_version', 'environment', 'gates'}
    if not isinstance(config, dict) or set(config) - allowed:
        return {'status': 'invalid', 'errors': ['Unexpected configuration shape/fields; never include credentials or customer data.']}, 2
    if type(config.get('schema_version')) is not int or config['schema_version'] != 1:
        errors.append('schema_version must be 1')
    environment = config.get('environment')
    if not isinstance(environment, str) or environment not in ENVIRONMENTS:
        errors.append('environment must be local, sandbox or production')
    gates = config.get('gates')
    if not isinstance(gates, dict):
        gates = {}
        errors.append('gates must be an object')
    if set(gates) - set(BUSINESS):
        errors.append('Unknown gate IDs')
    valid = {}
    for key, gate in gates.items():
        if key not in BUSINESS:
            continue
        problems = []
        if not isinstance(gate, dict):
            errors.append(f'{key}: gate must be an object')
            continue
        if set(gate) - {'status', 'owner', 'environment', 'outcome', 'timestamp', 'evidence_ref'}:
            errors.append(f'{key}: unexpected fields; use the documented schema')
        state = gate.get('status')
        if not isinstance(state, str) or state not in STATES:
            errors.append(f'{key}: invalid status')
        if not isinstance(gate.get('environment'), str) or gate['environment'] not in ENVIRONMENTS:
            errors.append(f'{key}: invalid environment')
        for field in ('owner', 'outcome', 'timestamp', 'evidence_ref'):
            if not isinstance(gate.get(field), str):
                errors.append(f'{key}: {field} must be a string')
        if state == 'evidence-recorded':
            if not isinstance(gate.get('owner'), str) or not gate['owner'].strip():
                problems.append('Assign an accountable owner identifier')
            if gate.get('outcome') != 'passed':
                problems.append('A passing outcome is required')
            if gate.get('environment') != environment:
                problems.append('Evidence environment differs from selected environment')
            try:
                timestamp = utc_timestamp(gate.get('timestamp'))
                age = (now - timestamp).total_seconds()
                if age < 0:
                    problems.append('Evidence timestamp is in the future')
                elif age > MAX_AGE_DAYS * 86400:
                    problems.append('Evidence is older than 30 days; revalidate')
            except (ValueError, TypeError):
                errors.append(f'{key}: invalid UTC timestamp')
            reference = gate.get('evidence_ref')
            if isinstance(reference, str) and reference.strip():
                if '://' in reference:
                    errors.append(f'{key}: use a private local evidence file, not a URL')
                else:
                    path = (base / reference).resolve()
                    if contained(path, REPO):
                        problems.append('Evidence must live outside the public repository')
                    elif not path.is_file():
                        problems.append('Evidence reference does not resolve to a file')
                    elif path.stat().st_size == 0:
                        problems.append('Evidence file is empty')
            else:
                problems.append('Missing private evidence reference')
        else:
            problems.append('Evidence not recorded')
        valid[key] = problems
    for key in RELEASE if scope == 'release' else BUSINESS:
        problems = valid.get(key, ['Missing required gate'])
        checks.append({'id': key, 'status': 'blocked' if problems else 'evidence-recorded', 'issues': problems})
    if environment != 'production':
        checks.append({'id': 'production_environment', 'status': 'blocked', 'issues': ['Local/sandbox records do not establish production readiness']})
    blocked = any(check['status'] == 'blocked' for check in checks)
    report = {
        'schema_version': 1, 'scope': scope, 'environment': environment if isinstance(environment, str) and environment in ENVIRONMENTS else 'invalid',
        'status': 'invalid' if errors else ('blocked' if blocked else 'evidence-recorded'),
        'evidence_requirements_satisfied': not errors and not blocked,
        'independently_verified': False,
        'provenance': 'Self-reported records; offline reference/metadata validation only. No evidence authenticity, connection, performance or external outcome is verified.',
        'checks': checks, 'errors': errors,
    }
    return report, 2 if errors else (1 if blocked else 0)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--config', type=Path, required=True)
    parser.add_argument('--scope', choices=('release', 'business'), required=True)
    parser.add_argument('--format', choices=('json',), default='json')
    args = parser.parse_args()
    try:
        config = json.loads(args.config.read_text())
        report, status = evaluate(config, args.config.resolve().parent, args.scope)
    except (OSError, ValueError, TypeError):
        report, status = {'status': 'invalid', 'errors': ['Cannot load or validate configuration; use a readable JSON file matching the example schema.']}, 2
    print(json.dumps(report, indent=2, sort_keys=True))
    return status


if __name__ == '__main__':
    sys.exit(main())

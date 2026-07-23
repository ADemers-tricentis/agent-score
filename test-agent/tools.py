import random
import uuid
from datetime import datetime, timezone

TOOL_DEFINITIONS = [
    {
        "name": "run_test_suite",
        "description": "Execute a test suite against a target environment. Returns a run ID and initial status.",
        "input_schema": {
            "type": "object",
            "properties": {
                "suite_name": {
                    "type": "string",
                    "description": "Name of the test suite (e.g. 'smoke', 'regression', 'payment-workflow')",
                },
                "environment": {
                    "type": "string",
                    "enum": ["dev", "staging", "prod"],
                    "description": "Target environment",
                },
                "test_filter": {
                    "type": "string",
                    "description": "Optional glob pattern to filter specific tests (e.g. 'auth/*', 'payment_*')",
                },
            },
            "required": ["suite_name", "environment"],
        },
    },
    {
        "name": "get_test_results",
        "description": "Retrieve detailed results for a completed or in-progress test run.",
        "input_schema": {
            "type": "object",
            "properties": {
                "run_id": {
                    "type": "string",
                    "description": "The run ID returned by run_test_suite",
                },
                "include_logs": {
                    "type": "boolean",
                    "description": "Whether to include execution logs for failed tests",
                },
            },
            "required": ["run_id"],
        },
    },
    {
        "name": "generate_test_case",
        "description": "Generate a new test case definition for a given feature and scenario type.",
        "input_schema": {
            "type": "object",
            "properties": {
                "feature": {
                    "type": "string",
                    "description": "Feature area to test (e.g. 'user-authentication', 'payment-processing')",
                },
                "scenario_type": {
                    "type": "string",
                    "enum": ["happy_path", "edge_case", "negative", "performance"],
                    "description": "Type of scenario to generate",
                },
                "requirements": {
                    "type": "string",
                    "description": "Optional additional requirements or constraints",
                },
            },
            "required": ["feature", "scenario_type"],
        },
    },
]

_FAILURE_NAMES = [
    "test_checkout_with_invalid_card",
    "test_login_rate_limit_exceeded",
    "test_export_large_dataset_timeout",
    "test_concurrent_session_limit",
    "test_zero_balance_transfer",
    "test_session_token_expiry",
]

_FAILURE_ERRORS = [
    "AssertionError: Expected 200, got 503",
    "TimeoutError: Response exceeded 5000ms threshold",
    "AssertionError: Expected field 'orderId' in response body",
    "AssertionError: Expected redirect to /login, got 200",
    "ConnectionError: staging-db-02 unreachable after 3 retries",
]


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _run_test_suite(suite_name: str, environment: str, test_filter: str = None) -> dict:
    total = random.randint(18, 72)
    return {
        "run_id": f"run-{uuid.uuid4().hex[:8]}",
        "suite": suite_name,
        "environment": environment,
        "filter": test_filter,
        "status": "running",
        "total_tests": total,
        "started_at": _now(),
        "estimated_duration_sec": random.randint(30, 180),
    }


def _get_test_results(run_id: str, include_logs: bool = False) -> dict:
    total = random.randint(18, 72)
    failed = random.randint(0, max(1, total // 10))
    skipped = random.randint(0, 3)
    passed = total - failed - skipped

    failures = []
    for _ in range(min(failed, 4)):
        failures.append({
            "test_id": f"tc-{uuid.uuid4().hex[:6]}",
            "name": random.choice(_FAILURE_NAMES),
            "error": random.choice(_FAILURE_ERRORS),
            "duration_ms": random.randint(500, 8000),
            "logs": (
                ["Connecting to staging...", "POST /api/checkout -> 503", "Retry 1/3 failed"]
                if include_logs
                else []
            ),
        })

    return {
        "run_id": run_id,
        "status": "completed",
        "summary": {
            "total": total,
            "passed": passed,
            "failed": failed,
            "skipped": skipped,
            "pass_rate": round(passed / total, 3),
            "duration_sec": random.randint(30, 180),
        },
        "failures": failures,
        "completed_at": _now(),
    }


def _generate_test_case(feature: str, scenario_type: str, requirements: str = None) -> dict:
    return {
        "test_id": f"tc-{uuid.uuid4().hex[:8]}",
        "feature": feature,
        "scenario_type": scenario_type,
        "title": f"{scenario_type.replace('_', ' ').title()} - {feature}",
        "steps": [
            f"Given the {feature} system is available",
            f"When the user triggers the {scenario_type.replace('_', ' ')} scenario",
            "Then the system should respond within 2000ms",
            "And the response schema should match the contract",
        ],
        "expected_status": 200 if scenario_type == "happy_path" else 400,
        "tags": [feature, scenario_type, "auto-generated"],
        "requirements": requirements,
        "generated_at": _now(),
    }


def execute_tool(name: str, inputs: dict) -> dict:
    if name == "run_test_suite":
        return _run_test_suite(**inputs)
    elif name == "get_test_results":
        return _get_test_results(**inputs)
    elif name == "generate_test_case":
        return _generate_test_case(**inputs)
    return {"error": f"Unknown tool: {name}"}

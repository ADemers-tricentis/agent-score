"""
Test scenarios for the agent. Each scenario maps to a realistic ATA task
that exercises different tool combinations and reasoning patterns.
"""

SCENARIOS = [
    {
        "scenario": "Full regression - payment workflow",
        "task": (
            "Run the full 'payment-workflow' regression suite on staging. "
            "Once you have the results, summarize what passed and what failed, "
            "and give a clear go / no-go recommendation for the release."
        ),
    },
    {
        "scenario": "Edge case - zero-balance account",
        "task": (
            "Run the 'user-authentication' suite on staging filtered to 'zero_balance_*'. "
            "Fetch detailed results including failure logs. "
            "If there are any failures, generate an additional edge_case test case "
            "targeting the gap you identify."
        ),
    },
    {
        "scenario": "Generate test coverage for data export",
        "task": (
            "Generate three test cases for the 'data-export' feature: "
            "one happy_path, one edge_case, and one negative scenario. "
            "Then run the existing 'data-export' smoke suite on dev "
            "and check whether the results suggest any coverage gaps."
        ),
    },
    {
        "scenario": "Multi-suite comparison - auth regression",
        "task": (
            "Run both the 'smoke' and 'regression' suites for user-authentication on staging. "
            "Get results for both runs. Compare pass rates and identify which suite "
            "caught failures the other missed. Recommend which suite should gate the CI pipeline."
        ),
    },
    {
        "scenario": "Performance baseline - checkout flow",
        "task": (
            "Generate a performance test case for the checkout-flow feature. "
            "Then run the 'checkout-flow' suite on staging. "
            "Based on the results and the generated test case, "
            "assess whether performance is within acceptable bounds."
        ),
    },
]

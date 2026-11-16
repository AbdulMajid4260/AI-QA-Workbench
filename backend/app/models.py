from typing import Literal
from pydantic import BaseModel, Field, ConfigDict


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class ModelConfig(StrictModel):
    provider: Literal["ollama", "groq"] = "ollama"
    model: str = Field(default="qwen2.5:3b", min_length=1, max_length=100)
    temperature: float = Field(default=0, ge=0, le=1)
    max_tokens: int = Field(default=3500, ge=500, le=8000)


class Requirement(StrictModel):
    title: str = Field(min_length=3)
    statement: str = Field(min_length=10)
    source_quote: str = Field(min_length=8)
    acceptance_criteria: list[str] = Field(min_length=1)
    risks: list[str] = []


class Scenario(StrictModel):
    title: str
    category: Literal["Positive", "Negative", "Boundary", "Edge"]
    rationale: str


class Analysis(StrictModel):
    summary: str
    requirements: list[Requirement] = Field(min_length=1, max_length=12)
    ambiguities: list[str]
    missing_information: list[str]
    scenarios: list[Scenario]
    suggested_additions: list[str]


class Step(StrictModel):
    action: str = Field(min_length=3)
    expected: str = Field(min_length=3)


class TestCase(StrictModel):
    owner: str = "Unassigned"
    environment: str = "Not specified"
    build_version: str = "Not provided"
    requirement_ids: list[str] = Field(min_length=1)
    title: str = Field(min_length=5)
    module: str = Field(min_length=2)
    scenario: str = Field(min_length=5)
    category: Literal["Positive", "Negative", "Boundary", "Edge"]
    test_type: Literal["Functional", "Regression", "Smoke", "Security", "Usability"]
    priority: Literal["High", "Medium", "Low"]
    severity: Literal["Critical", "Major", "Minor", "Trivial"]
    preconditions: list[str] = Field(min_length=1)
    steps: list[Step] = Field(min_length=1, max_length=15)
    test_data: dict[str, str]
    expected_result: str = Field(min_length=5)
    postconditions: list[str]
    automation_key: Literal[
        "login_valid", "login_invalid", "cart_add", "checkout", "logout", "manual"
    ]
    source_quote: str = Field(min_length=8)
    assumptions: list[str]
    tags: list[str]


class CaseBatch(StrictModel):
    test_cases: list[TestCase] = Field(min_length=1, max_length=8)


class Defect(StrictModel):
    title: str = Field(min_length=5)
    description: str
    steps_to_reproduce: list[str]
    expected_result: str
    actual_result: str
    severity: Literal["Critical", "Major", "Minor", "Trivial"]
    priority: Literal["High", "Medium", "Low"]
    classification: Literal[
        "Product defect hypothesis",
        "Test defect hypothesis",
        "Environment issue hypothesis",
        "Injected demonstration failure",
    ]
    possible_root_cause: str
    evidence_reasoning: str
    regression_scenarios: list[str]
    uncertainties: list[str]


class Answer(StrictModel):
    answer: str
    citations: list[str]
    insufficient_evidence: bool
    caveats: list[str]


class Documentation(StrictModel):
    overview: str
    scope: list[str]
    test_strategy: list[str]
    coverage_findings: list[str]
    execution_summary: str
    risks_and_recommendations: list[str]


class ScriptDraft(StrictModel):
    explanation: str
    python_code: str
    review_checklist: list[str]


class AnalyzeRequest(StrictModel):
    text: str = Field(min_length=20, max_length=24000)
    title: str = Field(default="SauceDemo requirements", min_length=3, max_length=120)
    config: ModelConfig


class GenerateRequest(StrictModel):
    analysis_id: str
    count: int = Field(default=4, ge=1, le=8)
    config: ModelConfig


class ReviewRequest(StrictModel):
    case: TestCase
    approve: bool = False
    reviewer: str = Field(default="Abdul", min_length=2, max_length=80)
    review_note: str = Field(default="", max_length=2000)


class RunRequest(StrictModel):
    suite: Literal["smoke", "data_driven", "approved", "failure_demo"]
    case_ids: list[str] = []
    dataset_id: str | None = None
    headless: bool = True


class AskRequest(StrictModel):
    document_id: str
    question: str = Field(min_length=5, max_length=3000)
    top_k: int = Field(default=4, ge=1, le=8)
    config: ModelConfig


class DocumentCasesRequest(StrictModel):
    document_id: str
    focus: str = Field(min_length=5, max_length=2000)
    count: int = Field(default=4, ge=1, le=8)
    config: ModelConfig


class FailureRequest(StrictModel):
    run_id: str
    result_id: str
    config: ModelConfig


class DefectReview(StrictModel):
    defect: Defect
    reviewer: str = Field(min_length=2, max_length=80)
    approve: bool = True


class PublishRequest(StrictModel):
    confirm: Literal[True]


class LoginRow(StrictModel):
    case_id: str = Field(min_length=1, max_length=80)
    username: str = Field(max_length=100)
    password: str = Field(max_length=100)
    expected: Literal["success", "failure"]
    expected_error: str = Field(default="", max_length=200)

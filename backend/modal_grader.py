import modal
import json

app = modal.App("theworkshop-ai-grader")

image = modal.Image.debian_slim().pip_install("litellm", "fastapi[standard]")


@app.function(image=image, secrets=[modal.Secret.from_name("gemini-api-key")])
@modal.fastapi_endpoint(method="POST")
def grade_paper_endpoint(data: dict):
    """
    Receives user answers and a rubric (marking scheme), grades them using
    Gemini via LiteLLM, and returns a structured score + feedback object.

    Expected input:
        {
            "user_answers": {"1": "B", "2": "Essay text...", "3": "4 m/s²"},
            "rubric":        "1. B\n2. Discuss X, Y, Z...\n3. Answer: 4 m/s²"
        }

    Returns:
        {
            "total_score": 7.5,
            "feedback": {"1": "Correct.", "2": "Good mention of X but missed Y."}
        }
    """
    from litellm import completion

    user_answers: dict = data.get("user_answers", {})
    rubric: str = data.get("rubric", "")

    if not user_answers:
        return {"total_score": 0.0, "feedback": {"overall": "No answers were provided."}}

    prompt = f"""You are a strict but fair exam marker for West African secondary school examinations.

MARKING SCHEME / ANSWER BANK:
{rubric}

STUDENT ANSWERS (JSON — key is question number, value is their response):
{json.dumps(user_answers, indent=2)}

INSTRUCTIONS:
1. For each answered question, compare the student's response to the marking scheme.
2. For MCQ (single letter answers like "A", "B"): award full marks if correct, zero if wrong. Be case-insensitive.
3. For [CALC] questions: the student only submitted their final answer. Award full marks if it is mathematically equivalent to the expected answer (e.g. "4 m/s²" and "4ms⁻²" are the same). Partial credit is not expected.
4. For [STRUCTURED] questions: award marks based on key points in the rubric.
5. For [ESSAY] questions: if a rubric exists, use it. If not, mark holistically out of 10. Reward depth, clarity, and relevance.
6. For unanswered questions, award 0 and note it briefly.

OUTPUT: Return ONLY a valid JSON object with exactly this shape:
{{
  "total_score": <float — sum of all marks>,
  "feedback": {{
    "<question_number>": "<one or two sentence feedback and mark awarded>"
  }}
}}
"""
    try:
        response = completion(
            model="gemini/gemini-1.5-flash",  # Flash is faster & cheaper for marking
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
        )
        result_text = response.choices[0].message.content
        result = json.loads(result_text)
        # Ensure required keys are present
        result.setdefault("total_score", 0.0)
        result.setdefault("feedback", {})
        return result
    except json.JSONDecodeError as e:
        return {"total_score": 0.0, "feedback": {"error": f"AI returned invalid JSON: {str(e)}"}}
    except Exception as e:
        return {"total_score": 0.0, "feedback": {"error": f"Grading failed: {str(e)}"}}

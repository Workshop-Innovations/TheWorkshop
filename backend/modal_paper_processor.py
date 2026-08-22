import os
import shutil
import subprocess
import json
import modal
from fastapi import Request, Response, HTTPException

# 1. Define the environment and dependencies for MinerU
# MinerU requires OpenCV, some system libraries, and PyTorch ecosystem.
image = (
    modal.Image.debian_slim(python_version="3.10")
    .apt_install("libgl1", "libglib2.0-0", "wget", "poppler-utils")
    .pip_install(
        "magic-pdf[full]==0.6.1", # Ensure compatible version
        "huggingface_hub",
        "opencv-python-headless",
        "google-genai",
        "sqlmodel",
        "psycopg2-binary",
        "fastapi[standard]"
    )
    .run_commands(
        # Download the weights during build so cold starts are faster
        "python -c \"from huggingface_hub import snapshot_download; snapshot_download(repo_id='OpenDataLab/PDF-Extract-Kit-1.0', repo_type='model')\""
    )
)

app = modal.App("theworkshop-paper-processor")

PAST_PAPER_GUIDE = """
# Past Paper Markdown Formatting Guide

> [!IMPORTANT]
> You upload **one** `.md` file per past paper. The system automatically splits it into a **Questions** tab and an **Answer Bank** tab for users, and uses the answer bank to AI-grade student submissions.

---

## Quick Reference

| Tag | Input Type Rendered | Use For |
|---|---|---|
| *(numbered list, A–F options)* | Radio buttons (MCQ) | Multiple choice |
| `[ESSAY]` | Large text area | Essays, long answers |
| `[STRUCTURED]` | Short text input | Short answers, definitions |
| `[CALC]` | Short text input + disclaimer | Maths / Physics calculations |
| `[DIAGRAM:label]` | Placeholder (upload image separately) | Diagrams, maps, graphs |
| `## ANSWERS` or `## ANSWER BANK` | Splits file; hidden in practice | Marking scheme |

---

## 1. Comprehension Passages & Shared Text

Since the file is markdown, you simply **write the passage as regular text**. Multiple paragraphs are supported — just leave a blank line between them, exactly as you would in any markdown document.

### ⚠️ Critical: The A–F Paragraph Rule

The system has a special rule: any paragraph whose **first word starts with `A.`, `B.`, `C.`, `D.`, `E.`, or `F.` followed by a space** is treated as an MCQ answer option and given left-border styling. Additionally, in Practice Mode, those lines are converted into radio buttons.

**This means passage text must NEVER start a paragraph with one of those patterns.**

---

## 2. Multiple Choice Questions (MCQ)

Write the question as a numbered item. List the options directly below, each starting with an uppercase letter (`A.` through `F.`) followed by a space. **Do not add blank lines between the question and its options.**

The system will **automatically** detect the A–F pattern and convert them to interactive radio buttons — no special tag needed.

---

## 3. Essay / Long Answer Questions

Use the `[ESSAY]` tag anywhere in the question line. This renders a large, resizable text area.

---

## 4. Structured / Short Answer Questions

Use the `[STRUCTURED]` tag for questions requiring a brief, specific answer — a name, a definition, a list of items in a single response.

---

## 5. Calculation Questions (Maths / Physics)

Use `[CALC]` for questions requiring numerical or algebraic working. Students enter **only the final answer**.

---

## 6. Mathematical Formulas (LaTeX)

LaTeX is fully supported. Use single `$` for inline math and double `$$` for display (block) math.

> [!WARNING]
> Do NOT use `$` to represent currency (e.g. `$250`). Use `USD 250` or `₦250` instead, as a lone `$` will be parsed as the start of a LaTeX math expression and may render incorrectly.

---

## 7. Diagrams & Images

Since images cannot be embedded directly in the markdown text, use a placeholder in the format `[DIAGRAM:your_label]`. Use a descriptive, lowercase label with underscores. The label should usually contain the year and question number (e.g. `[DIAGRAM:math_2023_q3]`).

---

## 8. Tables

Standard markdown tables work correctly and are useful for data-response questions.

---

## 9. The Answer Bank (Marking Scheme)

Add your answers and rubric at the **very end** of the file, separated by a heading that includes the word `ANSWERS` or `ANSWER BANK`. Everything below this heading is:
- Hidden in Practice Mode (students cannot see it while answering)
- Sent to the AI grader to mark the student's submission
- Shown in the "Answer Bank" tab in Read Mode

**The heading must be exactly one of:**
- `## ANSWERS`
- `## ANSWER BANK`

**MCQ answers:** Just the letter.
**Essay/Structured rubrics:** Use `**Rubric:**` followed by key points.
**Calculation answers:** Use `**Answer:**` followed by the exact value.
"""

PROMPT_TEMPLATE = f"""
You are an expert OCR and formatting assistant for an educational platform. I am providing you with the raw markdown extracted from a scanned past paper (PDF) using a specialized layout-aware OCR tool. Your task is to process this raw text and convert it into a perfectly formatted Markdown file according to our strict formatting guide.

You must:
1. Fix any minor OCR errors (e.g., garbled characters, broken words, mis-read numbers).
2. Correctly format all mathematical equations using LaTeX (e.g. `$x^2$` for inline, `$$x = 2$$` for block).
3. Insert `[DIAGRAM:label]` placeholders wherever a diagram, graph, or image appears to have been in the original paper (or is mentioned). Use a descriptive label like `[DIAGRAM:subject_year_q5]`.
4. Apply the appropriate tags (`[ESSAY]`, `[STRUCTURED]`, `[CALC]`) depending on the type of question.
5. Extract or generate the answers and place them at the very end of the file under the exact heading `## ANSWERS`.
6. Ensure MCQ options immediately follow their question without blank lines, starting with A., B., C., D.

CRITICAL ORDERING RULE — You MUST follow this without exception:
- The entire QUESTIONS section must come first.
- The `## ANSWERS` section must come LAST, after every single question.
- Never interleave answers with questions.
- This applies to ALL question types including fill-in-the-gap passages.

FILL-IN-THE-GAP / CLOZE PASSAGE RULES:
Some comprehension passages have numbered blanks inline (e.g. —75—, —76—, or [75], [76]).
Each blank has its own set of MCQ options listed below the passage.
You MUST format these as follows:
- Write the full passage as regular text, keeping the numbered blank markers intact (e.g. —75—).
- After the passage, write each blank as a numbered question with its MCQ options immediately below it.
  Example:
  ```
  75.  Which word best fits blank 75?
  A. tracksuit
  B. track suit
  C. swim suit
  D. shell suit
  ```
- Do NOT split the passage or interleave options inside the passage text.
- All the gap-fill questions for a passage must appear AFTER the passage text but BEFORE the `## ANSWERS` section.
- In the `## ANSWERS` section, list the correct letter for each blank number.

Here is the full Formatting Guide you MUST follow:

{PAST_PAPER_GUIDE}

Focus on giving me ONLY the final Markdown document as your output, with no additional conversational text.

RAW EXTRACTED MARKDOWN:
"""

# Use a GPU and increased timeout since MinerU processing can be heavy
@app.cls(image=image, gpu="T4", timeout=600, scaledown_window=300, secrets=[modal.Secret.from_name("custom-secret")])
class PaperProcessor:
    @modal.enter()
    def setup(self):
        # 1. Initialize MinerU config file if missing
        import os
        import json
        
        home_dir = os.path.expanduser('~')
        config_path = os.path.join(home_dir, 'magic-pdf.json')

        if not os.path.exists(config_path):
            default_config = {
                "bucket_name": "magic-pdf",
                "models-dir": os.path.join(home_dir, ".cache/huggingface/hub"),
                "device-mode": "cuda",
                "table-config": {
                    "is_table_recog_enable": True,
                    "max_time": 400
                }
            }
            with open(config_path, 'w', encoding='utf-8') as f:
                json.dump(default_config, f, indent=4)
            print(f"Created config at: {config_path}")

    @modal.method()
    def process_pdf(self, paper_id: str, pdf_bytes: bytes) -> str:
        # Save bytes to temp file
        temp_pdf = f"/tmp/{paper_id}.pdf"
        temp_out = f"/tmp/{paper_id}_out"
        
        with open(temp_pdf, "wb") as f:
            f.write(pdf_bytes)
            
        print(f"Running MinerU extraction on {temp_pdf}...")
        
        # We can just use the magic-pdf CLI which is installed in the path
        cmd = f"magic-pdf -p \"{temp_pdf}\" -o \"{temp_out}\""
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        
        if result.returncode != 0:
            print(f"MinerU Error: {result.stderr}")
            raise Exception("MinerU extraction failed")
            
        # Locate the generated markdown file
        raw_markdown = ""
        if os.path.exists(temp_out):
            for root, _, filenames in os.walk(temp_out):
                for f in filenames:
                    if f.endswith('.md'):
                        with open(os.path.join(root, f), 'r', encoding='utf-8') as src:
                            raw_markdown = src.read()
                        break
                        
        if not raw_markdown:
            raise Exception("MinerU did not output any markdown file.")
            
        print("MinerU extraction complete. Running Gemini formatting...")
        
        # 2. Process with Gemini
        from google import genai
        
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY secret is not set.")
            
        client = genai.Client(api_key=api_key)
        
        response = client.models.generate_content(
            model='gemini-1.5-pro',
            contents=PROMPT_TEMPLATE + "\n\n" + raw_markdown
        )
        
        final_markdown = response.text
        
        # Clean markdown wrappers if present
        if final_markdown.startswith("```markdown"):
            final_markdown = final_markdown[11:]
            if final_markdown.endswith("```"):
                final_markdown = final_markdown[:-3]
        elif final_markdown.startswith("```"):
            final_markdown = final_markdown[3:]
            if final_markdown.endswith("```"):
                final_markdown = final_markdown[:-3]
                
        final_markdown = final_markdown.strip()
        
        # 3. Update Database
        print(f"Updating database for paper {paper_id}...")
        from sqlmodel import Session, create_engine, text
        
        db_url = os.environ.get("DATABASE_URL")
        if not db_url:
            raise ValueError("DATABASE_URL secret is not set.")
            
        engine = create_engine(db_url)
        with Session(engine) as session:
            # Use session.execute() for raw SQL text (session.exec() is for SQLModel queries)
            session.execute(
                text("UPDATE pastpaper SET content = :content WHERE id = :id"),
                {"content": final_markdown, "id": paper_id}
            )
            session.commit()
            
        print("Database updated successfully.")
        
        # Cleanup
        try:
            os.remove(temp_pdf)
            shutil.rmtree(temp_out)
        except Exception:
            pass
            
        return "Success"

# Define the webhook that FastAPI will call asynchronously
# Must use same image and secrets so it can spawn the PaperProcessor class
@app.function(image=image, secrets=[modal.Secret.from_name("custom-secret")])
@modal.fastapi_endpoint(method="POST")
async def process_paper_endpoint(request: Request):
    """
    Accepts multipart/form-data with 'paper_id' and 'file'.
    Spawns the background task on the GPU class and returns immediately.
    """
    form = await request.form()
    paper_id = form.get("paper_id")
    file_obj = form.get("file")
    
    if not paper_id or not file_obj:
        raise HTTPException(status_code=400, detail="paper_id and file are required")
        
    pdf_bytes = await file_obj.read()
    
    # Spawn the GPU processing task in the background and return 202 immediately
    PaperProcessor().process_pdf.spawn(paper_id, pdf_bytes)
    
    return Response(content=f"Processing started for {paper_id}", status_code=202)

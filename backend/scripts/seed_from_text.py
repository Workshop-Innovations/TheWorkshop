from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
"""
Standalone parser for TheWorkshop Mathematics course content.
This script reads subjects.txt and populates the database directly,
without importing from the app modules.
"""
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

import os
import re
from typing import Optional, List
from sqlmodel import Field, Session, SQLModel, select, delete, Relationship

import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.models import Subject, Topic, PastPaper, User
from app.database import engine

CONTENT_FILE = Path(__file__).resolve().parents[1] / "data/imports/subjects.txt"

KNOWN_TITLES = {
    "1": "Number and Numeration",
    "2": "Algebraic Processes",
    "3": "Mensuration",
    "4": "Geometry",
    "5": "Trigonometry",
    "6": "Introductory Calculus",
    "7": "Statistics and Probability",
}


def read_content():
    """Read the raw content from subjects.txt"""
    with open(CONTENT_FILE, "r", encoding="utf-8") as f:
        return f.read()


def format_content(content):
    """
    Apply heuristics to format the dense text into readable Markdown.
    Used for topic/subject summaries (subjects.txt).
    """

    content = re.sub(r"([a-z0-9])([A-Z])", r"\1\n\n\2", content)

    keywords_h2 = ["Section A:", "Section B:", "Objectives", "Theory"]
    for kw in keywords_h2:
        content = re.sub(f"({kw})", r"\n\n## \1", content)

    content = re.sub(r"(SECTION [A-Z] - [^\n]+)", r"\n\n## \1", content)

    metadata_keys = ["Time Allowed:", "Total Marks:", "Instructions:"]
    for key in metadata_keys:
        content = re.sub(f"({key})", r"\n\n**\1**", content)

    content = re.sub(r"(Sub-Topic [A-Z]:)", r"\n\n### \1", content)

    keywords_bold = ["Definition:", "Example:", "Solution:", "Note:"]
    for kw in keywords_bold:
        content = re.sub(f"({kw})", r"\n\n**\1**", content)

    content = re.sub(r"([\.\?!])([A-D]\.)", r"\1\n\n\2 ", content)
    content = re.sub(r"\s([A-D]\.)\s", r"\n\n\1 ", content)

    content = re.sub(r"([\.\?!])\s*(\d+\.)", r"\1\n\n\2", content)
    content = re.sub(r"\n\s*(\d+\.)", r"\n\n\1", content)

    content = content.replace("Mathematics Stock Note", "")

    content = content.replace("$$", "\n\n$$\n\n")

    content = re.sub(r"\n([A-Z][a-zA-Z -]+):", r"\n\n**\1:**", content)

    content = re.sub(r":([^\s\d])", r": \1", content)

    return content.strip()


def format_past_paper(content):
    """
    Lightly format past paper content, preserving LaTeX math ($...$)
    and producing clean, readable Markdown.

    The key rule: DO NOT escape or transform dollar signs — they are
    LaTeX inline-math delimiters and must reach the frontend unmodified.
    """

    content = content.replace("\r\n", "\n").replace("\r", "\n")

    content = re.sub(r"\n([A-D]\.\s)", r"\n\n\1", content)

    content = re.sub(r"\n(\d+\.\s)", r"\n\n\1", content)

    content = re.sub(r"^(SECTION [A-Z][^\n]*)", r"## \1", content, flags=re.MULTILINE)
    content = re.sub(
        r"^(ANSWER BANK.*)", r"## \1", content, flags=re.MULTILINE | re.IGNORECASE
    )

    for key in [
        "Year:",
        "Paper Type:",
        "Time Allowed:",
        "Total Marks:",
        "Instructions:",
    ]:
        content = re.sub(
            rf"^({re.escape(key)})", r"**\1**", content, flags=re.MULTILINE
        )

    content = re.sub(r"\n{3,}", "\n\n", content)

    return content.strip()


def parse_mathematics_content(raw_content):
    """
    Parse the Mathematics course content using known titles.
    """
    topics = []

    markers = []
    for num, title in KNOWN_TITLES.items():
        pattern = re.compile(rf"Topic {num}:\s*{re.escape(title)}")
        match = pattern.search(raw_content)
        if match:
            markers.append((match.start(), num, title))

    markers.sort(key=lambda x: x[0])

    print(f"Found {len(markers)} topic markers")

    for i in range(len(markers)):
        start_pos, num, title = markers[i]

        if i + 1 < len(markers):
            end_pos = markers[i + 1][0]
        else:
            end_pos = len(raw_content)

        chunk = raw_content[start_pos:end_pos]

        header_pattern = re.compile(
            rf"Topic {num}:\s*{re.escape(title)}", re.IGNORECASE
        )
        content_body = header_pattern.sub("", chunk, count=1).strip()

        formatted_content = format_content(content_body)

        topics.append((title, formatted_content))
        print(f"  Parsed Topic {num}: {title} ({len(formatted_content)} chars)")

    return topics


def seed_database(topics, past_papers):
    """Seed the database with the parsed content"""

    SQLModel.metadata.create_all(engine)

    with Session(engine) as session:

        subject = session.exec(
            select(Subject).where(Subject.name == "Mathematics")
        ).first()
        if not subject:
            subject = Subject(
                name="Mathematics",
                description="Comprehensive Mathematics course covering Number and Numeration, Algebra, Mensuration, Geometry, Trigonometry, Calculus, and Statistics.",
            )
            session.add(subject)
            session.commit()
            session.refresh(subject)
            print("\nCreated Mathematics subject")
        else:
            print(f"\nFound existing Mathematics subject (ID: {subject.id})")

        statement = delete(Topic).where(Topic.subject_id == subject.id)
        session.exec(statement)

        statement_papers = delete(PastPaper).where(PastPaper.subject_id == subject.id)
        session.exec(statement_papers)

        session.commit()
        print(f"\nDeleted existing topics and past papers for {subject.name}")

        for order, (topic_name, content) in enumerate(topics, start=1):
            new_topic = Topic(
                subject_id=subject.id,
                title=topic_name,
                summary_content=content,
                order=order,
            )
            session.add(new_topic)
            print(f"  Created Topic: {topic_name} ({len(content)} chars)")

        for paper in past_papers:
            new_paper = PastPaper(
                subject_id=subject.id,
                title=paper["title"],
                year=paper["year"],
                exam_type=paper["exam_type"],
                content=paper["content"],
                file_path=None,
            )
            session.add(new_paper)
            print(f"  Created Paper: {paper['title']} ({len(paper['content'])} chars)")

        session.commit()
        print("\n=== Database seeding complete! ===")


def main():
    print("=" * 50)
    print("Mathematics Course Content Parser (Refined)")
    print("=" * 50)

    if not os.path.exists(CONTENT_FILE):
        print(f"\nERROR: {CONTENT_FILE} not found!")
        print("Please create subjects.txt with your content.")
        return

    print(f"\nReading content from {CONTENT_FILE}...")
    raw_content = read_content()
    print(f"Read {len(raw_content):,} characters\n")

    print("Parsing topics...")
    topics = parse_mathematics_content(raw_content)

    past_papers = []
    past_papers_file = (
        Path(__file__).resolve().parents[1] / "data/imports/past_papers_content.txt"
    )
    if os.path.exists(past_papers_file):
        with open(past_papers_file, "r", encoding="utf-8") as f:
            pp_content = f.read().strip()
            if pp_content:
                formatted_pp = format_past_paper(pp_content)

                past_papers.append(
                    {
                        "title": "Mathematics Past Questions 2024",
                        "year": "2024",
                        "exam_type": "WAEC",
                        "content": formatted_pp,
                    }
                )
                print(f"  Parsed Past Papers ({len(formatted_pp)} chars)")

    if not topics and not past_papers:
        print("\nNo content found! Check files.")
        return

    print("\nSeeding database...")
    seed_database(topics, past_papers)


if __name__ == "__main__":
    main()
